use crate::db::DbPool;
use serde::Serialize;

/// Returns all employee IDs that have merit bonus for a given month.
/// mois format: "YYYY-MM"
#[tauri::command]
pub async fn get_merit_mois(
    pool: tauri::State<'_, DbPool>,
    mois: String,
) -> Result<Vec<String>, String> {
    let rows = sqlx::query_scalar::<sqlx::Sqlite, String>(
        "SELECT employe_id FROM MeritBonus WHERE mois = ?",
    )
    .bind(&mois)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))?;

    Ok(rows)
}

/// Assigns or removes merit bonus for an employee for a given month.
/// is_merit = true  → INSERT OR IGNORE
/// is_merit = false → DELETE
#[tauri::command]
pub async fn save_merit_status(
    pool: tauri::State<'_, DbPool>,
    employe_id: String,
    mois: String,
    is_merit: bool,
) -> Result<(), String> {
    if is_merit {
        sqlx::query(
            "INSERT OR IGNORE INTO MeritBonus (employe_id, mois) VALUES (?, ?)",
        )
        .bind(&employe_id)
        .bind(&mois)
        .execute(pool.inner())
        .await
        .map_err(|e| format!("DB error: {}", e))?;
    } else {
        sqlx::query(
            "DELETE FROM MeritBonus WHERE employe_id = ? AND mois = ?",
        )
        .bind(&employe_id)
        .bind(&mois)
        .execute(pool.inner())
        .await
        .map_err(|e| format!("DB error: {}", e))?;
    }
    Ok(())
}

/// Returns full merit status for a month: { employe_id -> bool }
/// Useful for bulk-loading the bonusMap on page mount.
#[derive(Debug, Serialize)]
pub struct MeritEntry {
    pub employe_id: String,
    pub has_merit: bool,
}

#[tauri::command]
pub async fn get_all_merit_mois(
    pool: tauri::State<'_, DbPool>,
    mois: String,
) -> Result<Vec<MeritEntry>, String> {
    // All employees that have merit for this month
    let ids = sqlx::query_scalar::<sqlx::Sqlite, String>(
        "SELECT employe_id FROM MeritBonus WHERE mois = ?",
    )
    .bind(&mois)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))?;

    Ok(ids.into_iter().map(|id| MeritEntry { employe_id: id, has_merit: true }).collect())
}
