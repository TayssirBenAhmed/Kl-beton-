/**
 * Constantes de paie
 */
const WORKING_DAYS_PER_MONTH = 26;
const WORKING_HOURS_PER_DAY = 8;
const OVERTIME_RATE_MULTIPLIER = 1.0;  // 100% — taux normal

/**
 * Calcule le taux journalier
 * @param {number} baseSalary - Salaire de base mensuel
 * @returns {number} Taux journalier
 */
export const calculateDailyRate = (baseSalary) => {
  return baseSalary / WORKING_DAYS_PER_MONTH;
};

/**
 * Calcule le taux horaire (majoré de 25%)
 * @param {number} dailyRate - Taux journalier
 * @returns {number} Taux horaire
 */
export const calculateHourlyRate = (dailyRate) => {
  return (dailyRate / WORKING_HOURS_PER_DAY) * OVERTIME_RATE_MULTIPLIER;
};

/**
 * Calcule les gains bruts
 * @param {Object} params
 * @returns {number} Gains bruts
 */
export const calculateGrossEarnings = ({
  presences,
  feries,
  conges,
  absences,
  heuresSup,
  tauxJournalier,
  tauxHoraire
}) => {
  const joursPayes = presences + feries + conges - absences;
  const gainsBase = Math.max(0, joursPayes) * tauxJournalier;
  const gainsHS = heuresSup * tauxHoraire;
  
  return gainsBase + gainsHS;
};

/**
 * Calcule le net à payer
 * @param {Object} params
 * @returns {Object} Net à payer et dette
 */
export const calculateNetPay = ({ gainsBruts, avances }) => {
  const net = gainsBruts - avances;
  
  if (net < 0) {
    return {
      net: 0,
      dette: Math.abs(net)
    };
  }
  
  return {
    net,
    dette: 0
  };
};

/**
 * Calcule la paie complète d'un employé
 * @param {Object} employeeData
 * @param {Array} pointages
 * @returns {Object} Résultat de la paie
 */
export const calculateEmployeePay = (employeeData, pointages) => {
  const { baseSalary } = employeeData;
  
  const stats = pointages.reduce((acc, p) => {
    acc[p.statut]++;
    acc.heuresSup += p.heuresSup || 0;
    acc.avances += p.avance || 0;
    return acc;
  }, {
    PRESENT: 0,
    ABSENT: 0,
    CONGE: 0,
    MALADIE: 0,
    FERIE: 0,
    heuresSup: 0,
    avances: 0
  });
  
  const tauxJournalier = calculateDailyRate(baseSalary);
  const tauxHoraire = calculateHourlyRate(tauxJournalier);
  
  const gainsBruts = calculateGrossEarnings({
    presences: stats.PRESENT,
    feries: stats.FERIE,
    conges: stats.CONGE,
    absences: stats.ABSENT + stats.MALADIE,
    heuresSup: stats.heuresSup,
    tauxJournalier,
    tauxHoraire
  });
  
  const { net, dette } = calculateNetPay({
    gainsBruts,
    avances: stats.avances
  });
  
  return {
    employeeId: employeeData.id,
    gainsBruts,
    avances: stats.avances,
    net,
    dette,
    details: {
      tauxJournalier,
      tauxHoraire,
      stats,
      baseSalary
    }
  };
};

/**
 * Valide les règles de sécurité de saisie
 * @param {Object} pointage
 * @returns {Object} Résultat de validation
 */
export const validatePointage = (pointage) => {
  const errors = [];
  
  if ((pointage.statut === 'MALADIE' || pointage.statut === 'CONGE') && pointage.heuresSup > 0) {
    errors.push('Les heures supplémentaires ne sont pas autorisées en cas de maladie ou congé');
  }
  
  if (pointage.heuresSup > 16) {
    errors.push('Les heures supplémentaires ne peuvent pas dépasser 16h');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calcule les statistiques globales
 * @param {Array} employees
 * @param {Array} pointages
 * @returns {Object} Statistiques
 */
export const calculateDashboardStats = (employees, pointages) => {
  let totalNet = 0;
  let totalDette = 0;
  let totalAvances = 0;
  let totalBrut = 0;
  
  employees.forEach(emp => {
    const empPointages = pointages.filter(p => p.employeeId === emp.id);
    const result = calculateEmployeePay(emp, empPointages);
    
    totalNet += result.net;
    totalDette += result.dette;
    totalAvances += result.avances;
    totalBrut += result.gainsBruts;
  });
  
  const presenceStats = pointages.reduce((acc, p) => {
    acc[p.statut]++;
    return acc;
  }, {
    PRESENT: 0,
    ABSENT: 0,
    CONGE: 0,
    MALADIE: 0,
    FERIE: 0
  });
  
  return {
    kpis: {
      netAPayer: totalNet,
      detteTotale: totalDette,
      avancesMois: totalAvances,
      salaireBrut: totalBrut
    },
    presence: presenceStats,
    totalEmployees: employees.length
  };
};