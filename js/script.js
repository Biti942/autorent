document.getElementById("addCarBtn").addEventListener("click", () => {
    document.getElementById("carForm").style.display = "block";
  });
  
  function fermerFormulaire() {
    document.getElementById("carForm").style.display = "none";
  }
  
  function ajouterVoiture() {
    const model = document.getElementById("model").value;
    const carburant = document.getElementById("carburant").value;
    const boite = document.getElementById("boite").value;
    const prix = document.getElementById("prix").value;
    const image = document.getElementById("image").value;
  
    if (!model || !carburant || !boite || !prix || !image) {
      alert("Remplis tous les champs !");
      return;
    }
  
    const card = document.createElement("div");
    card.className = "car-card";
    card.innerHTML = `
      <img src="${image}" alt="${model}">
      <h2>${model}</h2>
      <p>${carburant} - ${boite}</p>
      <p><strong>${prix} MAD / jour</strong></p>
      <button class="btn">Modifier</button>
    `;
  
    document.getElementById("carList").appendChild(card);
    fermerFormulaire();
  
    // Reset form
    document.getElementById("model").value = "";
    document.getElementById("carburant").value = "";
    document.getElementById("boite").value = "";
    document.getElementById("prix").value = "";
    document.getElementById("image").value = "";
  }
  