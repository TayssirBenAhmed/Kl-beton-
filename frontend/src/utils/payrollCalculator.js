/**
 * KL BETON V4 — Moteur de Calcul de Paie (Mode Simplifié / Tunisie)
 *
 * RÈGLE UNIQUE — appliquée à chaque employé sans exception :
 *
 *   TJ  = Salaire_Base / 26
 *   TH  = TJ / 8                      (HS payées au taux normal 100 %)
 *
 *   GAINS :
 *     Base   = J_Présence × TJ
 *     Bonus  = 1 × TJ                 (conditionnel — si hasBonus = true)
 *     HS     = Nb_HS × TH
 *     Fériés = Nb_Fériés × TJ
 *
 *   DÉDUCTIONS :
 *     Absences    = Nb_Absences × TJ
 *     Maladie     = Nb_Maladie  × TJ
 *     Avances     = Total avances approuvées
 *     Prêt        = Mensualité active (si solde > 0)
 *
 *   TOTAL NET = (Base + Bonus + HS + Fériés) − (Absences + Maladie + Avances + Prêt)
 *   NET ≥ 0 (le résultat ne peut pas être négatif)
 */

export const payrollCalculator = {

  /**
   * @param {Object} employe         - { salaire_base }
   * @param {Array}  pointages       - Pointages du mois
   * @param {Array}  approvedAvances - Avances APPROVED du mois
   * @param {boolean} hasBonus       - Bonus mérite 1 × TJ
   * @param {Object|null} pretActif  - { id, mensualite, solde_restant } — null si aucun prêt
   * @returns {Object} Résultat de paie (montants en strings 3 décimales)
   */
  calculateMonthly: (employe, pointages = [], approvedAvances = [], hasBonus = false, pretActif = null) => {

    // ── Taux ────────────────────────────────────────────────────────────────
    const salaireBase = Number(employe.salaire_base) || 0;
    const TJ  = salaireBase / 26;   // Taux Journalier
    const TH  = TJ / 8;             // Taux Horaire HS (100 %)

    // ── Compteurs ────────────────────────────────────────────────────────────
    let nbPresence = 0;
    let nbHS       = 0;
    let nbFeries   = 0;
    let nbAbsences = 0;
    let nbMaladie  = 0;
    let nbConges   = 0;

    for (const p of pointages) {
      switch (p.statut) {
        case 'PRESENT':
          nbPresence += Number(p.jours_travailles ?? 1);
          nbHS       += Number(p.heures_supp      ?? 0);
          if (p.is_ferie) nbFeries += 1;
          break;
        case 'FERIE':
          nbFeries   += 1;
          break;
        case 'ABSENT':
          nbAbsences += 1;
          break;
        case 'MALADIE':
          nbMaladie  += 1;
          break;
        case 'CONGE':
          nbConges   += 1;
          break;
        default:
          break;
      }
    }

    // ── Avances ──────────────────────────────────────────────────────────────
    const montantAvancesApproved = approvedAvances
      .reduce((s, a) => s + (Number(a.montant) || 0), 0);
    const montantAvancesJour = pointages
      .reduce((s, p) => s + (Number(p.avance) || 0), 0);
    const totalAvances = montantAvancesApproved + montantAvancesJour;

    // ── GAINS (formule stricte) ───────────────────────────────────────────────
    const gainBase   = nbPresence * TJ;
    const gainBonus  = hasBonus ? TJ : 0;
    const gainHS     = nbHS       * TH;
    const gainFeries = nbFeries   * TJ;

    // ── DÉDUCTIONS ───────────────────────────────────────────────────────────
    const deductAbsences = nbAbsences * TJ;
    const deductMaladie  = nbMaladie  * TJ;

    // ── PRÊT ─────────────────────────────────────────────────────────────────
    // Plafond au salaire disponible après déductions : on ne prélève jamais plus
    // que ce que l'employé a gagné ce mois-ci (net avant prêt ≥ 0).
    const brut        = gainBase + gainBonus + gainHS + gainFeries;
    const salaryRaw   = brut - deductAbsences - deductMaladie - totalAvances;
    const mensualitePret = pretActif
      ? Math.min(
          Number(pretActif.mensualite)   || 0,
          Number(pretActif.solde_restant) || 0,
          Math.max(0, salaryRaw)           // ← cap : jamais plus que ce qui est dispo
        )
      : 0;
    const soldePretApres = pretActif
      ? Math.max(0, Number(pretActif.solde_restant) - mensualitePret)
      : null;

    // ── TOTAL NET ────────────────────────────────────────────────────────────
    const netTheorique = salaryRaw - mensualitePret;
    const net          = Math.max(0, netTheorique);
    const dette        = netTheorique < 0 ? Math.abs(netTheorique) : 0;

    // ── Résultat ─────────────────────────────────────────────────────────────
    return {
      // Taux
      tauxJ:    TJ.toFixed(3),
      tauxH_HS: TH.toFixed(3),

      // Compteurs
      presence:  nbPresence,
      feries:    nbFeries,
      absences:  nbAbsences,
      maladie:   nbMaladie,
      conges:    nbConges,
      hs:        nbHS,
      dimanches: 0,

      // Montants individuels
      hasBonus,
      montantBonus:      gainBonus.toFixed(3),
      salairePresence:   gainBase.toFixed(3),
      montantHS:         gainHS.toFixed(3),
      montantFeries:     gainFeries.toFixed(3),
      deductionAbsences: deductAbsences.toFixed(3),
      deductionMaladie:  deductMaladie.toFixed(3),
      avances:           totalAvances.toFixed(3),

      // Prêt
      mensualitePret:    mensualitePret.toFixed(3),
      soldePretApres:    soldePretApres !== null ? soldePretApres.toFixed(3) : null,
      pretId:            pretActif ? pretActif.id : null,

      // Totaux
      brut:  brut.toFixed(3),
      net:   net.toFixed(3),
      dette: dette.toFixed(3),

      // Rétrocompatibilité
      cnss: '0.000',
      irpp: '0.000',
      css:  '0.000',
    };
  },

  /**
   * Recalcule le Total Net directement depuis les composants d'un objet payroll.
   */
  netFromComponents: (p) => {
    const base   = parseFloat(p.salairePresence   || 0);
    const bonus  = parseFloat(p.montantBonus      || 0);
    const hs     = parseFloat(p.montantHS         || 0);
    const feries = parseFloat(p.montantFeries     || 0);
    const abs    = parseFloat(p.deductionAbsences || 0);
    const mal    = parseFloat(p.deductionMaladie  || 0);
    const avs    = parseFloat(p.avances           || 0);
    const pret   = parseFloat(p.mensualitePret    || 0);
    return Math.max(0, base + bonus + hs + feries - abs - mal - avs - pret);
  },
};
