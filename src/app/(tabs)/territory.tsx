import { API_URL } from "@/constants/config";
import * as WebBrowser from "expo-web-browser";
import { Pressable, StyleSheet, Text, View } from "react-native";

// 카카오 REST API 키 (client_id)
const REST_KEY = "f7e7cb7e5451452f6be83f1d5e2066b9";
// 카카오 콘솔에 등록한 https Redirect URI (웹 브리지가 커스텀 스킴으로 넘겨줌)
const REDIRECT_URI = "https://onttang8730.ngrok.io/oauth/kakao";
// openAuthSessionAsync 이 감시할 앱 복귀 스킴 (브리지가 이 주소로 리다이렉트)
const RETURN_URL = "onttang://oauth/kakao";

export default function Territory() {
  async function loginWithKakao() {
    const authUrl =
      "https://kauth.kakao.com/oauth/authorize" +
      `?client_id=${REST_KEY}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      "&response_type=code";

    // 카카오 로그인 열기. 브리지가 onttang:// 로 넘겨주면 세션이 그 URL을 결과로 반환한다.
    const result = await WebBrowser.openAuthSessionAsync(authUrl, RETURN_URL);
    console.log("세션 결과:", result);
    if (result.type !== "success" || !result.url) return;

    // onttang://oauth/kakao?code=... 에서 code 추출 (RN에선 정규식이 URL 파서보다 안전)
    const code = result.url.match(/[?&]code=([^&]+)/)?.[1];
    console.log("카카오 code:", code);
    if (!code) return;

    try {
      const res = await fetch(`${API_URL}/auth/kakao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      console.log("응답 status:", res.status);
      const data = await res.json();
      console.log("백엔드 응답:", data);
    } catch (e) {
      console.log("로그인 요청 에러:", e);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={loginWithKakao}>
        <Text>카카오 로그인</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 16 },
});
