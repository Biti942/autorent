// ✅ dashboard.js (version PRO) complet - prêt à coller

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

const form = document.getElementById("carForm");
const imageInput = document.getElementById("image");
const previewImage = document.getElementById("previewImage");
let unsubscribeSnapshot = null;

function genererDescriptionAuto(nom, prix, disponible) {
  const marque = nom.split(" ")[0] || "Cette voiture";
  const dispoTxt = disponible ? "disponible immédiatement" : "actuellement non disponible";
  return `${marque} offre un excellent rapport qualité/prix à seulement ${prix} DH/jour. Elle est ${dispoTxt}.`;
}

imageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file && file.size <= 5 * 1024 * 1024) {
    previewImage.src = URL.createObjectURL(file);
    previewImage.style.display = "block";
  } else {
    Toastify({ text: "L'image doit être inférieure à 5 Mo.", duration: 3000, backgroundColor: "#ef4444" }).showToast();
    imageInput.value = "";
    previewImage.style.display = "none";
  }
});

function chargerVoitures(uid) {
  const carList = document.getElementById("carList");
  const loading = document.getElementById("loading");
  const carTotal = document.getElementById("carTotal");
  carList.innerHTML = "";
  loading.style.display = "block";

  if (unsubscribeSnapshot) unsubscribeSnapshot();

  unsubscribeSnapshot = db.collection("cars")
    .where("uid", "==", uid)
    .orderBy("dateAjout", "desc")
    .onSnapshot(snapshot => {
      loading.style.display = "none";
      carTotal.textContent = snapshot.size;
      if (snapshot.empty) {
        carList.innerHTML = "<p>Vous n'avez pas encore publié de voitures.</p>";
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
              <p>${d.disponible ? '✅ Disponible' : '❌ Indisponible'}</p>
            </div>
            <button class="reserve-btn" onclick="window.location.href='reserver-voiture.html?carId=${doc.id}'">Réserver</button>
            <button class="edit-btn" onclick="editCar('${doc.id}')">Modifier</button>
            <button class="delete-btn" onclick="deleteCar('${doc.id}', '${d.imageUrl}')">Supprimer</button>
          </div>
        `;
      }).join("");
      carList.innerHTML = carsHTML;
    }, error => {
      loading.style.display = "none";
      Toastify({ text: "Erreur chargement : " + error.message, duration: 3000, backgroundColor: "#ef4444" }).showToast();
    });
}

function chargerReservations(uid) {
  const resList = document.getElementById("reservationList");
  resList.innerHTML = "<p>Chargement...</p>";

  db.collection("reservations")
    .where("agencyId", "==", uid)
    .where("status", "==", "en_attente")
    .onSnapshot(snapshot => {
      if (snapshot.empty) {
        resList.innerHTML = "<p>Pas de nouvelles réservations.</p>";
        return;
      }

      const html = snapshot.docs.map(doc => {
        const r = doc.data();
        return `
          <div class="car-item">
            <div class="car-info">
              <h3>Réservation de ${r.clientEmail}</h3>
              <p>Date: ${r.dateDebut.toDate().toLocaleDateString()} → ${r.dateFin.toDate().toLocaleDateString()}</p>
              <p>Prix total: ${r.totalPrice} DH</p>
            </div>
            <button onclick="accepterReservation('${doc.id}', ${r.totalPrice})" class="reserve-btn">Accepter</button>
            <button onclick="refuserReservation('${doc.id}')" class="delete-btn">Refuser</button>
          </div>
        `;
      }).join("");
      resList.innerHTML = html;
    });
}

async function chargerSoldeCommission(uid) {
  const agencyRef = db.collection("agencies").doc(uid);
  const docSnap = await agencyRef.get();
  const solde = docSnap.exists ? docSnap.data().soldeCommission || 0 : 0;
  document.getElementById("soldeCommission").textContent = `${solde.toFixed(2)} DH`;
}

window.accepterReservation = async (id, prix) => {
  const user = auth.currentUser;
  if (!user) return;

  const commission = prix * 0.09;

  await db.collection("reservations").doc(id).update({
    status: "acceptée",
    commission: commission
  });

  const agencyRef = db.collection("agencies").doc(user.uid);
  const docSnap = await agencyRef.get();
  const solde = docSnap.exists ? docSnap.data().soldeCommission || 0 : 0;

  await agencyRef.set({ soldeCommission: solde + commission }, { merge: true });

  Toastify({ text: "✅ Réservation acceptée !", duration: 3000, backgroundColor: "#4ade80" }).showToast();
};

window.refuserReservation = async (id) => {
  await db.collection("reservations").doc(id).update({ status: "refusée" });
  Toastify({ text: "❌ Réservation refusée.", duration: 3000, backgroundColor: "#ef4444" }).showToast();
};

window.payerCommission = async () => {
  const user = auth.currentUser;
  if (!user) return;

  await db.collection("agencies").doc(user.uid).update({
    soldeCommission: 0
  });

  document.getElementById("soldeCommission").textContent = "0 DH";
  Toastify({ text: "✅ Paiement enregistré", duration: 3000, backgroundColor: "#4ade80" }).showToast();
};

auth.onAuthStateChanged(user => {
  if (!user) return window.location.href = "connexion.html";

  document.getElementById("user-email").textContent = user.email;

  document.getElementById("logoutBtn").addEventListener("click", () => {
    if (unsubscribeSnapshot) unsubscribeSnapshot();
    auth.signOut().then(() => window.location.href = "index.html")
      .catch(error => Toastify({ text: "Erreur déconnexion : " + error.message, duration: 3000, backgroundColor: "#ef4444" }).showToast());
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const nom = document.getElementById("name").value.trim();
    const prix = parseFloat(document.getElementById("price").value.trim());
    const descInput = document.getElementById("desc").value.trim();
    const disponible = document.getElementById("available").checked;
    const file = imageInput.files[0];

    if (!file || !nom || isNaN(prix)) {
      Toastify({ text: "Remplis tous les champs et ajoute une image.", duration: 3000, backgroundColor: "#ef4444" }).showToast();
      return;
    }

    const descriptionFinale = descInput || genererDescriptionAuto(nom, prix, disponible);

    try {
      const uniqueName = `${Date.now()}_${file.name}`;
      const storageRef = storage.ref(`cars/${user.uid}/${uniqueName}`);
      await storageRef.put(file);
      const imageUrl = await storageRef.getDownloadURL();

      await db.collection("cars").add({
        uid: user.uid,
        nom,
        prix,
        description: descriptionFinale,
        imageUrl,
        disponible,
        dateAjout: new Date()
      });

      Toastify({ text: "🚗 Voiture ajoutée avec succès !", duration: 3000, backgroundColor: "#4ade80" }).showToast();
      form.reset();
      previewImage.style.display = "none";
      chargerVoitures(user.uid);
    } catch (error) {
      Toastify({ text: "Erreur lors de l'ajout : " + error.message, duration: 3000, backgroundColor: "#ef4444" }).showToast();
    }
  });

  chargerVoitures(user.uid);
  chargerReservations(user.uid);
  chargerSoldeCommission(user.uid);

  window.editCar = (carId) => {
    db.collection("cars").doc(carId).get().then(doc => {
      if (doc.exists) {
        const d = doc.data();
        const newNom = prompt("Nouveau nom :", d.nom);
        const newPrix = prompt("Nouveau prix :", d.prix);
        const newDesc = prompt("Nouvelle description :", d.description);
        const newDisponible = confirm("Disponible ? (Annuler pour Non)") ? true : false;
        if (newNom && !isNaN(newPrix)) {
          db.collection("cars").doc(carId).update({
            nom: newNom,
            prix: parseFloat(newPrix),
            description: newDesc || d.description,
            disponible: newDisponible
          }).then(() => {
            Toastify({ text: "🚗 Voiture modifiée avec succès !", duration: 3000, backgroundColor: "#4ade80" }).showToast();
          }).catch(error => {
            Toastify({ text: "Erreur modification : " + error.message, duration: 3000, backgroundColor: "#ef4444" }).showToast();
          });
        }
      }
    });
  };

  window.deleteCar = (carId, imageUrl) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette voiture ?")) {
      const storageRef = storage.refFromURL(imageUrl);
      storageRef.delete().then(() => {
        db.collection("cars").doc(carId).delete().then(() => {
          Toastify({ text: "🚗 Voiture supprimée avec succès !", duration: 3000, backgroundColor: "#4ade80" }).showToast();
        }).catch(error => {
          Toastify({ text: "Erreur suppression (Firestore) : " + error.message, duration: 3000, backgroundColor: "#ef4444" }).showToast();
        });
      }).catch(error => {
        Toastify({ text: "Erreur suppression (Storage) : " + error.message, duration: 3000, backgroundColor: "#ef4444" }).showToast();
      });
    }
  };
});
