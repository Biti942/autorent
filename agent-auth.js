import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getFirestore, doc, setDoc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { firebaseConfig } from './firebase.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const submitLogin = document.getElementById("submitLogin");
const submitSignup = document.getElementById("submitSignup");

loginBtn.addEventListener("click", () => {
  loginForm.classList.add("active");
  signupForm.classList.remove("active");
});
signupBtn.addEventListener("click", () => {
  signupForm.classList.add("active");
  loginForm.classList.remove("active");
});

submitLogin.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    Toastify({ text: "Connexion réussie !", duration: 3000, backgroundColor: "#4ade80" }).showToast();
    window.location.href = "confirmation-premium.html";
  } catch (err) {
    Toastify({ text: `Erreur: ${err.message}`, duration: 3000, backgroundColor: "#ef4444" }).showToast();
  }
});

submitSignup.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  const agencyName = document.getElementById("signupName").value;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await setDoc(doc(db, "utilisateurs", user.uid), {
      email: email,
      agencyName: agencyName,
      createdAt: new Date(),
      pack: "premium",
      solde: 0
    });
    await setDoc(doc(db, "abonnements", user.uid), {
      pack: "premium",
      solde: 0,
      startDate: new Date()
    });
    Toastify({ text: "Inscription réussie ! Bienvenue sur AutoRent 🚗", duration: 3000, backgroundColor: "#4ade80" }).showToast();
    window.location.href = "confirmation-premium.html";
  } catch (err) {
    Toastify({ text: `Erreur: ${err.message}`, duration: 3000, backgroundColor: "#ef4444" }).showToast();
  }
});

onAuthStateChanged(auth, user => {
  if (user) {
    window.location.href = "confirmation-premium.html";
  }
});

window.addEventListener("offline", () => {
  Toastify({ text: "Vous êtes hors ligne.", duration: -1, backgroundColor: "#ef4444" }).showToast();
});
window.addEventListener("online", () => {
  Toastify({ text: "Connexion rétablie.", duration: 3000, backgroundColor: "#4ade80" }).showToast();
});
