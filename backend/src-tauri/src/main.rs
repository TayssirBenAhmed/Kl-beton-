#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod db;
mod models;
mod commands;

use bcrypt;
use cuid2;

use commands::auth::{login, get_current_user, logout, get_users_by_role};
use commands::employes::{get_all_employees, get_employe_by_id, create_employe, update_employe, delete_employe};
use commands::pointages::{get_pointages, save_pointages, get_pointages_mois};
use commands::avances::{get_all_advances, create_advance, approve_advance, reject_advance};
use commands::prets::{get_all_prets, get_prets_employe, create_pret, rembourser_mensualite};
use commands::merit::{get_merit_mois, save_merit_status, get_all_merit_mois};
use commands::messages::{get_messages, send_message, mark_messages_read, get_unread_count};
use commands::stats::get_dashboard_stats;
use commands::rapports::{generate_payslip_pdf, generate_recap_pdf};

/// Seeds default users on first launch and ensures passwords are always correct.
async fn seed_users(pool: &db::DbPool) {
    let admin_hash = bcrypt::hash("admin123", bcrypt::DEFAULT_COST)
        .expect("bcrypt hash failed");
    let chef_hash = bcrypt::hash("chef123", bcrypt::DEFAULT_COST)
        .expect("bcrypt hash failed");

    // Upsert admin
    let admin_exists: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM \"User\" WHERE email = 'admin@klbeton.tn'"
    )
    .fetch_one(pool).await.unwrap_or(0);

    if admin_exists == 0 {
        let id = cuid2::create_id();
        sqlx::query(
            "INSERT INTO \"User\" (id, email, password, role) VALUES (?, 'admin@klbeton.tn', ?, 'ADMIN')"
        )
        .bind(&id).bind(&admin_hash)
        .execute(pool).await.ok();
        println!("[SEED] Admin créé : admin@klbeton.tn / admin123");
    } else {
        // Always reset to known password to avoid hash mismatch issues
        sqlx::query("UPDATE \"User\" SET password = ? WHERE email = 'admin@klbeton.tn'")
            .bind(&admin_hash).execute(pool).await.ok();
    }

    // Upsert chef
    let chef_exists: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM \"User\" WHERE email = 'chef@klbeton.tn'"
    )
    .fetch_one(pool).await.unwrap_or(0);

    if chef_exists == 0 {
        let id = cuid2::create_id();
        sqlx::query(
            "INSERT INTO \"User\" (id, email, password, role) VALUES (?, 'chef@klbeton.tn', ?, 'CHEF')"
        )
        .bind(&id).bind(&chef_hash)
        .execute(pool).await.ok();
        println!("[SEED] Chef créé : chef@klbeton.tn / chef123");
    } else {
        sqlx::query("UPDATE \"User\" SET password = ? WHERE email = 'chef@klbeton.tn'")
            .bind(&chef_hash).execute(pool).await.ok();
    }
}

#[tokio::main]
async fn main() {
    dotenv::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite:dev.db?mode=rwc".to_string());

    let db_url = if database_url.starts_with("file:") {
        database_url.replace("file:", "sqlite:")
    } else {
        database_url
    };

    let pool = db::init_pool(&db_url)
        .await
        .expect("Failed to initialize database");

    seed_users(&pool).await;

    tauri::Builder::default()
        .manage(pool)
        .invoke_handler(tauri::generate_handler![
            // Auth
            login,
            get_current_user,
            logout,
            get_users_by_role,
            // Employees
            get_all_employees,
            get_employe_by_id,
            create_employe,
            update_employe,
            delete_employe,
            // Pointages
            get_pointages,
            save_pointages,
            get_pointages_mois,
            // Avances
            get_all_advances,
            create_advance,
            approve_advance,
            reject_advance,
            // Prets
            get_all_prets,
            get_prets_employe,
            create_pret,
            rembourser_mensualite,
            // Merit Bonus
            get_merit_mois,
            save_merit_status,
            get_all_merit_mois,
            // Messages
            get_messages,
            send_message,
            mark_messages_read,
            get_unread_count,
            // Stats
            get_dashboard_stats,
            generate_payslip_pdf,
            generate_recap_pdf,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
