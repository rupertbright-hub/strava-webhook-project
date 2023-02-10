// const admin = require('firebase-admin');

// admin.initializeApp();

// const defaultDatabase = admin.database()

// async function checkTokenDate (req, response) {
//     const currentTime = new Date().getTime();
//     // var diffHours = Math.abs(currentTime - date2) / 36e5
//     try {
//         console.log('try', defaultDatabase)
//     const snapshot = await defaultDatabase.ref('/athlete_id').get();
//     snapshot.forEach((doc) => {
//     console.log(doc.id, '=>', doc.data());
//     });

// }catch(e) {
//     console.log(e)
// }
// }


// module.exports = { checkTokenDate };
