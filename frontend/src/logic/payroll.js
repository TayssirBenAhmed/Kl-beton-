/**
 * KL BETON V3 - Moteur de Calcul de Paie
 * Source unique de vérité pour tous les calculs financiers.
 */

/**
 * Calcule le taux journalier et horaire à partir du salaire de base.
 * Référence: 26 jours ouvrables/mois, HS au taux normal.
 */
export function calculerTaux(salaireBase) {
  const tauxJournalier = salaireBase / 26;
  const tauxHoraire = tauxJournalier / 8; // Taux normal pour HS selon feuille client
  return { tauxJournalier, tauxHoraire };
}

/**
 * Calcule le bulletin de paie d'un employé pour un mois donné.
 * @param {Object} employe - { salaireBase }
 * @param {Array} pointages - Liste des pointages du mois
 * @param {number} avancesApproved - Total des avances approuvées du mois (séparées)
 * @returns {Object} Détail de la paie
 */
export function calculerPaie(employe, pointages, avancesApproved = 0) {
  const { tauxJournalier, tauxHoraire } = calculerTaux(employe.salaireBase);

  let joursPresent = 0;
  let joursConge = 0;
  let joursFerie = 0;
  let joursAbsent = 0;
  let joursMaladie = 0;
  let heuresSupp = 0;
  let avancesJour = 0;

  for (const p of pointages) {
    const statut = p.statut || p.status;
    const jours = p.jours_travailles ?? p.joursTravailles ?? 1;
    const hs = p.heures_supp ?? p.heuresSupp ?? 0;
    const avance = p.avance ?? 0;

    switch (statut) {
      case 'PRESENT': joursPresent += jours; break;
      case 'CONGE':   joursConge += 1; break;
      case 'FERIE':   joursFerie += 1; break;
      case 'ABSENT':  joursAbsent += 1; break;
      case 'MALADIE': joursMaladie += 1; break;
    }

    // HS bloqué pour ABSENT, CONGE, MALADIE dans le backend, mais on double-sécurise
    if (!['ABSENT', 'CONGE', 'MALADIE'].includes(statut)) {
      heuresSupp += hs;
    }
    avancesJour += avance;
  }

  // Jours Payés = PRESENT + CONGE + FERIE
  const joursPayes = joursPresent + joursConge + joursFerie;

  // Total avances = journalières + approuvées
  const totalAvances = avancesJour + avancesApproved;

  // Calcul BRUT
  const gainJours = joursPayes * tauxJournalier;
  const gainHS = heuresSupp * tauxHoraire;
  const brut = gainJours + gainHS;

  // Calcul NET
  const netRaw = brut - totalAvances;

  // Règle de la dette: si net < 0, net = 0.000, dette = |net|
  const net = Math.max(0, netRaw);
  const dette = netRaw < 0 ? Math.abs(netRaw) : 0;

  return {
    // Entrées
    salaireBase: employe.salaireBase,
    tauxJournalier,
    tauxHoraire,
    // Compteurs
    joursPresent,
    joursConge,
    joursFerie,
    joursAbsent,
    joursMaladie,
    joursPayes,
    heuresSupp,
    // Gains
    gainJours,
    gainHS,
    brut,
    // Retenues
    avancesJour,
    avancesApproved,
    totalAvances,
    // Net
    netRaw,
    net,
    dette,
  };
}

/**
 * Calcule le récapitulatif global pour tous les employés d'un mois.
 * @param {Array} employes - Liste des employés avec leurs pointages et avances
 * @returns {Object} Totaux globaux
 */
export function calculerRecapGlobal(employes) {
  let totalBrut = 0;
  let totalNet = 0;
  let totalDette = 0;
  let totalAvances = 0;

  const details = employes.map(({ employe, pointages, avancesApproved }) => {
    const paie = calculerPaie(employe, pointages, avancesApproved);
    totalBrut += paie.brut;
    totalNet += paie.net;
    totalDette += paie.dette;
    totalAvances += paie.totalAvances;
    return { employe, ...paie };
  });

  return { details, totalBrut, totalNet, totalDette, totalAvances };
}

/**
 * Formate un montant financier pour affichage
 * @param {number} value
 * @returns {string} ex: "1 234.567 DT"
 */
export function formatMontant(value) {
  if (value === null || value === undefined) return '0.000 DT';
  return `${value.toLocaleString('fr-TN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} DT`;
}
