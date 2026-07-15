from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    tour_api_key: str
    database_url: str
    kakao_rest_key: str
    kakao_client_secret: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 14 # 14일 토큰 유효기간

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()