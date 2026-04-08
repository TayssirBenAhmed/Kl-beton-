use crate::db::DbPool;
use chrono::Utc;
use serde::Serialize;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct PretResponse {
    pub id: String,
    pub employe_id: String,
    pub employe_nom: String,
    pub employe_prenom: String,
    pub montant_total: f64,
    pub mensualite: f64,
    pub solde_restant: f64,
    pub date_debut: String,
    pub statut: String,
}

#[derive(Debug, sqlx::FromRow)]
struct PretRow {
    mensualite: f64,
    solde_restant: f64,
}

// ── GET ALL ACTIVE PRETS ──────────────────────────────────────────────────────
#[tauri::command]
pub async fn get_all_prets(
    pool: tauri::State<'_, DbPool>,
) -> Result<Vec<PretResponse>, String> {
    sqlx::query_as::<sqlx::Sqlite, PretResponse>(
        r#"SELECT p.id, p.employe_id,
                  e.nom  AS employe_nom,
                  e.prenom AS employe_prenom,
                  p.montant_total, p.mensualite, p.solde_restant,
                  p.date_debut, p.statut
           FROM Pret p
           JOIN Employe e ON e.id = p.employe_id
           ORDER BY p.created_at DESC"#,
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))
}

// ── GET ACTIVE PRETS FOR ONE EMPLOYEE ────────────────────────────────────────
#[tauri::command]
pub async fn get_prets_employe(
    pool: tauri::State<'_, DbPool>,
    employe_id: String,
) -> Result<Vec<PretResponse>, String> {
    sqlx::query_as::<sqlx::Sqlite, PretResponse>(
        r#"SELECT p.id, p.employe_id,
                  e.nom  AS employe_nom,
                  e.prenom AS employe_prenom,
                  p.montant_total, p.mensualite, p.solde_restant,
                  p.date_debut, p.statut
           FROM Pret p
           JOIN Employe e ON e.id = p.employe_id
           WHERE p.employe_id = ? AND p.statut = 'ACTIF'
           ORDER BY p.created_at DESC"#,
    )
    .bind(&employe_id)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))
}

// ── CREATE PRET ───────────────────────────────────────────────────────────────
#[tauri::command]
pub async fn create_pret(
    pool: tauri::State<'_, DbPool>,
    employe_id: String,
    montant_total: f64,
    mensualite: f64,
) -> Result<PretResponse, String> {
    let id  = cuid2::create_id();
    let now = Utc::now().to_rfc3339();

    sqlx::query(
        r#"INSERT INTO Pret
               (id, employe_id, montant_total, mensualite, solde_restant, date_debut, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)"#,
    )
    .bind(&id)
    .bind(&employe_id)
    .bind(montant_total)
    .bind(mensualite)
    .bind(montant_total)   // solde_restant starts equal to montant_total
    .bind(&now)
    .bind(&now)
    .execute(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))?;

    sqlx::query_as::<sqlx::Sqlite, PretResponse>(
        r#"SELECT p.id, p.employe_id,
                  e.nom  AS employe_nom,
                  e.prenom AS employe_prenom,
                  p.montant_total, p.mensualite, p.solde_restant,
                  p.date_debut, p.statut
           FROM Pret p
           JOIN Employe e ON e.id = p.employe_id
           WHERE p.id = ?"#,
    )
    .bind(&id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))
}

// ── REMBOURSER UNE MENSUALITE ─────────────────────────────────────────────────
/// Déduit le montant effectif du solde et marque le prêt REMBOURSE si soldé.
/// `montant_effectif` : montant réellement prélevé ce mois-ci (peut être
///   inférieur à la mensualité si le salaire ne couvre pas la mensualité).
///   Si None, utilise min(mensualite, solde_restant).
/// Retourne le montant effectivement prélevé.
#[tauri::command]
pub async fn rembourser_mensualite(
    pool: tauri::State<'_, DbPool>,
    pret_id: String,
    montant_effectif: Option<f64>,
) -> Result<f64, String> {
    let row = sqlx::query_as::<sqlx::Sqlite, PretRow>(
        "SELECT mensualite, solde_restant FROM Pret WHERE id = ? AND statut = 'ACTIF'",
    )
    .bind(&pret_id)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))?;

    let PretRow { mensualite, solde_restant } = match row {
        Some(r) => r,
        None    => return Err("Pret non trouve ou deja rembourse".to_string()),
    };

    // Use caller-supplied effective amount (already capped at earned salary),
    // otherwise fall back to min(mensualite, solde_restant).
    let montant_remb = if let Some(eff) = montant_effectif {
        eff.min(solde_restant).max(0.0)
    } else {
        if solde_restant < mensualite { solde_restant } else { mensualite }
    };
    let nouveau_solde = (solde_restant - montant_remb).max(0.0);
    let nouveau_statut = if nouveau_solde <= 0.001 { "REMBOURSE" } else { "ACTIF" };

    sqlx::query("UPDATE Pret SET solde_restant = ?, statut = ? WHERE id = ?")
        .bind(nouveau_solde)
        .bind(nouveau_statut)
        .bind(&pret_id)
        .execute(pool.inner())
        .await
        .map_err(|e| format!("DB error: {}", e))?;

    Ok(montant_remb)
}
