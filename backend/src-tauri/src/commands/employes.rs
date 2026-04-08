use crate::db::DbPool;
use crate::models::{CreateEmployeData, Employe};
use chrono::{Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct EmployeResponse {
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
}

#[tauri::command]
pub async fn get_all_employees(
    pool: tauri::State<'_, DbPool>,
) -> Result<Vec<EmployeResponse>, String> {
    let rows = sqlx::query_as::<_, Employe>(
        "SELECT id, nom, prenom, poste, employee_id, salaire_base, solde_conges, solde_maladie, date_embauche, actif, prime_transport, prime_presence, irpp, css, cnss_matricule, created_at FROM Employe WHERE actif = 1 ORDER BY nom ASC"
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))?;

    let employes = rows.into_iter().map(|r| EmployeResponse {
        id: r.id,
        nom: r.nom,
        prenom: r.prenom,
        poste: r.poste,
        employee_id: r.employee_id,
        salaire_base: r.salaire_base,
        solde_conges: r.solde_conges,
        solde_maladie: r.solde_maladie,
        date_embauche: r.date_embauche,
        actif: r.actif,
        prime_transport: r.prime_transport,
        prime_presence: r.prime_presence,
        irpp: r.irpp,
        css: r.css,
        cnss_matricule: r.cnss_matricule,
    }).collect();

    Ok(employes)
}

