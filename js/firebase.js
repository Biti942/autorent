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

// Fonction pour obtenir le rôle de l'utilisateur
window.getUserRole = async function() {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const userDoc = await db.collection('users').doc(user.uid).get();
    return userDoc.exists ? userDoc.data().role : null;
  } catch (error) {
    console.error('Erreur lors de la récupération du rôle :', error);
    return null;
  }
};

// Fonction pour mettre à jour l'abonnement
window.updateSubscription = async function(paymentDetails) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await db.collection('users').doc(user.uid).update({
      subscriptionActive: true,
      subscriptionDate: firebase.firestore.FieldValue.serverTimestamp(),
      paymentDetails: paymentDetails
    });
    console.log('Abonnement mis à jour avec succès');
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'abonnement :', error);
  }
};

// Fonction de base pour charger les voitures (à personnaliser selon les besoins)
window.loadCars = async function(filters = {}) {
  const { priceRange, location } = filters;
  let query = db.collection('cars').where('available', '==', true);

  if (priceRange) {
    const [min, max] = priceRange.split('-');
    if (max) {
      query = query.where('price', '>=', parseInt(min)).where('price', '<=', parseInt(max));
    } else {
      query = query.where('price', '>=', parseInt(min));
    }
  }
  if (location) {
    query = query.where('location', '==', location.toLowerCase());
  }

  try {
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erreur lors du chargement des voitures :', error);
    return [];
  }
};
