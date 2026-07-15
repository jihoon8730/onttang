import { useEffect } from "react";
import { Text, View } from "react-native";

// 웹 브리지(iOS/Android 공통 해결책의 핵심):
// 카카오는 https redirect_uri만 허용하므로 콜백이 이 https 페이지로 들어온다.
// 여기서 즉시 커스텀 스킴 onttang://oauth/kakao?code=... 로 다시 넘기면,
// openAuthSessionAsync(ASWebAuthenticationSession)이 그 스킴을 잡아 code를 앱에 반환한다.
// → 유니버설 링크/AASA/associated domains 전부 불필요.
export default function KakaoWebBridge() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.replace("onttang://oauth/kakao" + window.location.search);
    }
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>로그인 처리 중…</Text>
    </View>
  );
}
