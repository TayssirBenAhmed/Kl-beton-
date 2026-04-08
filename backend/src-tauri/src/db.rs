use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use std::fs;
use std::path::Path;

pub type DbPool = SqlitePool;

pub async fn init_pool(database_url: &str) -> Result<DbPool, sqlx::Error> {
    // Strip the "sqlite:" prefix to get the file path
    let db_path = if database_url.starts_with("sqlite:") {
        database_url
            .trim_start_matches("sqlite:")
            .split('?')
            .next()
            .unwrap_or("klbeton.db")
    } else {
        database_url.split('?').next().unwrap_or(database_url)
    };

    // Ensure the parent directory exists (handles data/ subdirectory)
    if let Some(parent) = Path::new(db_path).parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent).map_err(|e| {
                sqlx::Error::Io(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    format!("Cannot create database directory '{}': {}", parent.display(), e),
                ))
            })?;
        }
    }

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(database_url)
        .await?;

    // Run all pending migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .map_err(|e| {
            sqlx::Error::Io(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("Migration failed: {}", e),
            ))
        })?;

    Ok(pool)
}
