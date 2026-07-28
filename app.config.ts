import "dotenv/config";
import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "온땅",
  slug: "onttang",
  version: "1.1.0",
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    url: "https://u.expo.dev/8b09d028-9e71-4bbf-8e55-aa5e07ff7855",
  },
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "onttang",
  userInterfaceStyle: "automatic",
  ios: {
    bundleIdentifier: "com.jihoon8730.onttang",
    // expo-secure-store(키체인) 접근 권한 — prebuild가 이 값을 entitlements 파일에 반영.
    // 표준형($(AppIdentifierPrefix) 접두사)이라 실기기에서 유효.
    entitlements: {
      "keychain-access-groups": [
        "$(AppIdentifierPrefix)com.jihoon8730.onttang",
      ],
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      // 앱 개발 기준 로케일을 한국어로 선언 — 시스템 UI(애플 로그인 버튼 등)가
      // 기기 언어와 무관하게 한국어로 안정적으로 표시되도록.
      CFBundleDevelopmentRegion: "ko",
      CFBundleLocalizations: ["ko", "en"],
    },
  },
  android: {
    package: "com.jihoon8730.onttang",
    adaptiveIcon: {
      backgroundColor: "#ffffff",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },

    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-apple-authentication",
    "expo-notifications",
    [
      "expo-location",
      {
        locationWhenInUsePermission: "현재 위치를 지도에 표시하는 데 사용해요",
        locationAlwaysAndWhenInUsePermission:
          "관광지 근처에 도착하면 앱을 열지 않아도 자동으로 스탬프를 찍어드려요",
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#ffffff",
        image: "./assets/images/splash-icon.png",
        imageWidth: 120,
      },
    ],
    [
      "@mj-studio/react-native-naver-map",
      {
        client_id: process.env.NAVER_MAP_CLIENT_ID,
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          extraMavenRepos: ["https://repository.map.naver.com/archive/maven"],
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "8b09d028-9e71-4bbf-8e55-aa5e07ff7855",
    },
  },
};

export default config;
