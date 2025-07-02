// Vérifier la disponibilité de Firebase avant tout
if (typeof firebase === 'undefined') {
  console.error('Firebase SDK non chargé. Vérifiez les scripts CDN dans votre HTML.');
  throw new Error('Firebase non disponible. Arrêt du script.');
}

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

// Initialiser Firebase avec gestion d'erreur
let firebaseApp;
try {
  if (!firebase.apps.length) {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialisé avec succès.');
  } else {
    firebaseApp = firebase.app(); // Réutiliser l'instance existante
  }
} catch (error) {
  console.error('Erreur lors de l\'initialisation de Firebase :', error.message);
  throw new Error('Initialisation Firebase échouée. Vérifiez la configuration.');
}

// Initialisation des services avec vérification
const auth = firebaseApp.auth();
const db = firebaseApp.firestore();
const storage = firebaseApp.storage();

if (!auth || !db || !storage) {
  console.error('Un ou plusieurs services Firebase non disponibles :', { auth, db, storage });
  throw new Error('Services Firebase non initialisés.');
}

// Exposer globalement
window.auth = auth;
window.db = db;
window.storage = storage;

// Fonction pour obtenir le rôle de l'utilisateur
window.getUserRole = async function() {
  const user = auth.currentUser;
  if (!user) {
    console.warn('Aucun utilisateur connecté.');
    return null;
  }
  try {
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (!userDoc.exists) {
      console.warn('Document utilisateur non trouvé pour UID:', user.uid);
      await db.collection('users').doc(user.uid).set({ role: 'user' }, { merge: true }); // Créer par défaut
      return 'user';
    }
    const role = userDoc.data().role;
    return role || 'user'; // Retourner 'user' si rôle non défini
  } catch (error) {
    console.error('Erreur lors de la récupération du rôle :', error);
    return null;
  }
};

// Fonction pour mettre à jour l'abonnement
window.updateSubscription = async function(paymentDetails) {
  const user = auth.currentUser;
  if (!user) {
    console.warn('Aucun utilisateur connecté pour mettre à jour l\'abonnement.');
    return;
  }
  if (!paymentDetails || typeof paymentDetails !== 'object') {
    console.error('Détails de paiement invalides :', paymentDetails);
    return;
  }
  try {
    await db.collection('users').doc(user.uid).set({
      subscriptionActive: true,
      subscriptionDate: firebase.firestore.FieldValue.serverTimestamp(),
      paymentDetails: paymentDetails
    }, { merge: true });
    console.log('Abonnement mis à jour avec succès pour UID:', user.uid);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'abonnement :', error);
  }
};

// Fonction pour charger les voitures
window.loadCars = async function(filters = {}) {
  const { priceRange, location } = filters;
  let query = db.collection('cars').where('available', '==', true);

  if (priceRange) {
    const [min, max] = priceRange.split('-');
    if (max) {
      query = query.where('price', '>=', parseInt(min)).where('price', '<=', parseInt(max));
    } else if (min) {
      query = query.where('price', '>=', parseInt(min));
    }
  }
  if (location) {
    query = query.where('location', '>=', location.toLowerCase()).where('location', '<=', location.toLowerCase() + '\uf8ff');
  }

  try {
    const snapshot = await query.get();
    if (snapshot.empty) {
      console.warn('Aucune voiture trouvée avec les filtres appliqués.');
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erreur lors du chargement des voitures :', error);
    return [];
  }
};