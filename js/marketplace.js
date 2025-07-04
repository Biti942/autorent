import { auth, db } from './js/firebase.js';
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const logoutBtn = document.getElementById("logout-btn");
logoutBtn.addEventListener("click", () => {
  signOut(auth)
    .then(() => window.location.href = "index.html")
    .catch((error) => alert("Erreur déconnexion : " + error.message));
});

onAuthStateChanged(auth, (user) => {
  if (!user) return window.location.href = "connexion.html";
});

async function loadCars(filters = {}) {
  const carList = document.getElementById("car-list");
  carList.innerHTML = "<p>Chargement des voitures...</p>";

  try {
    let q = query(collection(db, "cars"), where("available", "==", true));

    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split("-");
      q = query(q, where("price", ">=", parseInt(min)));
      if (max) {
        q = query(q, where("price", "<=", parseInt(max)));
      }
    }

    if (filters.location) {
      const loc = filters.location.toLowerCase();
      q = query(q,
        where("location", ">=", loc),
        where("location", "<=", loc + "\uf8ff")
      );
    }

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      carList.innerHTML = "<p>Aucune voiture trouvée.</p>";
      return;
    }

    const cars = snapshot.docs.map(doc => doc.data());

    carList.innerHTML = cars.map(car => `
      <div class="car-card">
        <h3>${car.name}</h3>
        <p>${car.description}</p>
        <p>Prix : ${car.price} MAD</p>
        <p>Lieu : ${car.location}</p>
      </div>
    `).join("");

  } catch (error) {
    console.error("Erreur chargement voitures :", error);
    carList.innerHTML = "<p>Erreur lors du chargement.</p>";
  }
}

window.applyFilters = function () {
  const location = document.getElementById("location").value;
  const priceRange = document.getElementById("priceRange").value;
  loadCars({ location, priceRange });
};

loadCars();
