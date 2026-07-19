import { Platform } from "react-native";

// 개발용 맥 LAN 호스트 (EXPO_PUBLIC_DEV_HOST env로 관리 — 커밋 X). 미설정 시 localhost.
export const DEV_HOST = process.env.EXPO_PUBLIC_DEV_HOST ?? "localhost";

const HOST = Platform.OS === "android" ? "10.0.2.2" : DEV_HOST;
export const API_URL = `http://${HOST}:8000`;
