import { API_URL } from "@/constants/config";
import { colors, spacing } from "@/constants/theme";
import { useAuthStore } from "@/stores/use-auth-store";
import { useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";

type Props = {
  contentId: string;
};

// "여기 찍기" — 현재 위치를 담아 스탬프 요청 (로그인 필요 · 서버가 반경 검증)
export default function StampButton({ contentId }: Props) {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const stampHere = async () => {
    if (!token) {
      Alert.alert("로그인이 필요해요", "스탬프를 찍으려면 먼저 로그인해주세요");
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "위치 권한이 필요해요",
        "현재 위치를 확인해야 스탬프를 찍을 수 있어요",
      );
      return;
    }

    setLoading(true);
    try {
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
      const data = await res.json();
      if (res.ok) {
        // 내 스탬프·통계 갱신 → 지도·검색·내 영토의 도장 배지·스탯 즉시 반영
        queryClient.invalidateQueries({ queryKey: ["my-stamps"] });
        queryClient.invalidateQueries({ queryKey: ["my-stats"] });
        if (data.visit_count === 1) {
          Alert.alert("스탬프 획득!", "이 땅이 내 영토가 되었어요");
        } else {
          Alert.alert(
            "다시 방문했어요",
            `벌써 ${data.visit_count}번째 방문이에요`,
          );
        }
      } else if (res.status === 400) {
        Alert.alert("아직 멀어요", data.detail ?? "관광지 근처에서 찍어주세요");
      } else if (res.status === 401) {
        Alert.alert(
          "로그인이 필요해요",
          "로그인이 만료됐어요 다시 로그인해주세요",
        );
      } else {
        Alert.alert("잠시 후 다시 시도해주세요", "스탬프를 찍지 못했어요");
      }
    } catch {
      Alert.alert("네트워크 오류", "연결을 확인하고 다시 시도해주세요");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={stampHere}
      disabled={loading}
      style={[styles.button, loading && styles.buttonDisabled]}
    >
      <Text style={styles.text}>{loading ? "찍는 중…" : "여기 찍기"}</Text>
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
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
});
