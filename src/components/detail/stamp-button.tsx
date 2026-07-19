import { API_URL } from "@/constants/config";
import { colors, spacing } from "@/constants/theme";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
  contentId: string;
};

// "여기 찍기" — 현재 위치를 담아 스탬프 요청 (로그인 필요 · 서버가 반경 검증)
export default function StampButton({ contentId }: Props) {
  const stampHere = async () => {
    const token = await SecureStore.getItemAsync("token");
    if (!token) {
      console.log("로그인이 필요해요");
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("위치 권한이 필요해요");
      return;
    }

    const loc = await Location.getCurrentPositionAsync();

    const res = await fetch(`${API_URL}/stamps`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        content_id: contentId,
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      }),
    });
    console.log("스탬프 status:", res.status);
    const data = await res.json();
    console.log("스탬프 결과", data);
  };

  return (
    <Pressable onPress={stampHere} style={styles.button}>
      <Text style={styles.text}>여기 찍기</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  text: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
});
