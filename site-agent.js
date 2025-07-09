const auth = firebase.auth();
const db = firebase.firestore();
let unsubscribeSnapshot = null;
let allCars = [];

auth.onAuthStateChanged(user => {
  if (!user) return window.location.href = "connexion.html";

  document.getElementById("agent-name").textContent = user.email;

  const searchInput = document.getElementById("searchInput");
  const shareBtn = document.getElementById("shareBtn");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const searchTerm = searchInput.value.trim().toLowerCase();
      const filtered = allCars.filter(car => car.nom.toLowerCase().includes(searchTerm));
      renderCars(filtered);
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", copyLink);
  }

  chargerVoitures(user.uid);
});

function chargerVoitures(uid) {
  const carList = document.getElementById("carList");
  const loading = document.getElementById("loading");
  carList.innerHTML = "";
  loading.style.display = "block";

  if (unsubscribeSnapshot) unsubscribeSnapshot();

  unsubscribeSnapshot = db.collection("cars")
    .where("uid", "==", uid)
    .onSnapshot(snapshot => {
      loading.style.display = "none";
      if (snapshot.empty) {
        carList.innerHTML = "<p>Aucune voiture publiée pour cette agence.</p>";
        allCars = [];
        return;
      }

      allCars = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      renderCars(allCars);
    }, error => {
      loading.style.display = "none";
      carList.innerHTML = `<p style="color:red;">Erreur lors du chargement des voitures.</p>`;
      console.error("Erreur snapshot:", error);
    });
}

function renderCars(cars) {
  const carList = document.getElementById("carList");
  if (!cars.length) {
    carList.innerHTML = "<p>Aucune voiture ne correspond à votre recherche.</p>";
    return;
  }

  carList.innerHTML = cars.map(car => `
    <div class="car-item">
      <img src="${car.imageUrl}" alt="${car.nom}" loading="lazy" />
      <div class="car-info">
        <h3>${car.nom}</h3>
        <p>${car.description}</p>
        <p><strong>${car.prix} DH / jour</strong></p>
      </div>
      <button class="reserve-btn" onclick="window.location.href='reserver-voiture.html?carId=${car.id}'">Réserver</button>
    </div>
  `).join("");
}

function copyLink() {
  const url = window.location.href;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      Toastify({ text: "🔗 Lien copié !", duration: 3000, backgroundColor: "#4ade80" }).showToast();
    }).catch(() => fallbackCopy(url));
  } else {
    fallbackCopy(url);
  }
}

function fallbackCopy(text) {
  const tempInput = document.createElement("input");
  document.body.appendChild(tempInput);
  tempInput.value = text;
  tempInput.select();
  try {
    document.execCommand("copy");
    Toastify({ text: "🔗 Lien copié (fallback)", duration: 3000, backgroundColor: "#4ade80" }).showToast();
  } catch (err) {
    Toastify({ text: "❌ Impossible de copier le lien", duration: 3000, backgroundColor: "#ef4444" }).showToast();
  }
  document.body.removeChild(tempInput);
}
