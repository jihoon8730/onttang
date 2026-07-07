import * as WebBrowser from "expo-web-browser";
import { Pressable, StyleSheet, Text, View } from "react-native";

// 카카오 REST API 키 (client_id)
const REST_KEY = "f7e7cb7e5451452f6be83f1d5e2066b9";
// 카카오 콘솔에 등록한 https Redirect URI (= 우리 앱 링크)
const REDIRECT_URI = "https://onttang8730.ngrok.io/oauth/kakao";

export default function Territory() {
  async function loginWithKakao() {
    const authUrl =
      "https://kauth.kakao.com/oauth/authorize" +
      `?client_id=${REST_KEY}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      "&response_type=code";

    console.log("authUrl:", authUrl);

    // 카카오 로그인 열기.
    // 콜백(?code=...)은 앱 링크로 /oauth/kakao 라우트가 받아서 처리함.
    await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);
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
