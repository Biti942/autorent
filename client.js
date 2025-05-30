const form = document.getElementById('formulaire');
const reservationForm = document.getElementById('reservationForm');
const confirmationMessage = document.getElementById('confirmationMessage');

function ouvrirFormulaire(index) {
  reservationForm.classList.remove('hidden');
  confirmationMessage.textContent = '';
  form.reset();
}

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const nom = document.getElementById('nom').value;
  const nationalite = document.getElementById('nationalite').value;
  const dateDebut = document.getElementById('dateDebut').value;
  const dateFin = document.getElementById('dateFin').value;
  const livraison = document.getElementById('livraison').checked;

  reservationForm.classList.add('hidden');

  confirmationMessage.textContent = `✅ Merci pour votre réservation chez AutoRent. La demande a été envoyée à l’agent de location. Vous recevrez une réponse par email, SMS ou appel dans les 15 minutes.`;
});

  
  