import { API_URL, DEV_HOST } from "@/constants/config";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { fetchMyStamps, fetchMyStats } from "@/lib/api";
import { useAuthStore } from "@/stores/use-auth-store";
import { useQuery } from "@tanstack/react-query";
import { AuthRequest, makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Pressable, StyleSheet, Text, View } from "react-native";

//카카오 인증서버 주소록
const discovery = {
  authorizationEndpoint: "https://kauth.kakao.com/oauth/authorize",
  tokenEndpoint: "https://kauth.kakao.com/oauth/token",
};

const KAKAO_REST_KEY = "f7e7cb7e5451452f6be83f1d5e2066b9";
const KAKAO_REDIRECT_URI = `http://${DEV_HOST}:8081/kakao-bridge.html`;

export default function Territory() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  const { data: stats } = useQuery({
    queryKey: ["my-stats"],
    queryFn: () => fetchMyStats(token!),
    enabled: !!token,
  });

  const { data: stamps } = useQuery({
    queryKey: ["my-stamps"],
    queryFn: () => fetchMyStamps(token!),
    enabled: !!token,
  });

  console.log("정복률:", stats, "스탬프:", stamps);

  const redirectUri = makeRedirectUri({
    scheme: "onttang", // 앱 스키마
    path: "oauth/kakao", // 리다이렉트 경로
  });

  async function startLogin() {
    const request = new AuthRequest({
      clientId: KAKAO_REST_KEY,
      redirectUri: KAKAO_REDIRECT_URI, // 카카오엔 브리지 주소를 줌
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code, redirect_uri: KAKAO_REDIRECT_URI }),
    });
    const data = await res.json();
    await login(data.token, data.user);
  }

  async function fetchMe() {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }, // ← 팔찌를 헤더에 붙임
    });
    console.log("내 정보 status:", res.status);
    const data = await res.json();
    console.log("내 정보:", data);
  }

  if (!token) {
    return (
      <View style={styles.container}>
        <Text style={styles.gateTitle}>내 영토</Text>
        <Text style={styles.gateHint}>
          로그인하고 전국에 내 스탬프를 남겨보세요
        </Text>
        <Pressable onPress={startLogin} style={styles.loginButton}>
          <Text style={styles.loginText}>카카오 로그인</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={logout}>
        <Text>로그아웃</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  gateTitle: { ...typography.header, fontSize: 24 },
  gateHint: { ...typography.body, color: colors.muted, textAlign: "center" },
  loginButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.button,
    marginTop: spacing.md,
  },
  loginText: { color: colors.white, fontWeight: "700", fontSize: 15 },
});
