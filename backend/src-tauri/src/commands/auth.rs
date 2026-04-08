use crate::db::DbPool;
use crate::models::{LoginRequest, LoginResponse, UserPublic, User};
use bcrypt::verify;
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use serde::{Deserialize, Serialize};
use chrono::{Utc, Duration};

const SECRET: &str = "klbeton_secret_key_2025_industrial";

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    email: String,
    role: String,
    exp: usize,
}

#[tauri::command]
pub async fn login(
    pool: tauri::State<'_, DbPool>,
    request: LoginRequest,
) -> Result<LoginResponse, String> {
    let user = sqlx::query_as::<sqlx::Sqlite, User>(
        "SELECT id, email, password, role, created_at FROM User WHERE email = ?"
    )
    .bind(&request.email)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))?
    .ok_or("Email ou mot de passe incorrect")?;

    let valid = verify(&request.password, &user.password)
        .map_err(|e| format!("Bcrypt error: {}", e))?;

    if !valid {
        return Err("Email ou mot de passe incorrect".to_string());
    }

    let expiration = Utc::now()
        .checked_add_signed(Duration::hours(24))
        .ok_or("Failed to compute token expiration")?
        .timestamp() as usize;

    let claims = Claims {
        sub: user.id.clone(),
        email: user.email.clone(),
        role: user.role.clone(),
        exp: expiration,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(SECRET.as_ref()),
    )
    .map_err(|e| format!("JWT error: {}", e))?;

    Ok(LoginResponse {
        user: UserPublic {
            id: user.id,
            email: user.email,
            role: user.role,
        },
        token,
    })
}

#[tauri::command]
pub async fn get_current_user(token: String) -> Result<UserPublic, String> {
    let token_data = decode::<Claims>(
        &token,
        &DecodingKey::from_secret(SECRET.as_ref()),
        &Validation::default(),
    )
    .map_err(|e| format!("Invalid token: {}", e))?;

    Ok(UserPublic {
        id: token_data.claims.sub,
        email: token_data.claims.email,
        role: token_data.claims.role,
    })
}

#[tauri::command]
pub async fn logout() -> Result<(), String> {
    Ok(())
}

#[derive(Debug, Serialize)]
pub struct UserPublicWithRole {
    pub id: String,
    pub email: String,
    pub role: String,
}

#[tauri::command]
pub async fn get_users_by_role(
    pool: tauri::State<'_, DbPool>,
    role: String,
) -> Result<Vec<UserPublicWithRole>, String> {
    let users = sqlx::query_as::<sqlx::Sqlite, (String, String, String)>(
        "SELECT id, email, role FROM User WHERE role = ?"
    )
    .bind(&role)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("DB error: {}", e))?;

    Ok(users.into_iter().map(|(id, email, role)| UserPublicWithRole { id, email, role }).collect())
}
