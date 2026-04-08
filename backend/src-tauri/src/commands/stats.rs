use crate::db::DbPool;
use crate::models::{DashboardStats, Employe, StatusCount, FluxSemaine, HsEmploye, EmployeStat};
use chrono::{Utc, Datelike};

#[tauri::command]
pub async fn get_dashboard_stats(
    pool: tauri::State<'_, DbPool>,
    mois: Option<i32>,
    annee: Option<i32>,
) -> Result<DashboardStats, String> {
    let now = Utc::now();
    let year  = annee.unwrap_or_else(|| now.year());
    let month = mois.unwrap_or_else(|| now.month() as i32);

    let debut = format!("{}-{:02}-01", year, month);
    let fin   = format!("{}-{:02}-31", year, month);

    let employes = sqlx::query_as::<_, Employe>(
        "SELECT * FROM Employe WHERE actif = 1"
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("DB error employes: {}", e))?;

    let employes_count = employes.len() as i64;
    let mut net_total   = 0.0f64;
    let mut dette_total = 0.0f64;
    let mut brut_total  = 0.0f64;
    let mut employe_stats: Vec<EmployeStat> = Vec::new();

    for emp in &employes {
        // ── Mode Simplifié — identique à payrollCalculator.js ────────────────
        let taux_j = emp.salaire_base / 26.0;   // TJ
        let taux_h = taux_j / 8.0;              // TH = TJ/8 (HS 100%)

        let pointages = sqlx::query(
            "SELECT statut, heures_supp, jours_travailles, avance, is_ferie \
             FROM Pointage WHERE employe_id = ? AND date >= ? AND date <= ?"
        )
        .bind(&emp.id)
        .bind(&debut)
        .bind(&fin)
        .fetch_all(pool.inner())
        .await
        .map_err(|e| format!("DB error pointages: {}", e))?;

        let mut nb_presence  = 0.0f64;
        let mut nb_hs        = 0.0f64;
        let mut nb_feries    = 0.0f64;
        let mut nb_absences  = 0.0f64;
        let mut nb_maladie   = 0.0f64;
        let mut avances_jour = 0.0f64;

        for p in &pointages {
            use sqlx::Row;
            let statut:   String = p.get("statut");
            let hs:       f64    = p.get("heures_supp");
            let jours:    f64    = p.get("jours_travailles");
            let avance:   f64    = p.get("avance");
            let is_ferie: bool   = p.get::<bool, _>("is_ferie");

            match statut.as_str() {
                "PRESENT" => {
                    nb_presence += jours;
                    nb_hs       += hs;
                    if is_ferie { nb_feries += 1.0; }
                }
                "FERIE"   => nb_feries   += 1.0,
                "ABSENT"  => nb_absences += 1.0,
                "MALADIE" => nb_maladie  += 1.0,
                _ => {}
            }
            avances_jour += avance;
        }

        // Avances APPROVED ce mois
        let (avances_approved,): (f64,) = sqlx::query_as::<sqlx::Sqlite, (f64,)>(
            "SELECT COALESCE(SUM(montant), 0.0) FROM Avance \
             WHERE employe_id = ? AND statut = 'APPROVED' AND date >= ? AND date <= ?"
        )
        .bind(&emp.id)
        .bind(&debut)
        .bind(&fin)
        .fetch_one(pool.inner())
        .await
        .map_err(|e| format!("DB error avances approved: {}", e))?;

        let total_avances = avances_approved + avances_jour;

        // ── Prêt actif ────────────────────────────────────────────────────────
        let pret_row = sqlx::query(
            "SELECT mensualite, solde_restant FROM Pret \
             WHERE employe_id = ? AND statut = 'ACTIF' \
             ORDER BY created_at DESC LIMIT 1"
        )
        .bind(&emp.id)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| format!("DB error pret: {}", e))?;

        let mensualite_pret = if let Some(row) = pret_row {
            use sqlx::Row;
            let mens:  f64 = row.get("mensualite");
            let solde: f64 = row.get("solde_restant");
            if solde > 0.001 { mens.min(solde) } else { 0.0 }
        } else { 0.0 };

        // ── Formule stricte (= PDF) ───────────────────────────────────────────
        // GAINS  : Présence×TJ + HS×TH + Fériés×TJ
        // DÉDUCT : Absences×TJ + Maladie×TJ + Avances + Prêt (plafonné au salaire dispo)
        // Pas de CNSS / CSS / IRPP / primes (mode simplifié)
        let gain_base    = nb_presence * taux_j;
        let gain_hs      = nb_hs       * taux_h;
        let gain_feries  = nb_feries   * taux_j;
        let brut_current = gain_base + gain_hs + gain_feries;

        let deduct_abs = nb_absences * taux_j;
        let deduct_mal = nb_maladie  * taux_j;
        // Plafond : on ne prélève jamais plus que le salaire disponible après
        // autres déductions (évite un net négatif causé par le prêt seul)
        let salary_before_pret = brut_current - deduct_abs - deduct_mal - total_avances;
        let mensualite_pret = mensualite_pret.min(salary_before_pret.max(0.0));
        let net_raw    = salary_before_pret - mensualite_pret;

        brut_total += brut_current;
        if net_raw < 0.0 {
            dette_total += net_raw.abs();
        } else {
            net_total += net_raw;
        }

        employe_stats.push(EmployeStat {
            nom:    emp.nom.clone(),
            prenom: emp.prenom.clone(),
            poste:  emp.poste.clone(),
            jours:  nb_presence,
            hs:     nb_hs,
            brut:   brut_current,
            cnss:   0.0,
            css:    0.0,
            irpp:   0.0,
            avances: total_avances,
            net:   if net_raw > 0.0 { net_raw } else { 0.0 },
            dette: if net_raw < 0.0 { net_raw.abs() } else { 0.0 },
        });
    }

    // Tri par net décroissant
    employe_stats.sort_by(|a, b| b.net.partial_cmp(&a.net).unwrap_or(std::cmp::Ordering::Equal));

    // Avances PENDING (toutes dates)
    let (avances_pending,): (f64,) = sqlx::query_as::<sqlx::Sqlite, (f64,)>(
        "SELECT COALESCE(SUM(montant), 0.0) FROM Avance WHERE statut = 'PENDING'"
    )
    .fetch_one(pool.inner())
    .await
    .map_err(|e| format!("DB error avances pending: {}", e))?;

    // Pointages du jour (toujours aujourd'hui)
    let today = now.format("%Y-%m-%d").to_string();
    let (pointages_today,): (i64,) = sqlx::query_as::<sqlx::Sqlite, (i64,)>(
        "SELECT COUNT(*) FROM Pointage WHERE date LIKE ?"
    )
    .bind(format!("{}%", today))
    .fetch_one(pool.inner())
    .await
    .map_err(|e| format!("DB error pointages today: {}", e))?;

    // Distribution des statuts : compte d'employés DISTINCTS pour aujourd'hui
    // (évite de compter 6 lignes pour 3 employés sur 2 jours différents)
    let dist_rows = sqlx::query_as::<sqlx::Sqlite, (String, i64)>(
        "SELECT statut, COUNT(DISTINCT employe_id) as cnt FROM Pointage \
         WHERE date LIKE ? GROUP BY statut ORDER BY cnt DESC"
    )
    .bind(format!("{}%", today))
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("DB error distribution: {}", e))?;

    let distribution: Vec<StatusCount> = dist_rows.into_iter()
        .map(|(statut, count)| StatusCount { statut, count })
        .collect();

    // Flux financier : avances par semaine du mois
    let flux_rows = sqlx::query_as::<sqlx::Sqlite, (String, f64)>(
        r#"SELECT 'S' || CAST(((CAST(strftime('%d', date) AS INTEGER) - 1) / 7) + 1 AS TEXT) AS semaine,
                  COALESCE(SUM(montant), 0.0) AS montant
           FROM Avance
           WHERE date >= ? AND date <= ?
           GROUP BY semaine ORDER BY semaine"#
    )
    .bind(&debut)
    .bind(&fin)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("DB error flux: {}", e))?;

    let flux_semaines: Vec<FluxSemaine> = flux_rows.into_iter()
        .map(|(semaine, montant)| FluxSemaine { semaine, montant })
        .collect();

    // Heures supplémentaires par employé
    let hs_rows = sqlx::query_as::<sqlx::Sqlite, (String, String, f64)>(
        r#"SELECT e.prenom, e.nom, COALESCE(SUM(p.heures_supp), 0.0) AS total_hs
           FROM Pointage p
           JOIN Employe e ON e.id = p.employe_id
           WHERE p.date >= ? AND p.date <= ?
           GROUP BY p.employe_id
           ORDER BY total_hs DESC"#
    )
    .bind(&debut)
    .bind(&fin)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("DB error hs: {}", e))?;

    let hs_par_employe: Vec<HsEmploye> = hs_rows.into_iter()
        .map(|(prenom, nom, hs)| {
            let initial = prenom.chars().next().map(|c| c.to_string()).unwrap_or_default();
            let display = if initial.is_empty() { nom } else { format!("{}. {}", initial, nom) };
            HsEmploye { nom: display, hs }
        })
        .collect();

    Ok(DashboardStats {
        net_total,
        dette_total,
        avances_pending,
        brut_total,
        employes_count,
        pointages_today,
        distribution,
        flux_semaines,
        hs_par_employe,
        employe_stats,
    })
}
