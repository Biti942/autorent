// js/firebase.js (modulaire - version améliorée pour AutoRent)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDcSbsP-ylos5DC-oHUuyB-PFG6rnNhvJk",
  authDomain: "autorent-7b992.firebaseapp.com",
  projectId: "autorent-7b992",
  storageBucket: "autorent-7b992.appspot.com",
  messagingSenderId: "824292845635",
  appId: "1:824292845635:web:2eb167bad2c9ac4666ccf6",
  measurementId: "G-DC3BM6BZVG"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- Fonctions utiles ---

// Récupérer rôle utilisateur, ou créer profil minimal si inexistant
async function getUserRole() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        resolve(null);
        return;
      }
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, { role: "user", createdAt: serverTimestamp() });
          resolve("user");
        } else {
          const data = userSnap.data();
          resolve(data.role || "user");
        }
      } catch (error) {
        console.error("Erreur getUserRole:", error);
        reject(error);
      }
    });
  });
}

// Créer un nouvel utilisateur + profil Firestore
async function signUpUser(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    await setDoc(doc(db, "users", uid), {
      email,
      role: "user",
      createdAt: serverTimestamp(),
      subscriptionActive: false
    });
    return { success: true, uid };
  } catch (e) {
    let message = "Une erreur s'est produite.";
    if (e.code === "auth/email-already-in-use") message = "Cet email est déjà utilisé.";
    else if (e.code === "auth/invalid-email") message = "Adresse email invalide.";
    else if (e.code === "auth/weak-password") message = "Mot de passe trop faible.";
    return { success: false, message };
  }
}

// Connexion utilisateur avec gestion d’erreurs friendly
async function signInUser(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (e) {
    let message = "Une erreur s'est produite.";
    if (e.code === "auth/user-not-found") message = "Utilisateur non trouvé.";
    else if (e.code === "auth/wrong-password") message = "Mot de passe incorrect.";
    else if (e.code === "auth/invalid-email") message = "Adresse email invalide.";
    return { success: false, message };
  }
}

// Envoyer email réinitialisation mot de passe
async function sendPasswordReset(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// Mise à jour abonnement utilisateur (ex : après paiement réussi)
async function updateSubscription(paymentDetails) {
  const user = auth.currentUser;
  if (!user) return { success: false, message: "Utilisateur non connecté." };
  try {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      subscriptionActive: true,
      subscriptionDate: serverTimestamp(),
      paymentDetails
    }, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Charger voitures avec filtres avancés (prix, lieu, type, transmission, tri)
async function loadCars(filters = {}) {
  const carsRef = collection(db, "cars");
  let q = query(carsRef, where("available", "==", true));

  const { priceRange, location, type, transmission, orderByField, orderDirection } = filters;

  if (priceRange) {
    const [min, max] = priceRange.split("-");
    if (max) {
      q = query(carsRef,
        where("available", "==", true),
        where("price", ">=", parseInt(min)),
        where("price", "<=", parseInt(max))
      );
    } else if (min) {
      q = query(carsRef,
        where("available", "==", true),
        where("price", ">=", parseInt(min))
      );
    }
  }

  if (location) {
    q = query(q,
      where("location", ">=", location.toLowerCase()),
      where("location", "<=", location.toLowerCase() + '\uf8ff')
    );
  }

  if (type) {
    q = query(q, where("type", "==", type));
  }

  if (transmission) {
    q = query(q, where("transmission", "==", transmission));
  }

  if (orderByField) {
    q = query(q, orderBy(orderByField, orderDirection || "asc"), limit(50));
  }

  try {
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Erreur chargement voitures:", error);
    return [];
  }
}

// Déconnexion utilisateur
async function logoutUser() {
  await signOut(auth);
}

// Récupérer utilisateur actuel (promise)
function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

// Exports obligatoires et fonctions utiles
export {
  auth,
  db,
  storage,
  getUserRole,
  signUpUser,
  signInUser,
  sendPasswordReset,
  updateSubscription,
  loadCars,
  logoutUser,
  getCurrentUser,
  firebaseConfig
};
