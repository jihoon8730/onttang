from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    tour_api_key: str
    database_url: str
    kakao_rest_key: str
    kakao_client_secret: str
    jwt_secret: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()