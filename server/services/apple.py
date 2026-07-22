import jwt
from jwt import PyJWKClient
from config import settings

# 애플이 identityToken(JWT)을 서명한 공개키 모음(JWKS)과 발급자
APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"
APPLE_ISSUER = "https://appleid.apple.com"

# 공개키를 받아와 캐싱해주는 클라이언트 (매 요청마다 다시 안 받음)
_jwk_client = PyJWKClient(APPLE_JWKS_URL)


def verify_apple_identity_token(identity_token: str) -> dict:
    """애플 identityToken 검증 → 페이로드(sub, email 등) 반환.

    - 토큰 헤더의 kid에 맞는 애플 공개키를 골라 서명 검증(RS256)
    - audience(우리 앱 번들ID) / issuer(애플)까지 맞아야 통과
    - 위조/만료/대상 불일치면 예외 발생 → 라우터가 401로 번역
    """
    signing_key = _jwk_client.get_signing_key_from_jwt(identity_token)
    payload = jwt.decode(
        identity_token,
        signing_key.key,
        algorithms=["RS256"],
        audience=settings.apple_bundle_id,
        issuer=APPLE_ISSUER,
    )
    return payload
