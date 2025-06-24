// js/firebase.js

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDcSbsP-ylos5DC-oHUuyB-PFG6rnNhvJk",
  authDomain: "autorent-7b992.firebaseapp.com",
  projectId: "autorent-7b992",
  storageBucket: "autorent-7b992.appspot.com",
  messagingSenderId: "824292845635",
  appId: "1:824292845635:web:2eb167bad2c9ac4666ccf6",
  measurementId: "G-DC3BM6BZVG"
};

// Initialiser Firebase si ce n'est pas déjà fait
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialisation des services Firebase
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Exposer globalement pour les autres fichiers
window.auth = auth;
window.db = db;
window.storage = storage;

