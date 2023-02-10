// const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
// const client = new SecretManagerServiceClient();


async function accessSecretVersion(secretId) {
  const [version] = await client.accessSecretVersion({
    name: `projects/322295282533/secrets/${secretId}/latest`
  });
  const secretValue = version.payload.data.toString();
  console.log(`Secret Value: ${secretValue}`);
  return secretValue
}

// const { fetch } = require('node-fetch');

async function getActivity(object_id, access_token) {
  try {
    const response = await fetch(`https://www.strava.com/api/v3/activities/${object_id}`, {
      headers: {
        'Authorization': 'Bearer ' + access_token
      }
    });
    const activity = await response.json();
    return activity
  } catch (error) {
    console.error(error);
    return error
  }
}

async function refreshToken() {
  // const clientId = accessSecretVersion('CLIENT_ID');
  // const clientSecret = accessSecretVersion('CLIENT_SECRET');
  const grantType = 'refresh_token';
  const refreshToken = 'ReplaceWithRefreshToken';

  const response = await fetch('https://www.strava.com/api/v3/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=${grantType}&refresh_token=${refreshToken}`,
  });

  const data = await response.json();
  console.log(data);
}

module.exports = {
  getActivity
}


