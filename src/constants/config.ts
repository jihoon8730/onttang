import Constants from "expo-constants";

// 앱이 Metro 개발서버에 붙을 때 쓴 호스트 = 맥의 현재 LAN IP.
// DHCP로 IP가 바뀌거나 네트워크가 달라져도 자동 추종 (예: "192.168.45.234:8081" → "192.168.45.234").
// 에뮬레이터는 hostUri가 알아서 10.0.2.2로 잡히므로 실기기·에뮬레이터·iOS·Android 모두 커버.
export const DEV_HOST =
  Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost";

export const API_URL = `http://${DEV_HOST}:8000`;
