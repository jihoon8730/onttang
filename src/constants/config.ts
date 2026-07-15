import { Platform } from "react-native";

const HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";
export const API_URL = `http://${HOST}:8000`;
// export const API_URL = "http://192.168.45.234:8000";
