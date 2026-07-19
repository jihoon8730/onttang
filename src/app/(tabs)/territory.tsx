import { API_URL, DEV_HOST } from "@/constants/config";
import { AuthRequest, makeRedirectUri } from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

//카카오 인증서버 주소록
const discovery = {
  authorizationEndpoint: "https://kauth.kakao.com/oauth/authorize",
  tokenEndpoint: "https://kauth.kakao.com/oauth/token",
};

const KAKAO_REST_KEY = "f7e7cb7e5451452f6be83f1d5e2066b9";
const KAKAO_REDIRECT_URI = `http://${DEV_HOST}:8081/kakao-bridge.html`;

export default function Territory() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync("token").then(setToken);
  }, []);

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
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    await SecureStore.setItemAsync("token", data.token);
    setToken(data.token);
  }

  async function logout() {
    await SecureStore.deleteItemAsync("token");
    setToken(null);
  }

  async function fetchMe() {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }, // ← 팔찌를 헤더에 붙임
    });
    console.log("내 정보 status:", res.status);
    const data = await res.json();
    console.log("내 정보:", data);
  }

  return (
    <View style={styles.container}>
      {token ? (
        <>
          <Text style={styles.text}>로그인됨 🎉</Text>
          <Pressable onPress={logout} style={styles.button}>
            <Text style={styles.buttonText}>로그아웃</Text>
          </Pressable>
          <Pressable onPress={fetchMe} style={styles.button}>
            <Text style={styles.buttonText}>내 정보 확인</Text>
          </Pressable>
        </>
      ) : (
        <Pressable onPress={startLogin} style={styles.button}>
          <Text style={styles.buttonText}>카카오 로그인</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 16 },
  button: {
    borderWidth: 1,
    padding: 12,
  },
  buttonText: {
    fontSize: 12,
  },
});
