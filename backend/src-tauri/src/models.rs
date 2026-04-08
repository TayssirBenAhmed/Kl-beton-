use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct User {
    pub id: String,
    pub email: String,
    pub password: String,
    pub role: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct Employe {
    pub id: String,
    pub nom: String,
    pub prenom: String,
    pub poste: String,
    pub employee_id: String,
    pub salaire_base: f64,
    pub solde_conges: f64,
    pub solde_maladie: f64,
    pub date_embauche: String,
    pub actif: bool,
    pub prime_transport: f64,
    pub prime_presence: f64,
    pub irpp: f64,
    pub css: f64,
    pub cnss_matricule: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct Pointage {
    pub id: String,
    pub date: String,
    pub statut: String,
    pub heures_supp: f64,
    pub jours_travailles: f64,
    pub avance: f64,
    pub note: Option<String>,
    pub employe_id: String,
    pub is_ferie: bool,
    pub is_dimanche: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct Avance {
    pub id: String,
    pub montant: f64,
    pub date: String,
    pub statut: String,
    pub employe_id: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct Message {
    pub id: String,
    pub content: String,
    pub is_read: bool,
    pub created_at: String,
    pub sender_id: String,
    pub receiver_id: String,
}

// DTOs for requests/responses
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub user: UserPublic,
    pub token: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct UserPublic {
    pub id: String,
    pub email: String,
    pub role: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateEmployeData {
    pub nom: String,
    pub prenom: String,
    pub poste: String,
    pub employee_id: String,
    pub salaire_base: f64,
    pub date_embauche: Option<String>,
    pub prime_transport: Option<f64>,
    pub prime_presence: Option<f64>,
    pub irpp: Option<f64>,
    pub css: Option<f64>,
}

#[derive(Debug, Serialize, Clone)]
pub struct StatusCount {
    pub statut: String,
    pub count: i64,
}

#[derive(Debug, Serialize, Clone)]
pub struct FluxSemaine {
    pub semaine: String,
    pub montant: f64,
}

#[derive(Debug, Serialize, Clone)]
pub struct HsEmploye {
    pub nom: String,
    pub hs: f64,
}

/// Stats détaillées par employé — utilisées pour les graphiques et le tableau récap
#[derive(Debug, Serialize, Clone)]
pub struct EmployeStat {
    pub nom: String,
    pub prenom: String,
    pub poste: String,
    pub jours: f64,    // jours payés (PRESENT + CONGE + FERIE + MALADIE)
    pub hs: f64,       // heures supplémentaires
    pub brut: f64,     // salaire brut
    pub cnss: f64,     // cotisation CNSS (9.18% du brut)
    pub css: f64,      // CSS (1% du brut)
    pub irpp: f64,     // impôt IRPP de l'employé
    pub avances: f64,  // total avances déduites (APPROVED + journalières)
    pub net: f64,      // net à payer (0 si négatif)
    pub dette: f64,    // dette (montant négatif absolu si net < 0)
}

#[derive(Debug, Serialize)]
pub struct DashboardStats {
    pub net_total: f64,
    pub dette_total: f64,
    pub avances_pending: f64,
    pub brut_total: f64,
    pub employes_count: i64,
    pub pointages_today: i64,
    pub distribution: Vec<StatusCount>,
    pub flux_semaines: Vec<FluxSemaine>,
    pub hs_par_employe: Vec<HsEmploye>,
    pub employe_stats: Vec<EmployeStat>,
}
