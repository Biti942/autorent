const auth = firebase.auth();
const db = firebase.firestore();
let unsubscribeSnapshot = null;

auth.onAuthStateChanged(user => {
  if (!user) return window.location.href = "connexion.html";

  document.getElementById("user-email").textContent = user.email;

  document.getElementById("logoutBtn").addEventListener("click", () => {
    if (unsubscribeSnapshot) unsubscribeSnapshot();
    auth.signOut().then(() => window.location.href = "index.html")
      .catch(error => Toastify({ text: "Erreur déconnexion : " + error.message, duration: 3000, backgroundColor: "#ef4444" }).showToast());
  });

  function chargerVoitures() {
    const carList = document.getElementById("carList");
    const loading = document.getElementById("loading");
    const priceFilter = document.getElementById("priceFilter");
    const locationFilter = document.getElementById("locationFilter");
    carList.innerHTML = "";
    loading.style.display = "block";

    if (unsubscribeSnapshot) unsubscribeSnapshot();

    unsubscribeSnapshot = db.collection("cars")
      .where("disponible", "==", true)
      .onSnapshot(snapshot => {
        loading.style.display = "none";
        if (snapshot.empty) {
          carList.innerHTML = "<p>Aucune voiture disponible pour le moment.</p>";
          return;
        }

        const cars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        applyFilters(cars);

        priceFilter.addEventListener("change", () => applyFilters(cars));
        locationFilter.addEventListener("input", () => applyFilters(cars));
      }, error => {
        loading.style.display = "none";
        Toastify({ text: "Erreur chargement : " + error.message, duration: 3000, backgroundColor: "#ef4444" }).showToast();
      });
  }

  function applyFilters(cars) {
    const carList = document.getElementById("carList");
    const priceFilter = document.getElementById("priceFilter").value;
    const locationFilter = document.getElementById("locationFilter").value.toLowerCase();

    const filteredCars = cars.filter(car => {
      const priceMatch = !priceFilter || 
        (priceFilter === "0-200" && car.prix <= 200) ||
        (priceFilter === "200-500" && car.prix > 200 && car.prix <= 500) ||
        (priceFilter === "500+" && car.prix > 500);
      const locationMatch = !locationFilter || car.description.toLowerCase().includes(locationFilter);
      return priceMatch && locationMatch;
    });

    carList.innerHTML = filteredCars.map(car => `
      <div class="car-item">
        <img src="${car.imageUrl}" alt="${car.nom}" />
        <div class="car-info">
          <h3>${car.nom}</h3>
          <p>${car.description}</p>
          <p><strong>${car.prix} DH / jour</strong></p>
        </div>
        <button class="reserve-btn" onclick="reserveCar('${car.id}')">Réserver</button>
      </div>
    `).join("");
  }

  window.reserveCar = (carId) => {
    db.collection("cars").doc(carId).get().then(doc => {
      if (doc.exists && doc.data().disponible) {
        const car = doc.data();
        const days = prompt("Nombre de jours de location :", 1);
        if (days && !isNaN(days) && days > 0) {
          const total = car.prix * days;
          const commission = total * 0.09;
          if (confirm(`Confirmer la réservation ?\nTotal : ${total} DH\nCommission (9%) : ${commission} DH`)) {
            db.collection("reservations").add({
              carId,
              userId: auth.currentUser.uid,
              date: new Date(),
              days,
              total,
              commission
            }).then(() => {
              db.collection("cars").doc(carId).update({ disponible: false }).then(() => {
                Toastify({ text: "Réservation réussie !", duration: 3000, backgroundColor: "#4ade80" }).showToast();
              });
            }).catch(error => {
              Toastify({ text: "Erreur réservation : " + error.message, duration: 3000, backgroundColor: "#ef4444" }).showToast();
            });
          }
        }
      }
    });
  };

  chargerVoitures();
});