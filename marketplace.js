// marketplace.js
import { db } from './js/firebase.js';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  startAfter
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const carList = document.getElementById("car-list");
const loader = document.getElementById("loader");

let filters = {};
let lastVisible = null;
let isLoading = false;

// Chargement principal
async function loadCars(isNewSearch = false) {
  if (isLoading) return;
  isLoading = true;
  loader.style.display = "block";

  try {
    let baseQuery = query(
      collection(db, "cars"),
      where("available", "==", true),
      orderBy("price"),
      limit(6)
    );

    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split("-");
      baseQuery = query(baseQuery, where("price", ">=", parseInt(min)));
      if (max) baseQuery = query(baseQuery, where("price", "<=", parseInt(max)));
    }

    if (filters.location) {
      const loc = filters.location.toLowerCase();
      baseQuery = query(
        baseQuery,
        where("location", ">=", loc),
        where("location", "<=", loc + "\uf8ff")
      );
    }

    if (lastVisible && !isNewSearch) {
      baseQuery = query(baseQuery, startAfter(lastVisible));
    }

    const snapshot = await getDocs(baseQuery);

    if (isNewSearch) carList.innerHTML = "";

    if (snapshot.empty) {
      loader.style.display = "none";
      if (isNewSearch) carList.innerHTML = "<p>Aucune voiture trouvée.</p>";
      return;
    }

    lastVisible = snapshot.docs[snapshot.docs.length - 1];

    snapshot.forEach(doc => {
      const car = doc.data();
      carList.appendChild(createCarCard(car));
    });

  } catch (error) {
    console.error("Erreur Firestore :", error);
    carList.innerHTML = "<p>Une erreur est survenue. Réessaie plus tard.</p>";
  }

  loader.style.display = "none";
  isLoading = false;
}

// Création dynamique de carte voiture
function createCarCard(car) {
  const div = document.createElement("div");
  div.className = "car-card";

  div.innerHTML = `
    <div class="car-img-container">
      <img src="${car.imageUrl}" alt="${car.name}" class="car-img"/>
      <span class="location-badge">📍 ${car.location}</span>
    </div>
    <div class="car-info">
      <h3>${car.name}</h3>
      <p>${car.description}</p>
      <p><strong>${car.price} MAD/jour</strong></p>
      <button class="btn-reserver" onclick="window.alert('Fonction Réserver bientôt disponible')">Réserver</button>
    </div>
  `;

  return div;
}

// Filtres
window.applyFilters = function () {
  const location = document.getElementById("location").value.trim();
  const priceRange = document.getElementById("priceRange").value;
  filters = { location, priceRange };
  lastVisible = null;
  loadCars(true);
};

// Scroll infini
const observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) loadCars();
}, { rootMargin: "100px" });

observer.observe(loader);
loadCars();
