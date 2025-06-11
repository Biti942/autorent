firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    const uid = user.uid;

    // UID de l'admin
    if (uid === "Ee4CN2XR0lZSLsFnSnipKo177oG2") {
      window.location.href = "admin-dashboard.html";

    // UID du compte démo
    } else if (uid === "08DFrfBHI8ewtRAltini8PRxkj92") {
      window.location.href = "dashboard-premium.html"; // accès direct

    } else {
      // Tous les autres vont sur la page de choix du pack
      window.location.href = "choix-pack.html";
    }

  } else {
    console.log("Utilisateur non connecté.");
  }
});


