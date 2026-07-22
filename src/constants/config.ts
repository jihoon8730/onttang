import Constants from "expo-constants";

// 앱이 Metro 개발서버에 붙을 때 쓴 호스트 = 맥의 현재 LAN IP.
// DHCP로 IP가 바뀌거나 네트워크가 달라져도 자동 추종 (예: "192.168.45.234:8081" → "192.168.45.234").
// 에뮬레이터는 hostUri가 알아서 10.0.2.2로 잡히므로 실기기·에뮬레이터·iOS·Android 모두 커버.
export const DEV_HOST =
  Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost";

// 프로덕션(빌드된 앱)이 바라볼 Railway 서버 (반드시 https)
export const PROD_API_URL = "https://onttang-production.up.railway.app";

// 개발(Metro, __DEV__=true) = 로컬 서버 / 배포된 앱(__DEV__=false) = Railway
export const API_URL = __DEV__ ? `http://${DEV_HOST}:8000` : PROD_API_URL;

// 카카오 로그인 브리지 — 카카오 콘솔에 등록하는 공개 https URL.
// dev/prod 공용(항상 Railway). 카카오는 redirect_uri로 http(s)만 허용하므로 필요.
export const KAKAO_BRIDGE_URL = `${PROD_API_URL}/kakao-bridge.html`;
