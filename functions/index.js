const functions = require("firebase-functions");
const { initializeApp } = require("firebase/app")
const { doc, setDoc, getDoc, getFirestore, collection, addDoc } = require('firebase/firestore');
const express = require('express');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

const firebaseConfig = {
  apiKey: "AIzaSyDBr73cMlJ0T4oxDpYptgnyHCWzeUyDN60",
  authDomain: "strava-activity-upload-v2.firebaseapp.com",
  projectId: "strava-activity-upload-v2",
  storageBucket: "strava-activity-upload-v2.appspot.com",
  messagingSenderId: "322295282533",
  appId: "1:322295282533:web:84012b4e0e2307a72aff8c",
  measurementId: "G-52V1G53V7D"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function accessSecretVersion(secretId) {
  const [version] = await client.accessSecretVersion({
    name: `projects/322295282533/secrets/${secretId}/versions/latest`
  });
  const secretValue = version.payload.data.toString();
  return secretValue
}

async function refreshStravaToken(CLIENT_ID, CLIENT_SECRET, refreshToken) {
  const grantType = 'refresh_token';

  const response = await fetch('https://www.strava.com/api/v3/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=${grantType}&refresh_token=${refreshToken}`,
  });

  const data = await response.json();
  return data
}

async function getActivity(object_id, access_token) {
  try {
    const response = await fetch(`https://www.strava.com/api/v3/activities/${object_id}`, {
      headers: {
        'Authorization': 'Bearer ' + access_token
      }
    });

    if (!response.ok) {
      throw new Error("Authorization Error");
    }

    const data = await response.json();
    const event = {
      name: data.name,
      distance: data.distance,
      moving_time: data.moving_time,
      elapsed_time: data.elapsed_time,
    };

    await addDoc(collection(db, "activities"), event);
    return { message: 'Activity data processed successfully' };
  } catch (error) {
    return { error: error.message };
  }
}

const app1 = express()
app1.use(express.json());


app1.post("/", async (req, res) => {
  const { object_id, aspect_type } = req.body;

  if (aspect_type !== 'create') {
    return res.send({ message: 'Not a create event!' });
  }

  const docRef = doc(db, "access_token", 'token');
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists) {
    return res.status(500).send({ error: 'Document not found in Firestore' });
  }

  const activity = await getActivity(object_id, docSnap.data().access_token);

  if (activity.error && activity.error === "Authorization Error") {
    try {
      const client_id = await accessSecretVersion("CLIENT_ID");
      const client_secret = await accessSecretVersion("CLIENT_SECRET");
      const refreshToken = docSnap.data().refresh_token;
      const token = await refreshStravaToken(client_id, client_secret, refreshToken);

      const event = {
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_at: token.expires_at
      };

      await setDoc(doc(db, "access_token", 'token'), event);
    } catch (error) {
      return res.status(500).send({ error: 'Error refreshing Strava token' });
    }

    const updatedDocSnap = await getDoc(docRef);
    const updatedActivity = await getActivity(object_id, updatedDocSnap.data().access_token);

    if (updatedActivity.error) {
      return res.status(500).send({ error: updatedActivity.error });
    }
  } else if (activity.error) {
    console.log(activity.error)
    return res.status(500).send({ error: activity.error });
  }

  return res.send({ message: activity.message });
});

const api = functions.https.onRequest(app1)

module.exports = {
  api
}