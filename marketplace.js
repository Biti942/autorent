import { db } from './js/firebase.js';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

let filters = {};
let lastVisible = null;
let isLoading = false;
const carList = document.getElementById("car-list");
const loader = document.getElementById("loader");

async function loadCars(isNewSearch = false) {
  if (isLoading) return;
  isLoading = true;
  loader.style.display = "block";

  try {
    let q = query(collection(db, "cars"), where("available", "==", true), orderBy("price"), limit(6));

    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split("-");
      q = query(q, where("price", ">=", parseInt(min)));
      if (max) q = query(q, where("price", "<=", parseInt(max)));
    }

    if (filters.location) {
      const loc = filters.location.toLowerCase();
      q = query(q,
        where("location", ">=", loc),
        where("location", "<=", loc + "\uf8ff")
      );
    }

    if (lastVisible && !isNewSearch) {
      q = query(q, startAfter(lastVisible));
    }

    const snapshot = await getDocs(q);

    if (isNewSearch) carList.innerHTML = "";

    if (snapshot.empty) {
      loader.style.display = "none";
      if (isNewSearch) carList.innerHTML = "<p>Aucune voiture trouvée.</p>";
      return;
    }

    lastVisible = snapshot.docs[snapshot.docs.length - 1];

    snapshot.forEach(doc => {
      const car = doc.data();
      const div = document.createElement("div");
      div.className = "car-card";
      div.innerHTML = `
        <h3>${car.name}</h3>
        <p>${car.description}</p>
        <p><strong>${car.price} MAD</strong></p>
        <p>${car.location}</p>
      `;
      carList.appendChild(div);
    });

  } catch (error) {
    console.error("Erreur de chargement :", error);
    if (isNewSearch) carList.innerHTML = "<p>Erreur lors du chargement.</p>";
  }

  loader.style.display = "none";
  isLoading = false;
}

// Filters logic
window.applyFilters = function () {
  const location = document.getElementById("location").value.trim();
  const priceRange = document.getElementById("priceRange").value;
  filters = { location, priceRange };
  lastVisible = null;
  loadCars(true);
};

// Infinite scroll
const observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) {
    loadCars();
  }
}, {
  rootMargin: "100px",
});

observer.observe(loader);

// Initial load
loadCars();

