use crate::db::DbPool;
use chrono::Utc;
use serde::Serialize;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct MessageResponse {
    pub id: String,
    pub content: String,
    pub is_read: bool,
    pub created_at: String,
    pub sender_id: String,
    pub receiver_id: String,
    pub sender_email: String,
    pub sender_role: String,
}

#[tauri::command]
pub async fn get_messages(
    pool: tauri::State<'_, DbPool>,
    user_id: String,
) -> Result<Vec<MessageResponse>, String> {
    let rows = sqlx::query_as::<_, MessageResponse>(
        r#"SELECT m.id, m.content, m.is_read, m.created_at, m.sender_id, m.receiver_id,
                  u.email as sender_email, u.role as sender_role
           FROM Message m
           JOIN User u ON u.id = m.sender_id
           WHERE m.sender_id = ? OR m.receiver_id = ?
           ORDER BY m.created_at ASC"#
    )
    .bind(&user_id)
    .bind(&user_id)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))?;

    Ok(rows)
}

#[tauri::command]
pub async fn send_message(
    pool: tauri::State<'_, DbPool>,
    sender_id: String,
    receiver_id: String,
    content: String,
) -> Result<MessageResponse, String> {
    let id = cuid2::create_id();
    let now = Utc::now().to_rfc3339();

    sqlx::query(
        "INSERT INTO Message (id, content, is_read, created_at, sender_id, receiver_id) VALUES (?, ?, 0, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&content)
    .bind(&now)
    .bind(&sender_id)
    .bind(&receiver_id)
    .execute(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))?;

    let r = sqlx::query_as::<_, MessageResponse>(
        r#"SELECT m.id, m.content, m.is_read, m.created_at, m.sender_id, m.receiver_id,
                  u.email as sender_email, u.role as sender_role
           FROM Message m
           JOIN User u ON u.id = m.sender_id
           WHERE m.id = ?"#
    )
    .bind(&id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))?;

    Ok(r)
}

#[tauri::command]
pub async fn mark_messages_read(
    pool: tauri::State<'_, DbPool>,
    receiver_id: String,
) -> Result<(), String> {
    sqlx::query(
        "UPDATE Message SET is_read = 1 WHERE receiver_id = ? AND is_read = 0"
    )
    .bind(&receiver_id)
    .execute(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn get_unread_count(
    pool: tauri::State<'_, DbPool>,
    user_id: String,
) -> Result<i64, String> {
    let row = sqlx::query_as::<sqlx::Sqlite, (i64,)>(
        "SELECT COUNT(*) as count FROM Message WHERE receiver_id = ? AND is_read = 0"
    )
    .bind(&user_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))?;
    Ok(row.0)
}
