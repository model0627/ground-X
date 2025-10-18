use crate::config::db_config::DbConfig;
use aws_config::{BehaviorVersion, Region};
use aws_sdk_s3::error::SdkError;
use aws_sdk_s3::{Client, Error as S3Error};
use std::sync::Arc;
use tracing::info;

// R2 클라이언트 래퍼
#[derive(Clone)]
pub struct R2Client {
    client: Arc<Client>,
    bucket: String,
    public_domain: String,
}

impl R2Client {
    pub fn new(client: Client, bucket: String, public_domain: String) -> Self {
        Self {
            client: Arc::new(client),
            bucket,
            public_domain,
        }
    }

    pub async fn upload(&self, key: &str, body: Vec<u8>) -> Result<(), S3Error> {
        self.client
            .put_object()
            .bucket(&self.bucket)
            .key(key)
            .body(body.into())
            .send()
            .await?;
        Ok(())
    }

    pub async fn upload_with_content_type(
        &self,
        key: &str,
        body: Vec<u8>,
        content_type: &str,
    ) -> Result<(), aws_sdk_s3::Error> {
        self.client
            .put_object()
            .bucket(&self.bucket)
            .key(key)
            .body(body.into())
            .content_type(content_type)
            .send()
            .await?;
        Ok(())
    }

    pub async fn download(&self, key: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let resp = self
            .client
            .get_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await?;

        let data = resp.body.collect().await?;
        Ok(data.into_bytes().to_vec())
    }

    pub async fn delete(&self, key: &str) -> Result<(), S3Error> {
        self.client
            .delete_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await?;
        Ok(())
    }

    pub async fn exists(&self, key: &str) -> Result<bool, Box<dyn std::error::Error>> {
        match self
            .client
            .head_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await
        {
            Ok(_) => Ok(true),
            Err(err) => {
                // SdkError를 사용하여 더 정확한 에러 처리
                match &err {
                    SdkError::ServiceError(service_err) => {
                        // 404 Not Found 에러인지 확인
                        if service_err.err().is_not_found() {
                            Ok(false)
                        } else {
                            Err(Box::new(err))
                        }
                    }
                    _ => Err(Box::new(err)),
                }
            }
        }
    }

    // 추가: 스트림으로 업로드 (큰 파일용)
    pub async fn upload_file(
        &self,
        key: &str,
        file_path: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let file_content = tokio::fs::read(file_path).await?;
        self.upload(key, file_content).await?;
        Ok(())
    }

    pub fn get_r2_public_url(&self, key: &str) -> String {
        format!("{}/{}", self.public_domain, key)
    }
}

pub async fn establish_r2_connection() -> Result<R2Client, Box<dyn std::error::Error>> {
    let config = DbConfig::get();

    let r2_endpoint = format!("https://{}.r2.cloudflarestorage.com", config.r2_account_id);

    info!("Connecting to R2 at: {}", r2_endpoint);

    let aws_config = aws_config::defaults(BehaviorVersion::latest())
        .region(Region::new("auto"))
        .endpoint_url(&r2_endpoint)
        .credentials_provider(aws_sdk_s3::config::Credentials::new(
            &config.r2_access_key_id,
            &config.r2_secret_access_key,
            None,
            None,
            "r2-credentials",
        ))
        .load()
        .await;

    let client = Client::new(&aws_config);
    let r2_client = R2Client::new(
        client,
        config.r2_bucket_name.clone(),
        config.r2_public_domain.clone(),
    );

    info!("Successfully connected to R2");
    Ok(r2_client)
}
