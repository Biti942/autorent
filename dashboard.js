import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, limit, orderBy, startAfter } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js';
import { firebaseConfig } from './firebase.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const carForm = document.getElementById('carForm');
const carList = document.getElementById('carList');
const reservationList = document.getElementById('reservationList');
const userName = document.getElementById('user-name');
const logoutBtn = document.getElementById('logoutBtn');
const loading = document.getElementById('loading');
const carTotal = document.getElementById('carTotal');
const soldeCommission = document.getElementById('soldeCommission');
const iaAnalysis = document.getElementById('iaAnalysis');
const carPagination = document.getElementById('carPagination');
let chartInstance = null;
let lastCarDoc = null;
const PAGE_SIZE = 10;

// Error handling utility
const showError = (message, err = {}) => {
  console.error(message, err);
  Toastify({ text: message, duration: 5000, backgroundColor: '#ef4444' }).showToast();
};

// Input validation utility
const validateCarData = (data) => {
  if (!data.nom || data.nom.length < 3) return 'Le nom de la voiture doit contenir au moins 3 caractères.';
  if (!data.prix || data.prix <= 0) return 'Le prix doit être supérieur à 0.';
  if (!data.location || data.location.length < 2) return 'La ville doit contenir au moins 2 caractères.';
  return null;
};

// Image preview
document.getElementById('image').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showError('Veuillez sélectionner une image au format JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError('L’image ne doit pas dépasser 5 Mo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      const previewImage = document.getElementById('previewImage');
      previewImage.src = e.target.result;
      previewImage.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
});

