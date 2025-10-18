use crate::config::db_config::DbConfig;
use axum::Json;
use axum::http::HeaderValue;
use axum::http::header::SET_COOKIE;
use axum::response::{IntoResponse, Response};
use cookie::time::Duration;
use cookie::{Cookie, SameSite};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
pub struct AuthJWTResponse {
    pub access_token: String,
    #[serde(skip_serializing)]
    pub cookie_refresh_token: String,
}

impl IntoResponse for AuthJWTResponse {
    fn into_response(self) -> Response {
        let refresh_token_lifetime = DbConfig::get().auth_refresh_token_expire_time;
        let is_dev = DbConfig::get().is_dev;

        let mut response = Json(AuthJWTResponse {
            access_token: self.access_token.clone(),
            cookie_refresh_token: String::new(),
        })
        .into_response();

        let same_site_attribute = if is_dev {
            SameSite::None
        } else {
            SameSite::Lax
        };

        let cookie = Cookie::build(("refresh_token", self.cookie_refresh_token))
            .http_only(true)
            .secure(true)
            .same_site(same_site_attribute)
            .path("/")
            .max_age(Duration::days(refresh_token_lifetime))
            .build();

        response.headers_mut().insert(
            SET_COOKIE,
            HeaderValue::from_str(&cookie.to_string()).unwrap(),
        );

        response
    }
}
