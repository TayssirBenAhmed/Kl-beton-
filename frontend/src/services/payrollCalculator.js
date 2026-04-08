// Constantes de paie
const WORKING_DAYS_PER_MONTH = 26;
const WORKING_HOURS_PER_DAY = 8;
const OVERTIME_MULTIPLIER = 1.0;  // 100% — taux normal
const CNSS_RATE = 0.0918; // 9.18%
const TRANSPORT_PRIME = 60;
const PRESENCE_PRIME = 10;

/**
 * Calcule le taux journalier
 */
export const calculateDailyRate = (baseSalary) => {
    return baseSalary / WORKING_DAYS_PER_MONTH;
};

/**
 * Calcule le taux horaire normal
 */
export const calculateHourlyRate = (dailyRate) => {
    return dailyRate / WORKING_HOURS_PER_DAY;
};

/**
 * Calcule le taux horaire majoré (HS)
 */
export const calculateOvertimeRate = (hourlyRate) => {
    return hourlyRate * OVERTIME_MULTIPLIER;
};

/**
 * Calcule les gains journaliers
 */
export const calculateDailyEarnings = (stats, dailyRate) => {
    const { present, holiday, leave, absent } = stats;
    const paidDays = present + holiday + leave - absent;
    return Math.max(0, paidDays) * dailyRate;
};

/**
 * Calcule les gains HS
 */
export const calculateOvertimeEarnings = (overtimeHours, overtimeRate) => {
    return overtimeHours * overtimeRate;
};

/**
 * Calcule les primes
 */
export const calculatePrimes = () => {
    return TRANSPORT_PRIME + PRESENCE_PRIME;
};

/**
 * Calcule la CNSS
 */
export const calculateCNSS = (gross) => {
    return gross * CNSS_RATE;
};

/**
 * Calcule l'IRPP selon le barème tunisien simplifié
 */
export const calculateIRPP = (gross) => {
    // Barème mensuel simplifié
    if (gross <= 1500) return 0;
    if (gross <= 2000) return gross * 0.15;
    if (gross <= 3000) return gross * 0.2;
    if (gross <= 5000) return gross * 0.27;
    return gross * 0.35;
};

/**
 * Calcule la CSS (1%)
 */
export const calculateCSS = (gross) => {
    return gross * 0.01;
};

/**
 * Calcule la paie complète d'un employé
 */
export const calculateEmployeePay = (employee, pointages, month, year) => {
    // Filtrer les pointages du mois
    const monthPointages = pointages.filter(p => {
        const date = new Date(p.date);
        return date.getMonth() === month && date.getFullYear() === year;
    });

    // Statistiques
    const stats = monthPointages.reduce((acc, p) => {
        acc[p.statut]++;
        acc.overtime += p.heuresSup || 0;
        acc.advances += p.avance || 0;
        return acc;
    }, {
        PRESENT: 0,
        ABSENT: 0,
        FERIE: 0,
        CONGE: 0,
        MALADIE: 0,
        overtime: 0,
        advances: 0
    });

    // Taux
    const dailyRate = calculateDailyRate(employee.salaireBase);
    const hourlyRate = calculateHourlyRate(dailyRate);
    const overtimeRate = calculateOvertimeRate(hourlyRate);

    // Gains
    const dailyEarnings = calculateDailyEarnings(stats, dailyRate);
    const overtimeEarnings = calculateOvertimeEarnings(stats.overtime, overtimeRate);
    const primes = calculatePrimes();

    const gross = dailyEarnings + overtimeEarnings + primes;

    // Retenues
    const cnss = calculateCNSS(gross);
    const irpp = calculateIRPP(gross - cnss);
    const css = calculateCSS(gross);

    const deductions = cnss + irpp + css;

    // Net avant avances
    const netBeforeAdvances = gross - deductions;

    // Net final avec avances
    const net = Math.max(0, netBeforeAdvances - stats.advances);

    // Dette si négatif
    const debt = netBeforeAdvances - stats.advances < 0 ? Math.abs(netBeforeAdvances - stats.advances) : 0;

    return {
        employeeId: employee.id,
        employeeName: `${employee.prenom} ${employee.nom}`,
        stats,
        dailyRate,
        hourlyRate,
        overtimeRate,
        dailyEarnings,
        overtimeEarnings,
        primes,
        gross,
        cnss,
        irpp,
        css,
        deductions,
        netBeforeAdvances,
        advances: stats.advances,
        net,
        debt,
        month,
        year
    };
};

/**
 * Calcule la paie mensuelle pour tous les employés
 */
export const calculateMonthlyPayroll = (employees, pointages, month, year) => {
    return employees.map(emp => calculateEmployeePay(emp, pointages, month, year));
};

/**
 * Calcule les totaux du dashboard
 */
export const calculateDashboardTotals = (payrollResults) => {
    return payrollResults.reduce((acc, p) => {
        acc.netTotal += p.net;
        acc.debtTotal += p.debt;
        acc.advancesTotal += p.advances;
        acc.grossTotal += p.gross;
        return acc;
    }, { netTotal: 0, debtTotal: 0, advancesTotal: 0, grossTotal: 0 });
};