// js/firebase.js (modulaire - version corrigée)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, getDocs, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
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

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Exposer globalement si besoin
window.auth = auth;
window.db = db;
window.storage = storage;

// Obtenir le rôle de l'utilisateur
window.getUserRole = async function () {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn("Aucun utilisateur connecté.");
        resolve(null);
        return;
      }
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, { role: "user" }, { merge: true });
          resolve("user");
        } else {
          const data = userSnap.data();
          resolve(data.role || "user");
        }
      } catch (error) {
        console.error("Erreur rôle utilisateur :", error);
        reject(error);
      }
    });
  });
};

// Mettre à jour l'abonnement
window.updateSubscription = async function (paymentDetails) {
  const user = auth.currentUser;
  if (!user) {
    console.warn("Aucun utilisateur connecté.");
    return;
  }
  try {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      subscriptionActive: true,
      subscriptionDate: serverTimestamp(),
      paymentDetails
    }, { merge: true });
    console.log("Abonnement mis à jour avec succès.");
  } catch (error) {
    console.error("Erreur mise à jour abonnement :", error);
  }
};

// Charger les voitures
window.loadCars = async function (filters = {}) {
  const carsRef = collection(db, "cars");
  let q = query(carsRef, where("available", "==", true));

  const { priceRange, location } = filters;

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
    // Firestore doesn't support "contains" for string, so simulate with range
    q = query(q,
      where("location", ">=", location.toLowerCase()),
      where("location", "<=", location.toLowerCase() + '\uf8ff')
    );
  }

  try {
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.warn("Aucune voiture trouvée.");
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Erreur chargement voitures :", error);
    return [];
  }
};
