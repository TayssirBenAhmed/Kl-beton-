use crate::db::DbPool;
use crate::models::Pointage;
use chrono::{Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct SavePointageData {
    pub employe_id: String,
    pub date: String,
    pub statut: String,
    pub heures_supp: f64,
    pub jours_travailles: f64,
    pub avance: f64,
    pub note: Option<String>,
    pub is_ferie: Option<bool>,
    pub is_dimanche: Option<bool>,
}

#[tauri::command]
pub async fn get_pointages(
    pool: tauri::State<'_, DbPool>,
    date_debut: String,
    date_fin: String,
) -> Result<Vec<Pointage>, String> {
    sqlx::query_as::<_, Pointage>(
        "SELECT id, date, statut, heures_supp, jours_travailles, avance, note, employe_id, is_ferie, is_dimanche, created_at, updated_at FROM Pointage WHERE date >= ? AND date <= ?"
    )
    .bind(date_debut)
    .bind(date_fin)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))
}

#[tauri::command]
pub async fn get_pointages_mois(
    pool: tauri::State<'_, DbPool>,
    mois: i32,
    annee: i32,
) -> Result<Vec<Pointage>, String> {
    let date_pattern = format!("{}-{:02}-%", annee, mois);
    sqlx::query_as::<_, Pointage>(
        "SELECT id, date, statut, heures_supp, jours_travailles, avance, note, employe_id, is_ferie, is_dimanche, created_at, updated_at FROM Pointage WHERE date LIKE ?"
    )
    .bind(date_pattern)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))
}

#[tauri::command]
pub async fn save_pointages(
    pool: tauri::State<'_, DbPool>,
    date: String,
    pointages: Vec<SavePointageData>,
) -> Result<(), String> {
    let now = Utc::now().to_rfc3339();

    for p in pointages {
        // ── Statut actuel (avant upsert) pour détecter les changements CONGÉ ─
        let ancien_statut: Option<String> = sqlx::query_scalar(
            "SELECT statut FROM Pointage WHERE employe_id = ? AND date = ?"
        )
        .bind(&p.employe_id)
        .bind(&p.date)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| format!("DB error (ancien statut): {}", e))?;

        let id = cuid2::create_id();
        sqlx::query(
            "INSERT INTO Pointage (id, date, statut, heures_supp, jours_travailles, avance, note, employe_id, is_ferie, is_dimanche, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(employe_id, date) DO UPDATE SET
                statut = excluded.statut,
                heures_supp = excluded.heures_supp,
                jours_travailles = excluded.jours_travailles,
                avance = excluded.avance,
                note = excluded.note,
                is_ferie = excluded.is_ferie,
                is_dimanche = excluded.is_dimanche,
                updated_at = excluded.updated_at"
        )
        .bind(&id)
        .bind(&p.date)
        .bind(&p.statut)
        .bind(p.heures_supp)
        .bind(p.jours_travailles)
        .bind(p.avance)
        .bind(&p.note)
        .bind(&p.employe_id)
        .bind(p.is_ferie.unwrap_or(false))
        .bind(p.is_dimanche.unwrap_or(false))
        .bind(&now)
        .bind(&now)
        .execute(pool.inner())
        .await
        .map_err(|e| format!("DB error: {}", e))?;

        // ── Ajustement du solde_conges ────────────────────────────────────────
        let etait_conge = ancien_statut.as_deref() == Some("CONGE");
        let est_conge   = p.statut == "CONGE";
        if !etait_conge && est_conge {
            // Nouveau CONGÉ : déduire 1 jour (plancher à 0)
            sqlx::query(
                "UPDATE Employe SET solde_conges = MAX(0, solde_conges - 1) WHERE id = ?"
            )
            .bind(&p.employe_id)
            .execute(pool.inner())
            .await
            .map_err(|e| format!("DB error (solde conges -1): {}", e))?;
        } else if etait_conge && !est_conge {
            // CONGÉ → autre statut : restituer 1 jour
            sqlx::query(
                "UPDATE Employe SET solde_conges = solde_conges + 1 WHERE id = ?"
            )
            .bind(&p.employe_id)
            .execute(pool.inner())
            .await
            .map_err(|e| format!("DB error (solde conges +1): {}", e))?;
        }

        // Sync avance to Avance table: deterministic ID based on (employe_id, date)
        let avance_id = format!("ptg-{}-{}", p.employe_id, p.date);
        if p.avance > 0.0 {
            sqlx::query(
                "INSERT INTO Avance (id, montant, date, statut, employe_id, created_at) VALUES (?, ?, ?, 'PENDING', ?, ?)
                 ON CONFLICT(id) DO UPDATE SET montant = excluded.montant WHERE Avance.statut = 'PENDING'"
            )
            .bind(&avance_id)
            .bind(p.avance)
            .bind(&p.date)
            .bind(&p.employe_id)
            .bind(&now)
            .execute(pool.inner())
            .await
            .map_err(|e| format!("DB error (avance sync): {}", e))?;
        } else {
            sqlx::query("DELETE FROM Avance WHERE id = ? AND statut = 'PENDING'")
                .bind(&avance_id)
                .execute(pool.inner())
                .await
                .map_err(|e| format!("DB error (avance del): {}", e))?;
        }
    }

    Ok(())
}
