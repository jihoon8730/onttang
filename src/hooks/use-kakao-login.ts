import { API_URL, DEV_HOST } from "@/constants/config";
import { useAuthStore } from "@/stores/use-auth-store";
import { AuthRequest, makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

// 카카오 인증서버 주소록
const discovery = {
  authorizationEndpoint: "https://kauth.kakao.com/oauth/authorize",
  tokenEndpoint: "https://kauth.kakao.com/oauth/token",
};

const KAKAO_REST_KEY = "f7e7cb7e5451452f6be83f1d5e2066b9";
const KAKAO_REDIRECT_URI = `http://${DEV_HOST}:8081/kakao-bridge.html`;

export function useKakaoLogin() {
  const login = useAuthStore((s) => s.login);

  const redirectUri = makeRedirectUri({
    scheme: "onttang", // 앱 스키마
    path: "oauth/kakao", // 리다이렉트 경로
  });

  const startLogin = async () => {
    const request = new AuthRequest({
      clientId: KAKAO_REST_KEY,
      redirectUri: KAKAO_REDIRECT_URI,
      scopes: [],
      usePKCE: false,
    });

    const authUrl = await request.makeAuthUrlAsync(discovery);
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type !== "success" || !result.url) return;

    const code = result.url.match(/[?&]code=([^&]+)/)?.[1];
    if (!code) return;

    const res = await fetch(`${API_URL}/auth/kakao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirect_uri: KAKAO_REDIRECT_URI }),
    });
    const data = await res.json();
    await login(data.token, data.user);
  };

  return { startLogin };
}
