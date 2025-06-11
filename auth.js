firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    const uid = user.uid;

    // UID admin
    if (uid === "Ee4CN2XR0lZSLsFnSnipKo177oG2") {
      window.location.href = "admin-dashboard.html";

    // UID du compte démo
    } else if (uid === "Ee4CN2XR0lZSLsFnSnipKo177oG2") {
      window.location.href = "dashboard-premium.html"; // accès direct

    } else {
      // Redirige les autres vers la page des packs
      window.location.href = "choix-pack.html";
    }

  } else {
    console.log("Utilisateur non connecté.");
  }
});

