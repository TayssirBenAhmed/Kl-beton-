import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
    fr: {
        // Navigation
        dashboard: "Tableau de Bord",
        employees: "Employés",
        attendance: "Pointage",
        history: "Historique",
        audit: "Contrôle",
        messages: "Messages",
        settings: "Paramètres",
        logout: "Déconnexion",

        // Statuts
        present: "PRÉSENT",
        absent: "ABSENT",
        holiday: "FÉRIÉ",
        leave: "CONGÉ",
        sick: "MALADIE",

        // Champs
        overtime: "Heures Sup",
        advance: "Avance",
        notes: "Notes",
        date: "Date",
        status: "Statut",

        // Actions
        save: "Sauvegarder",
        cancel: "Annuler",
        edit: "Modifier",
        delete: "Supprimer",
        search: "Rechercher",
        filter: "Filtrer",
        export: "Exporter",
        generatePDF: "Générer PDF",

        // Chef
        attendanceSheet: "Feuille de Présence",
        consultationArchive: "ARCHIVE DE CONSULTATION",
        industrialSystem: "SYSTÈME INDUSTRIEL",
        editRecord: "MODIFIER LA SAISIE",
        monthLocked: "MOIS VERROUILLÉ",
        overtimeShort: "HS",
        totalAdvances: "Avances Total",
        controlAndValidation: "CONTRÔLE & VALIDATION",
        validated: "VALIDÉ",
        generatingPdf: "Génération PDF...",
        auditReport: "RAPPORT DE CONTRÔLE",
        employee: "Employé",
        control: "Contrôle",
        verified: "VÉRIFIÉ",
        notReported: "Non pointé",
        errorToCorrect: "Erreur à corriger",
        justificationMandatory: "Justification obligatoire",
        noOvertimeInSickLeave: "HS interdites en maladie",
        noOvertimeInVacation: "HS interdites en congé",
        incompleteEntry: "Saisie incomplète",
        error: "ERREUR",
        missing: "OUBLI",

        // Admin
        netToPay: "Net à Payer",
        totalDebt: "Dette Totale",
        grossSalary: "Salaire Brut",
        payroll: "Paie",
        advances: "Avances",
        reports: "Rapports",

        // Messages
        updateSuccess: "Mise à jour réussie",
        updateError: "Erreur lors de la mise à jour",
        connectionError: "Erreur de connexion",
        loading: "Chargement...",

        // Industrial Overhaul
        vaultAlpha: "Vault Alpha",
        productionMonitor: "Moniteur Production",
        performanceMetrics: "Métriques Performance",
        netTotal: "Total Net",
        averageSalary: "Salaire Moyen",
        activeEmployees: "Employés Actifs",
        alerts: "Alertes",
        syncStatus: "Statut Synchro",
        industrialPremium: "Industrial Premium",

        // Dashboard charts
        financialFlow: "FLUX FINANCIER",
        overtimeHours: "HEURES SUPPLÉMENTAIRES",
        dailyDistribution: "RÉPARTITION DES PRÉSENCES",
        adminDashboard: "TABLEAU DE BORD ADMINISTRATION",
        weeklyAdvances: "AVANCES / SEMAINE",
        approve: "APPROUVER",
        reject: "REJETER",
        advanceApproved: "AVANCE APPROUVÉE AVEC SUCCÈS",
        advanceRejected: "AVANCE REJETÉE",
        pendingCount: "EN ATTENTE",
        transactionHistory: "HISTORIQUE DES TRANSACTIONS",
        noData: "AUCUNE DONNÉE",
        noDataMonth: "AUCUNE DONNÉE CE MOIS",
        loadingData: "CHARGEMENT DES DONNÉES...",
        controlFinance: "CONTRÔLE DES",

        // Directions
        dir: "ltr"
    },

    ar: {
        // Navigation
        dashboard: "لوحة القيادة",
        employees: "الموظفين",
        attendance: "الحضور",
        history: "السجل",
        audit: "التدقيق",
        messages: "الرسائل",
        settings: "الإعدادات",
        logout: "تسجيل الخروج",

        // Statuts
        present: "حاضر",
        absent: "غائب",
        holiday: "عطلة رسمية",
        leave: "إجازة",
        sick: "مرضي",

        // Champs
        overtime: "ساعات إضافية",
        advance: "سلفة",
        notes: "ملاحظات",
        date: "التاريخ",
        status: "الحالة",

        // Actions
        save: "حفظ",
        cancel: "إلغاء",
        edit: "تعديل",
        delete: "حذف",
        search: "بحث",
        filter: "تصفية",
        export: "تصدير",
        generatePDF: "إنشاء PDF",

        // Chef
        attendanceSheet: "ورقة الحضور",
        consultationArchive: "أرشيف الاستشارة",
        industrialSystem: "نظام صناعي",
        editRecord: "تعديل السجل",
        monthLocked: "الشهر مقفل",
        overtimeShort: "س.إ",
        totalAdvances: "إجمالي السلف",
        controlAndValidation: "التدقيق والتحقق",
        validated: "تم التحقق",
        generatingPdf: "جاري إنشاء PDF...",
        auditReport: "تقرير التدقيق",
        employee: "الموظف",
        control: "تدقيق",
        verified: "تم التحقق",
        notReported: "غير مسجل",
        errorToCorrect: "خطأ يجب تصحيحه",
        justificationMandatory: "التبرير إلزامي",
        noOvertimeInSickLeave: "الساعات الإضافية ممنوعة في المرض",
        noOvertimeInVacation: "الساعات الإضافية ممنوعة في الإجازة",
        incompleteEntry: "إدخال غير مكتمل",
        error: "خطأ",
        missing: "نسيان",

        // Admin
        netToPay: "صافي الدفع",
        totalDebt: "إجمالي الديون",
        grossSalary: "الراتب الإجمالي",
        payroll: "كشف الرواتب",
        advances: "السلف",
        reports: "التقارير",

        // Messages
        updateSuccess: "تم التحديث بنجاح",
        updateError: "خطأ في التحديث",
        connectionError: "خطأ في الاتصال",
        loading: "جاري التحميل...",

        // Industrial Overhaul
        vaultAlpha: "Vault Alpha",
        productionMonitor: "مراقب الإنتاج",
        performanceMetrics: "مقاييس الأداء",
        netTotal: "إجمالي الصافي",
        averageSalary: "متوسط الراتب",
        activeEmployees: "الموظفين النشطين",
        alerts: "تنبيهات",
        syncStatus: "حالة المزامنة",
        industrialPremium: "Industrial Premium",

        // Dashboard charts
        financialFlow: "التدفق المالي",
        overtimeHours: "ساعات إضافية",
        dailyDistribution: "توزيع الحضور",
        adminDashboard: "لوحة قيادة الإدارة",
        weeklyAdvances: "السلف الأسبوعية",
        approve: "موافقة",
        reject: "رفض",
        advanceApproved: "تم قبول السلفة بنجاح",
        advanceRejected: "تم رفض السلفة",
        pendingCount: "معلق",
        transactionHistory: "سجل المعاملات",
        noData: "لا توجد بيانات",
        noDataMonth: "لا توجد بيانات هذا الشهر",
        loadingData: "جاري تحميل البيانات...",
        controlFinance: "مراقبة",

        // Directions
        dir: "rtl"
    },

    en: {
        // Navigation
        dashboard: "Dashboard",
        employees: "Employees",
        attendance: "Attendance",
        history: "History",
        audit: "Audit",
        messages: "Messages",
        settings: "Settings",
        logout: "Logout",

        // Statuts
        present: "PRESENT",
        absent: "ABSENT",
        holiday: "HOLIDAY",
        leave: "LEAVE",
        sick: "SICK",

        // Champs
        overtime: "Overtime",
        advance: "Advance",
        notes: "Notes",
        date: "Date",
        status: "Status",

        // Actions
        save: "Save",
        cancel: "Cancel",
        edit: "Edit",
        delete: "Delete",
        search: "Search",
        filter: "Filter",
        export: "Export",
        generatePDF: "Generate PDF",

        // Chef
        attendanceSheet: "Attendance Sheet",
        consultationArchive: "CONSULTATION ARCHIVE",
        industrialSystem: "INDUSTRIAL SYSTEM",
        editRecord: "EDIT RECORD",
        monthLocked: "MONTH LOCKED",
        overtimeShort: "OT",
        totalAdvances: "Total Advances",
        controlAndValidation: "CONTROL & VALIDATION",
        validated: "VALIDATED",
        generatingPdf: "Generating PDF...",
        auditReport: "AUDIT REPORT",
        employee: "Employee",
        control: "Control",
        verified: "VERIFIED",
        notReported: "Not reported",
        errorToCorrect: "Error to correct",
        justificationMandatory: "Justification mandatory",
        noOvertimeInSickLeave: "Overtime not allowed in sick leave",
        noOvertimeInVacation: "Overtime not allowed in vacation",
        incompleteEntry: "Incomplete entry",
        error: "ERROR",
        missing: "MISSING",

        // Admin
        netToPay: "Net to Pay",
        totalDebt: "Total Debt",
        grossSalary: "Gross Salary",
        payroll: "Payroll",
        advances: "Advances",
        reports: "Reports",

        // Messages
        updateSuccess: "Update successful",
        updateError: "Update error",
        connectionError: "Connection error",
        loading: "Loading...",

        // Industrial Overhaul
        vaultAlpha: "Vault Alpha",
        productionMonitor: "Production Monitor",
        performanceMetrics: "Performance Metrics",
        netTotal: "Net Total",
        averageSalary: "Average Salary",
        activeEmployees: "Active Employees",
        alerts: "Alerts",
        syncStatus: "Sync Status",
        industrialPremium: "Industrial Premium",

        // Dashboard charts
        financialFlow: "FINANCIAL FLOW",
        overtimeHours: "OVERTIME HOURS",
        dailyDistribution: "ATTENDANCE DISTRIBUTION",
        adminDashboard: "ADMINISTRATION DASHBOARD",
        weeklyAdvances: "WEEKLY ADVANCES",
        approve: "APPROVE",
        reject: "REJECT",
        advanceApproved: "ADVANCE APPROVED SUCCESSFULLY",
        advanceRejected: "ADVANCE REJECTED",
        pendingCount: "PENDING",
        transactionHistory: "TRANSACTION HISTORY",
        noData: "NO DATA",
        noDataMonth: "NO DATA THIS MONTH",
        loadingData: "LOADING DATA...",
        controlFinance: "ADVANCES",

        // Directions
        dir: "ltr"
    }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('language');
        return saved || 'fr';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
        document.documentElement.dir = translations[language].dir;
        document.documentElement.lang = language;
    }, [language]);

    const t = (key) => {
        return translations[language][key] || translations.fr[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, dir: translations[language].dir }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};