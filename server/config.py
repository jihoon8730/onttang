from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    tour_api_key: str
    database_url: str
    kakao_rest_key: str
    kakao_client_secret: str
    kakao_redirect_uri: str
    jwt_secret: str
    # 애플 로그인 토큰(identityToken)의 audience = 앱 번들ID
    apple_bundle_id: str = "com.jihoon8730.onttang"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Railway 등은 postgresql:// (또는 postgres://) 를 줌
    # → SQLAlchemy가 쓰는 psycopg3 드라이버용 스킴으로 자동 변환
    @field_validator("database_url")
    @classmethod
    def use_psycopg_driver(cls, v: str) -> str:
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+psycopg://", 1)
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+psycopg://", 1)
        return v

settings = Settings()