const admin = require('firebase-admin');
const serviceAccount = require('./firebase-adminsdk.json'); // Replace with the path to your downloaded JSON file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://real-score-website.firebaseio.com' // Replace with your Firebase Database URL
});

const db = admin.firestore();

module.exports = db;