#[tauri::command]
pub async fn get_employe_by_id(
    pool: tauri::State<'_, DbPool>,
    id: String,
) -> Result<EmployeResponse, String> {
    let r = sqlx::query_as::<_, Employe>(
        "SELECT id, nom, prenom, poste, employee_id, salaire_base, solde_conges, solde_maladie, date_embauche, actif, prime_transport, prime_presence, irpp, css, cnss_matricule, created_at FROM Employe WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))?
    .ok_or("Employé non trouvé")?;

    Ok(EmployeResponse {
        id: r.id,
        nom: r.nom,
        prenom: r.prenom,
        poste: r.poste,
        employee_id: r.employee_id,
        salaire_base: r.salaire_base,
        solde_conges: r.solde_conges,
        solde_maladie: r.solde_maladie,
        date_embauche: r.date_embauche,
        actif: r.actif,
        prime_transport: r.prime_transport,
        prime_presence: r.prime_presence,
        irpp: r.irpp,
        css: r.css,
        cnss_matricule: r.cnss_matricule,
    })
}

#[tauri::command]
pub async fn create_employe(
    pool: tauri::State<'_, DbPool>,
    data: CreateEmployeData,
) -> Result<EmployeResponse, String> {
    let id = cuid2::create_id();
    let now = Utc::now();
    let date_embauche = match data.date_embauche {
        Some(d) => d,
        None => now.to_rfc3339(),
    };
    let nom_upper = data.nom.to_uppercase();

    // Generate or validate employee_id
    let mut employee_id = data.employee_id.trim().to_string();
    if employee_id.is_empty() {
        // Auto-generate: e.g. first 3 letters of nom + sequential number
        let prefix = &nom_upper[0..3].to_uppercase();
        let row: (i64,) = sqlx::query_as("SELECT COALESCE(MAX(CAST(SUBSTR(employee_id, 4) AS INTEGER)), 0) + 1 FROM Employe WHERE employee_id LIKE $1")
            .bind(format!("{}%", prefix))
            .fetch_one(pool.inner())
            .await
            .map_err(|e| format!("DB error generating ID: {}", e))?;
        employee_id = format!("{}{:03}", prefix, row.0);
    } else {
        // Check if exists
        let exists: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM Employe WHERE employee_id = $1")
            .bind(&employee_id)
            .fetch_one(pool.inner())
            .await
            .map_err(|e| format!("DB error checking ID: {}", e))?;
        if exists.0 > 0 {
            return Err(format!("Matricule '{}' déjà utilisé", employee_id));
        }
    }

    sqlx::query(
        "INSERT INTO Employe (id, nom, prenom, poste, employee_id, salaire_base, solde_conges, solde_maladie, date_embauche, actif, prime_transport, prime_presence, irpp, css, created_at) VALUES (?, ?, ?, ?, ?, ?, 18.0, 10.0, ?, 1, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&nom_upper)
    .bind(&data.prenom)
    .bind(&data.poste)
    .bind(&employee_id)
    .bind(data.salaire_base)
    .bind(date_embauche)
    .bind(data.prime_transport.unwrap_or(60.0))
    .bind(data.prime_presence.unwrap_or(10.0))
    .bind(data.irpp.unwrap_or(0.0))
    .bind(data.css.unwrap_or(0.0))
    .bind(now.to_rfc3339())
    .execute(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))?;


    get_employe_by_id(pool, id).await
}

#[derive(Debug, Deserialize)]
pub struct UpdateEmployeData {
    pub nom: Option<String>,
    pub prenom: Option<String>,
    pub poste: Option<String>,
    pub salaire_base: Option<f64>,
    pub prime_transport: Option<f64>,
    pub prime_presence: Option<f64>,
    pub irpp: Option<f64>,
    pub css: Option<f64>,
    pub cnss_matricule: Option<String>,
}

#[tauri::command]
pub async fn update_employe(
    pool: tauri::State<'_, DbPool>,
    id: String,
    data: UpdateEmployeData,
) -> Result<EmployeResponse, String> {
    if let Some(nom) = &data.nom {
        let nom_upper = nom.to_uppercase();
        sqlx::query("UPDATE Employe SET nom = ? WHERE id = ?").bind(nom_upper).bind(&id)
            .execute(pool.inner())
            .await
            .map_err(|e| format!("DB error: {}", e))?;
    }
    if let Some(prenom) = &data.prenom {
        sqlx::query("UPDATE Employe SET prenom = ? WHERE id = ?").bind(prenom).bind(&id)
            .execute(pool.inner())
            .await
            .map_err(|e| format!("DB error: {}", e))?;
    }
    if let Some(poste) = &data.poste {
        sqlx::query("UPDATE Employe SET poste = ? WHERE id = ?").bind(poste).bind(&id)
            .execute(pool.inner())
            .await
            .map_err(|e| format!("DB error: {}", e))?;
    }
    if let Some(salaire) = data.salaire_base {
        sqlx::query("UPDATE Employe SET salaire_base = ? WHERE id = ?").bind(salaire).bind(&id)
            .execute(pool.inner())
            .await
            .map_err(|e| format!("DB error: {}", e))?;
    }
    if let Some(val) = data.prime_transport {
        sqlx::query("UPDATE Employe SET prime_transport = ? WHERE id = ?").bind(val).bind(&id)
            .execute(pool.inner())
            .await
            .map_err(|e| format!("DB error: {}", e))?;
    }
    if let Some(val) = data.prime_presence {
        sqlx::query("UPDATE Employe SET prime_presence = ? WHERE id = ?").bind(val).bind(&id)
            .execute(pool.inner())
            .await
            .map_err(|e| format!("DB error: {}", e))?;
    }
    if let Some(val) = data.irpp {
        sqlx::query("UPDATE Employe SET irpp = ? WHERE id = ?").bind(val).bind(&id)
            .execute(pool.inner())
            .await
            .map_err(|e| format!("DB error: {}", e))?;
    }
    if let Some(val) = data.css {
        sqlx::query("UPDATE Employe SET css = ? WHERE id = ?").bind(val).bind(&id)
            .execute(pool.inner())
            .await
            .map_err(|e| format!("DB error: {}", e))?;
    }
    if let Some(val) = data.cnss_matricule {
        sqlx::query("UPDATE Employe SET cnss_matricule = ? WHERE id = ?").bind(val).bind(&id)
            .execute(pool.inner())
            .await
            .map_err(|e| format!("DB error: {}", e))?;
    }

    get_employe_by_id(pool, id).await
}

#[tauri::command]
pub async fn delete_employe(
    pool: tauri::State<'_, DbPool>,
    id: String,
) -> Result<(), String> {
    sqlx::query("UPDATE Employe SET actif = 0 WHERE id = ?").bind(id)
        .execute(pool.inner())
        .await
        .map_err(|e| format!("DB error: {}", e))?;
    Ok(())
}
