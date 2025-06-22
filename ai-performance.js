// js/ai-performance.js

function analyserPerformance(voitures) {
  let totalCA = 0;
  let totalDepenses = 0;
  let messages = [];

  voitures.forEach(v => {
    const ca = parseFloat(v.ca) || 0;
    const dep = parseFloat(v.depenses) || 0;
    totalCA += ca;
    totalDepenses += dep;

    if (dep > ca * 0.5) {
      messages.push(`💸 Trop de dépenses sur ${v.nom}, vérifie les coûts.`);
    }

    if (ca > 3000) {
      messages.push(`🚀 Très bon revenu pour ${v.nom}, pense à augmenter les prix.`);
    }

    if (!v.reservation || v.reservation === "-") {
      messages.push(`🔴 ${v.nom} n'a pas été réservée récemment.`);
    }
  });

  const profit = totalCA - totalDepenses;

  messages.push(`📊 Résultat Global : CA = ${totalCA} MAD, Dépenses = ${totalDepenses} MAD, Profit = ${profit} MAD.`);

  if (profit < 1000) {
    messages.push(`📉 Le bénéfice est faible. Pense à réduire les crédits ou revoir les tarifs.`);
  } else {
    messages.push(`✅ L'agence est rentable ce mois-ci.`);
  }

  return messages;
}
