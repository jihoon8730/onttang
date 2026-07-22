import { API_URL } from "@/constants/config";
import { useAuthStore } from "@/stores/use-auth-store";
import * as AppleAuthentication from "expo-apple-authentication";

// 애플 로그인: 네이티브 시트로 identityToken 발급 → 백엔드 /auth/apple 검증 → 자체 JWT
export function useAppleLogin() {
  const login = useAuthStore((s) => s.login);

  const startLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const identityToken = credential.identityToken;
      if (!identityToken) return;

      // 애플은 이름을 '첫 로그인 때만' 준다 → 성+이름을 합쳐 백엔드로 (없으면 undefined)
      const fullName = credential.fullName
        ? [credential.fullName.familyName, credential.fullName.givenName]
            .filter(Boolean)
            .join("")
        : "";

      const res = await fetch(`${API_URL}/auth/apple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identity_token: identityToken,
          full_name: fullName || undefined,
        }),
      });
      const data = await res.json();
      await login(data.token, data.user);
    } catch (e: any) {
      // 사용자가 시트를 닫으면 ERR_REQUEST_CANCELED — 에러 아님, 조용히 무시
      if (e?.code === "ERR_REQUEST_CANCELED") return;
      console.warn("애플 로그인 실패", e);
    }
  };

  return { startLogin };
}
