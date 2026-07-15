import { API_URL } from "@/constants/config";
import { useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

// 카카오 로그인 콜백 화면: 앱 링크로 https://.../oauth/kakao?code=... 가 들어오면 여기로 옴
export default function KakaoCallback() {
  const { code } = useLocalSearchParams<{ code?: string }>();

  useEffect(() => {
    if (!code) return; // code 없으면 아무것도 안 함

    async function sendCode() {
      try {
        WebBrowser.dismissBrowser(); // 카카오 로그인 브라우저 닫기
        console.log("카카오 code:", code);

        const res = await fetch(`${API_URL}/auth/kakao`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        console.log("2응답 status:", res.status);
        const data = await res.json();
        console.log("백엔드 응답:", data);

        // router.replace("/(tabs)/territory");
      } catch (e) {
        console.log("로그인 요청 에러:", e);
      }
    }

    sendCode();
  }, [code]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
