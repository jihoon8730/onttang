from datetime import datetime, timedelta, timezone
import jwt
from config import settings

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 14

def create_access_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=JWT_ALGORITHM)