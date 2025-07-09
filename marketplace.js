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

async function loadCars(isNewSearch = false) {
  if (isLoading) return;
  isLoading = true;
  loader.style.display = "block";

  try {
    let baseQuery = collection(db, "cars");
    const constraints = [where("available", "==", true)];

    // Prix
    if (filters.priceRange) {
      if (filters.priceRange === "1000+") {
        constraints.push(where("price", ">", 1000));
      } else {
        const [min, max] = filters.priceRange.split("-");
        constraints.push(where("price", ">=", parseInt(min)));
        if (max) constraints.push(where("price", "<=", parseInt(max)));
      }
    }

    // Ville
    if (filters.location) {
      const loc = filters.location.toLowerCase();
      constraints.push(where("location", ">=", loc));
      constraints.push(where("location", "<=", loc + "\uf8ff"));
    }

    // Type
    if (filters.carType) {
      constraints.push(where("type", "==", filters.carType));
    }

    // Transmission
    if (filters.transmission) {
      constraints.push(where("transmission", "==", filters.transmission));
    }

    // Tri
    const order = filters.sortOrder === "desc" ? "desc" : "asc";
    constraints.push(orderBy("price", order));

    // Pagination
    if (lastVisible && !isNewSearch) {
      constraints.push(startAfter(lastVisible));
    }

    const finalQuery = query(baseQuery, ...constraints, limit(6));
    const snapshot = await getDocs(finalQuery);

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
        <img src="${car.image || 'https://via.placeholder.com/300x200'}" alt="${car.name}">
        <div class="car-info">
          <h3>${car.name}</h3>
          <p class="description">${car.description}</p>
          <p><strong>${car.price} MAD</strong> - ${car.location}</p>
          <div class="tags">
            <span class="badge">${car.type}</span>
            <span class="badge">${car.transmission}</span>
          </div>
          <button class="reserve-btn">Réserver</button>
        </div>
      `;
      carList.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    if (isNewSearch) carList.innerHTML = "<p>Erreur lors du chargement.</p>";
  }

  loader.style.display = "none";
  isLoading = false;
}

window.applyFilters = function () {
  filters = {
    location: document.getElementById("location").value.trim(),
    priceRange: document.getElementById("priceRange").value,
    carType: document.getElementById("carType").value,
    transmission: document.getElementById("transmission").value,
    sortOrder: document.getElementById("sortOrder").value
  };
  lastVisible = null;
  loadCars(true);
};

const observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) loadCars();
}, { rootMargin: "100px" });

observer.observe(loader);
loadCars();