// Add car
carForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loading.style.display = 'block';
  const carData = {
    nom: document.getElementById('name').value.trim(),
    prix: parseFloat(document.getElementById('price').value),
    description: document.getElementById('desc').value.trim(),
    type: document.getElementById('type').value,
    location: document.getElementById('location').value.trim(),
    transmission: document.getElementById('transmission').value,
    disponible: document.getElementById('available').checked,
    uid: auth.currentUser.uid,
    createdAt: new Date()
  };

  const validationError = validateCarData(carData);
  if (validationError) {
    showError(validationError);
    loading.style.display = 'none';
    return;
  }

  try {
    const file = document.getElementById('image').files[0];
    if (file) {
      const storageRef = ref(storage, `cars/${auth.currentUser.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      carData.imageUrl = await getDownloadURL(storageRef);
    }
    await addDoc(collection(db, 'cars'), carData);
    Toastify({ text: 'Voiture ajoutée avec succès 🚗', duration: 3000, backgroundColor: '#4ade80' }).showToast();
    carForm.reset();
    document.getElementById('previewImage').style.display = 'none';
  } catch (err) {
    showError('Erreur lors de l’ajout de la voiture. Veuillez réessayer.', err);
  } finally {
    loading.style.display = 'none';
  }
});

// Edit car
window.editCar = async function(carId) {
  try {
    const carDoc = await getDoc(doc(db, 'cars', carId));
    if (!carDoc.exists()) {
      showError('Voiture introuvable.');
      return;
    }
    const car = carDoc.data();
    document.getElementById('name').value = car.nom;
    document.getElementById('price').value = car.prix;
    document.getElementById('desc').value = car.description || '';
    document.getElementById('type').value = car.type;
    document.getElementById('location').value = car.location;
    document.getElementById('transmission').value = car.transmission;
    document.getElementById('available').checked = car.disponible;
    carForm.onsubmit = async (e) => {
      e.preventDefault();
      loading.style.display = 'block';
      const updatedData = {
        nom: document.getElementById('name').value.trim(),
        prix: parseFloat(document.getElementById('price').value),
        description: document.getElementById('desc').value.trim(),
        type: document.getElementById('type').value,
        location: document.getElementById('location').value.trim(),
        transmission: document.getElementById('transmission').value,
        disponible: document.getElementById('available').checked
      };
      const validationError = validateCarData(updatedData);
      if (validationError) {
        showError(validationError);
        loading.style.display = 'none';
        return;
      }
      try {
        await updateDoc(doc(db, 'cars', carId), updatedData);
        Toastify({ text: 'Voiture mise à jour avec succès 🚗', duration: 3000, backgroundColor: '#4ade80' }).showToast();
        carForm.reset();
        carForm.onsubmit = addCar;
      } catch (err) {
        showError('Erreur lors de la mise à jour de la voiture. Veuillez réessayer.', err);
      } finally {
        loading.style.display = 'none';
      }
    };
  } catch (err) {
    showError('Erreur lors du chargement des données de la voiture.', err);
  }
};

// Delete car
window.deleteCar = async function(carId) {
  if (!confirm('Voulez-vous vraiment supprimer cette voiture ?')) return;
  loading.style.display = 'block';
  try {
    // Check for active reservations
    const reservationsQuery = query(collection(db, 'reservations'), where('carId', '==', carId), where('status', '==', 'pending'));
    const reservationsSnap = await getDocs(reservationsQuery);
    if (!reservationsSnap.empty) {
      showError('Impossible de supprimer la voiture : des réservations en attente existent.');
      loading.style.display = 'none';
      return;
    }
    await deleteDoc(doc(db, 'cars', carId));
    Toastify({ text: 'Voiture supprimée avec succès 🚮', duration: 3000, backgroundColor: '#4ade80' }).showToast();
  } catch (err) {
    showError('Erreur lors de la suppression de la voiture. Veuillez réessayer.', err);
  } finally {
    loading.style.display = 'none';
  }
};

// Approve/Reject reservation
window.updateReservation = async function(resId, status) {
  try {
    const resDoc = await getDoc(doc(db, 'reservations', resId));
    if (!resDoc.exists()) {
      showError('Réservation introuvable.');
      return;
    }
    const resData = resDoc.data();
    if (resData.status !== 'pending') {
      showError('Cette réservation a déjà été traitée.');
      return;
    }
    if (status === 'confirmed') {
      const carDoc = await getDoc(doc(db, 'cars', resData.carId));
      if (!carDoc.exists() || !carDoc.data().disponible) {
        showError('La voiture n’est pas disponible pour cette réservation.');
        return;
      }
      await updateDoc(doc(db, 'cars', resData.carId), { disponible: false });
    }
    await updateDoc(doc(db, 'reservations', resId), { status });
    Toastify({ text: `Réservation ${status === 'confirmed' ? 'approuvée' : 'rejetée'} avec succès.`, duration: 3000, backgroundColor: '#4ade80' }).showToast();
  } catch (err) {
    showError(`Erreur lors de la mise à jour de la réservation. Veuillez réessayer.`, err);
  }
};

// Load cars with pagination
async function loadCars(user, page = 1) {
  loading.style.display = 'block';
  try {
    let carQuery = query(collection(db, 'cars'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
    if (page > 1 && lastCarDoc) {
      carQuery = query(collection(db, 'cars'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'), startAfter(lastCarDoc), limit(PAGE_SIZE));
    }
    onSnapshot(carQuery, async (snapshot) => {
      carList.innerHTML = '';
      const cars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      lastCarDoc = snapshot.docs[snapshot.docs.length - 1];
      carTotal.textContent = cars.length;
      cars.forEach(car => {
        carList.insertAdjacentHTML('beforeend', `
          <div class="car-item">
            <img src="${car.imageUrl || 'https://via.placeholder.com/100'}" alt="${car.nom}" loading="lazy" onerror="this.src='https://via.placeholder.com/100'" />
            <div class="car-info">
              <h3>${car.nom}</h3>
              <p>${car.description || 'Pas de description'}</p>
              <p><strong>${car.prix} DH / jour</strong> | ${car.location}</p>
              <p>Statut: ${car.disponible ? 'Disponible' : 'Non disponible'}</p>
            </div>
            <button class="edit-btn" onclick="editCar('${car.id}')" aria-label="Modifier la voiture">Modifier</button>
            <button class="delete-btn" onclick="deleteCar('${car.id}')" aria-label="Supprimer la voiture">Supprimer</button>
          </div>
        `);
      });
      // Pagination controls
      carPagination.innerHTML = `
        <button onclick="loadCars(auth.currentUser, ${page - 1})" ${page === 1 ? 'disabled' : ''}>Précédent</button>
        <button onclick="loadCars(auth.currentUser, ${page + 1})" ${cars.length < PAGE_SIZE ? 'disabled' : ''}>Suivant</button>
      `;
    });
  } catch (err) {
    showError('Erreur lors du chargement des voitures. Veuillez réessayer.', err);
  } finally {
    loading.style.display = 'none';
  }
}

// Load data
async function loadData(user) {
  loading.style.display = 'block';
  try {
    // Load user name
    const userDoc = await getDoc(doc(db, 'utilisateurs', user.uid));
    if (userDoc.exists()) {
      const prenom = userDoc.data().prenom || 'Utilisateur';
      userName.textContent = prenom;
    } else {
      userName.textContent = 'Utilisateur';
    }

    // Load cars (initial page)
    loadCars(user, 1);

    // Load reservations
    onSnapshot(query(collection(db, 'reservations'), where('agencyId', '==', user.uid)), async (snapshot) => {
      reservationList.innerHTML = '';
      const pendingCount = snapshot.docs.filter(doc => doc.data().status === 'pending').length;
      const carIds = [...new Set(snapshot.docs.map(doc => doc.data().carId))];
      const userIds = [...new Set(snapshot.docs.map(doc => doc.data().userId))];
      const [carDocs, userDocs] = await Promise.all([
        getDocs(query(collection(db, 'cars'), where('__name__', 'in', carIds.length ? carIds : ['dummy']))),
        getDocs(query(collection(db, 'utilisateurs'), where('__name__', 'in', userIds.length ? userIds : ['dummy']))),
      ]);
      const carMap = new Map(carDocs.docs.map(doc => [doc.id, doc.data()]));
      const userMap = new Map(userDocs.docs.map(doc => [doc.id, doc.data()]));
      snapshot.docs.forEach(doc => {
        const res = doc.data();
        const carName = carMap.get(res.carId)?.nom || 'Inconnu';
        const userEmail = userMap.get(res.userId)?.email || 'Inconnu';
        const start = res.startDate ? new Date(res.startDate.toDate()).toLocaleDateString('fr-FR') : '-';
        const end = res.endDate ? new Date(res.endDate.toDate()).toLocaleDateString('fr-FR') : '-';
        reservationList.insertAdjacentHTML('beforeend', `
          <div class="reservation-item">
            <div class="reservation-info">
              <h3>${carName}</h3>
              <p>Client: ${userEmail}</p>
              <p>Début: ${start} | Fin: ${end}</p>
              <p>Total: ${res.totalPrice || '-'} DH | Statut: ${res.status}</p>
            </div>
            ${res.status === 'pending' ? `
              <button class="approve-btn" onclick="updateReservation('${doc.id}', 'confirmed')" aria-label="Approuver la réservation">Approuver</button>
              <button class="reject-btn" onclick="updateReservation('${doc.id}', 'rejected')" aria-label="Rejeter la réservation">Rejeter</button>
            ` : ''}
          </div>
        `);
      });

      // Financial chart
      if (chartInstance) chartInstance.destroy();
      const ctx = document.getElementById('performanceChart').getContext('2d');
      const months = Array.from({length: 6}, (_, i) => {
        const date = new Date(2025, 6 - i, 1);
        return date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
      }).reverse();
      const monthlyData = {};
      snapshot.forEach(doc => {
        const res = doc.data();
        if (res.status === 'confirmed' && res.startDate && res.totalPrice) {
          const resMonth = res.startDate.toDate().toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
          monthlyData[resMonth] = monthlyData[resMonth] || { ca: 0, count: 0 };
          monthlyData[resMonth].ca += parseFloat(res.totalPrice || 0);
          monthlyData[resMonth].count += 1;
        }
      });

      ```chartjs
      {
        type: "bar",
        data: {
          labels: months,
          datasets: [
            {
              label: "Chiffre d'Affaires (MAD)",
              data: months.map(m => monthlyData[m]?.ca || 0),
              backgroundColor: "#38bdf8",
              borderColor: "#0ea5e9",
              borderWidth: 1
            },
            {
              label: "Nombre de Réservations",
              data: months.map(m => monthlyData[m]?.count || 0),
              backgroundColor: "#4ade80",
              borderColor: "#22c55e",
              borderWidth: 1
            }
          ]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: "Valeurs", color: "#fff" },
              ticks: { color: "#fff" }
            },
            x: {
              title: { display: true, text: "Mois", color: "#fff" },
              ticks: { color: "#fff" }
            }
          },
          plugins: {
            legend: { labels: { color: "#fff" } }
          }
        }
      }
      ```

      // IA Analysis
      let totalCA = 0;
      let bestCar = null, maxCA = 0;
      const carsSnapshot = await getDocs(query(collection(db, 'cars'), where('uid', '==', user.uid)));
      const cars = carsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      cars.forEach(car => {
        const ca = parseFloat(car.prix * (car.reservations || 0));
        totalCA += ca;
        if (ca > maxCA) {
          maxCA = ca;
          bestCar = car;
        }
      });
      const analysisText = `
        <p><strong>Total CA:</strong> ${totalCA.toFixed(2)} DH</p>
        <p><strong>Nombre de réservations en attente:</strong> ${pendingCount}</p>
        <p><strong>Meilleure voiture:</strong> ${bestCar ? bestCar.nom : 'Aucune'} (${maxCA.toFixed(2)} DH)</p>
        <ul>
          <li>Optimisez la disponibilité de ${bestCar ? bestCar.nom : 'vos meilleures unités'} pour maximiser vos revenus.</li>
          <li>Traitez les ${pendingCount} réservations en attente pour augmenter votre CA.</li>
          <li>Ajoutez des véhicules similaires à ${bestCar ? bestCar.nom : 'vos modèles performants'}.</li>
          <li>Consultez la <a href="gerance-premium.html">Gérance Premium</a> pour des analyses détaillées.</li>
        </ul>
      `;
      iaAnalysis.innerHTML = analysisText;

      // Load commission
      const aboDoc = await getDoc(doc(db, 'abonnements', user.uid));
      soldeCommission.textContent = aboDoc.exists() && aboDoc.data().solde ? `${aboDoc.data().solde} DH` : '0 DH';
    });
  } catch (err) {
    showError('Erreur lors du chargement des données. Veuillez réessayer.', err);
  } finally {
    loading.style.display = 'none';
  }
}

// Pay commission
window.payerCommission = async function() {
  try {
    // Simulate payment (replace with actual payment logic)
    Toastify({ text: 'Paiement en cours... (simulation)', duration: 3000, backgroundColor: '#4ade80' }).showToast();
  } catch (err) {
    showError('Erreur lors du paiement. Veuillez réessayer.', err);
  }
};

// Authentication
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'connexion.html';
    return;
  }
  logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
      Toastify({ text: 'Déconnexion réussie.', duration: 3000, backgroundColor: '#4ade80' }).showToast();
      window.location.href = 'index.html';
    }).catch(err => {
      showError('Erreur lors de la déconnexion.', err);
    });
  });
  loadData(user);
});

// Offline support
window.addEventListener('offline', () => {
  Toastify({ text: 'Vous êtes hors ligne. Certaines fonctionnalités peuvent être limitées.', duration: -1, backgroundColor: '#ef4444' }).showToast();
});
window.addEventListener('online', () => {
  Toastify({ text: 'Connexion rétablie.', duration: 3000, backgroundColor: '#4ade80' }).showToast();
  if (auth.currentUser) loadData(auth.currentUser);
});

// TODO: Add unit tests for validateCarData, loadCars, loadData, and updateReservation
// TODO: Add integration tests for Firebase operations and UI rendering