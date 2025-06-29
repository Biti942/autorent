const auth = firebase.auth();
const db = firebase.firestore();
let unsubscribeSnapshot = null;

auth.onAuthStateChanged(user => {
  if (!user) return window.location.href = "connexion.html";

  document.getElementById("agent-name").textContent = user.email;

  function chargerVoitures() {
    const carList = document.getElementById("carList");
    const loading = document.getElementById("loading");
    carList.innerHTML = "";
    loading.style.display = "block";

    if (unsubscribeSnapshot) unsubscribeSnapshot();

    unsubscribeSnapshot = db.collection("cars")
      .where("uid", "==", user.uid)
      .onSnapshot(snapshot => {
        loading.style.display = "none";
        if (snapshot.empty) {
          carList.innerHTML = "<p>Aucune voiture publiée pour cette agence.</p>";
          return;
        }

        const carsHTML = snapshot.docs.map(doc => {
          const d = doc.data();
          return `
            <div class="car-item">
              <img src="${d.imageUrl}" alt="${d.nom}" />
              <div class="car-info">
                <h3>${d.nom}</h3>
                <p>${d.description}</p>
                <p><strong>${d.prix} DH / jour</strong></p>
              </div>
              <button class="reserve-btn" onclick="window.location.href='reserver-voiture.html?carId=${doc.id}'">Réserver</button>
            </div>
          `;
        }).join("");
        carList.innerHTML = carsHTML;
      }, error => {
        loading.style.display = "none";
        Toastify({ text: "Erreur chargement : " + error.message, duration: 3000, backgroundColor: "#ef4444" }).showToast();
      });
  }

  chargerVoitures();
});