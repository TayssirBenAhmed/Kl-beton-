use crate::db::DbPool;
use chrono::Utc;
use serde::Serialize;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct AvanceResponse {
    pub id: String,
    pub montant: f64,
    pub date: String,
    pub statut: String,
    pub employe_id: String,
    pub employe_nom: String,
    pub employe_prenom: String,
    pub employe_poste: String,
}

#[tauri::command]
pub async fn get_all_advances(
    pool: tauri::State<'_, DbPool>,
) -> Result<Vec<AvanceResponse>, String> {
    let rows = sqlx::query_as::<sqlx::Sqlite, AvanceResponse>(
        r#"SELECT a.id, a.montant, a.date, a.statut, a.employe_id,
                  e.nom as employe_nom, e.prenom as employe_prenom, e.poste as employe_poste
           FROM Avance a
           JOIN Employe e ON e.id = a.employe_id
           ORDER BY a.date DESC"#
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))?;

    Ok(rows)
}

#[tauri::command]
pub async fn create_advance(
    pool: tauri::State<'_, DbPool>,
    employe_id: String,
    montant: f64,
) -> Result<AvanceResponse, String> {
    let id = cuid2::create_id();
    let now = Utc::now().to_rfc3339();

    sqlx::query(
        "INSERT INTO Avance (id, montant, date, statut, employe_id, created_at) VALUES (?, ?, ?, 'PENDING', ?, ?)"
    )
    .bind(&id)
    .bind(montant)
    .bind(&now)
    .bind(&employe_id)
    .bind(&now)
    .execute(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))?;

    let r = sqlx::query_as::<sqlx::Sqlite, AvanceResponse>(
        r#"SELECT a.id, a.montant, a.date, a.statut, a.employe_id,
                  e.nom as employe_nom, e.prenom as employe_prenom, e.poste as employe_poste
           FROM Avance a
           JOIN Employe e ON e.id = a.employe_id
           WHERE a.id = ?"#
    )
    .bind(&id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))?;

    Ok(r)
}

#[tauri::command]
pub async fn approve_advance(
    pool: tauri::State<'_, DbPool>,
    id: String,
) -> Result<(), String> {
    sqlx::query("UPDATE Avance SET statut = 'APPROVED' WHERE id = ?").bind(id)
        .execute(pool.inner())
        .await
        .map_err(|e| format!("DB error: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn reject_advance(
    pool: tauri::State<'_, DbPool>,
    id: String,
) -> Result<(), String> {
    sqlx::query("UPDATE Avance SET statut = 'REJECTED' WHERE id = ?").bind(id)
        .execute(pool.inner())
        .await
        .map_err(|e| format!("DB error: {}", e))?;
    Ok(())
}
