// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, getDocs, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDcSbsP-ylos5DC-oHUuyB-PFG6rnNhvJk",
  authDomain: "autorent-7b992.firebaseapp.com",
  projectId: "autorent-7b992",
  storageBucket: "autorent-7b992.appspot.com",
  messagingSenderId: "824292845635",
  appId: "1:824292845635:web:2eb167bad2c9ac4666ccf6",
  measurementId: "G-DC3BM6BZVG"
};

// Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Fonctions utilitaires
const getUserRole = async () => {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) return resolve(null);
      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, { role: "user" }, { merge: true });
          return resolve("user");
        }
        resolve(snap.data().role || "user");
      } catch (err) {
        reject(err);
      }
    });
  });
};

const updateSubscription = async (paymentDetails) => {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      subscriptionActive: true,
      subscriptionDate: serverTimestamp(),
      paymentDetails
    }, { merge: true });
  } catch (err) {
    console.error("Erreur abonnement :", err);
  }
};

const loadCars = async (filters = {}) => {
  let q = query(collection(db, "cars"), where("available", "==", true));
  const { priceRange, location } = filters;

  if (priceRange) {
    const [min, max] = priceRange.split("-");
    if (max) {
      q = query(q, where("price", ">=", +min), where("price", "<=", +max));
    } else {
      q = query(q, where("price", ">=", +min));
    }
  }

  if (location) {
    q = query(q,
      where("location", ">=", location.toLowerCase()),
      where("location", "<=", location.toLowerCase() + "\uf8ff")
    );
  }

  try {
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Erreur chargement voitures :", err);
    return [];
  }
};

// ✅ Export PRO
export { auth, db, storage, getUserRole, updateSubscription, loadCars };
