import { Text, View } from "react-native";

// 웹 전용 스텁: 네이버 지도(@mj-studio/react-native-naver-map)는 네이티브 전용이라
// 웹 번들에 들어오면 codegenNativeComponent 크래시가 난다.
// Metro는 웹에서 .web.tsx를 우선 로드하므로, 이 스텁이 지도 import 사슬을 끊는다.
// (네이티브 iOS/Android는 계속 index.tsx를 써서 앱 동작엔 영향 없음)
export default function ExploreWeb() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>온땅은 앱에서 이용해주세요</Text>
    </View>
  );
}
