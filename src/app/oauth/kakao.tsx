import { useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

// 카카오 로그인 콜백 화면: 앱 링크로 https://.../oauth/kakao?code=... 가 들어오면 여기로 옴
export default function KakaoCallback() {
  const { code } = useLocalSearchParams<{ code?: string }>();

  useEffect(() => {
    WebBrowser.dismissBrowser(); // 카카오 로그인 브라우저 닫기
    console.log("카카오 code:", code);
    // TODO(③): 이 code를 백엔드로 → JWT 발급 → 저장 → 메인으로 이동
    // router.replace("/(tabs)/territory");
  }, [code]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
