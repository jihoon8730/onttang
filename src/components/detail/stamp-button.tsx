import { API_URL } from "@/constants/config";
import { colors, spacing, typography } from "@/constants/theme";
import { getDistance } from "@/lib/utils";
import { useAuthStore } from "@/stores/use-auth-store";
import { useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  contentId: string;
  latitude: number;
  longitude: number;
};

// "여기 찍기" — 현재 위치를 담아 스탬프 요청 및 남은 거리 표시
export default function StampButton({ contentId, latitude, longitude }: Props) {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [modal, setModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "error";
  }>({ visible: false, title: "", message: "", type: "success" });

  const showModal = (
    title: string,
    message: string,
    type: "success" | "error" = "error",
  ) => {
    setModal({ visible: true, title, message, type });
  };

  useEffect(() => {
    let sub: Location.LocationSubscription;
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") return; // 권한 없으면 거리 안 보여줌 (클릭 시 요청)

      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 5 },
        (loc) => {
          const dist = getDistance(
            loc.coords.latitude,
            loc.coords.longitude,
            latitude,
            longitude,
          );
          setDistance(dist);
        },
      );
    })();
    return () => {
      if (sub) sub.remove();
    };
  }, [latitude, longitude]);

  const stampHere = async () => {
    if (!token) {
      showModal(
        "로그인이 필요해요",
        "탐험을 시작하려면 먼저 로그인해주세요",
        "error",
      );
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      showModal(
        "위치 권한이 필요해요",
        "현재 위치를 확인해야 탐험을 할 수 있어요",
        "error",
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
        queryClient.invalidateQueries({ queryKey: ["my-stamps"] });
        queryClient.invalidateQueries({ queryKey: ["my-stats"] });
        if (data.visit_count === 1) {
          showModal("탐험 성공!", "새로운 영토를 발견했습니다", "success");
        } else {
          showModal(
            "탐험 완료",
            `이곳에 벌써 ${data.visit_count}번째 방문하셨네요!`,
            "success",
          );
        }
      } else if (res.status === 400) {
        let distanceMsg = data.detail ?? "목적지 근처에서 탐험을 시도해주세요";
        if (distance !== null) {
          const distanceStr =
            distance < 1000
              ? `${Math.round(distance)}m`
              : `${(distance / 1000).toFixed(1)}km`;
          distanceMsg = `현재 위치에서 ${distanceStr} 떨어져 있습니다.\n\n${distanceMsg}`;
        }
        showModal("아직 도착하지 않았어요", distanceMsg, "error");
      } else if (res.status === 401) {
        showModal(
          "로그인이 필요해요",
          "로그인이 만료됐어요. 다시 로그인해주세요",
          "error",
        );
      } else {
        showModal("오류 발생", "잠시 후 다시 시도해주세요", "error");
      }
    } catch {
      showModal(
        "네트워크 오류",
        "연결 상태를 확인하고 다시 시도해주세요",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.distanceRow}>
        <View style={styles.distanceLabelRow}>
          <SymbolView
            name={{ ios: "location.fill", android: "my_location" }}
            size={14}
            tintColor={colors.muted}
          />
          <Text style={styles.distanceLabel}>현재 위치에서</Text>
        </View>
        {distance !== null ? (
          <Text style={styles.distanceValue}>
            {distance < 1000
              ? `${Math.round(distance)}m`
              : `${(distance / 1000).toFixed(1)}km`}
          </Text>
        ) : (
          <Text style={styles.distanceValue}>계산 중...</Text>
        )}
      </View>
      <Pressable
        onPress={stampHere}
        disabled={loading}
        style={[styles.button, loading && styles.buttonDisabled]}
      >
        <Text style={styles.text}>
          {loading ? "탐험하는 중…" : "이곳 탐험하기"}
        </Text>
      </Pressable>

      <Modal
        visible={modal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setModal((p) => ({ ...p, visible: false }))}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <SymbolView
              name={
                modal.type === "success"
                  ? { ios: "checkmark.circle.fill", android: "check_circle" }
                  : { ios: "exclamationmark.triangle.fill", android: "warning" }
              }
              size={56}
              tintColor={
                modal.type === "success" ? colors.accent : colors.muted
              }
              style={{ marginBottom: spacing.md }}
            />
            <Text style={styles.modalTitle}>{modal.title}</Text>
            <Text style={styles.modalMessage}>{modal.message}</Text>
            <Pressable
              style={styles.modalButton}
              onPress={() => setModal((p) => ({ ...p, visible: false }))}
            >
              <Text style={styles.modalButtonText}>확인</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  distanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  distanceLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  distanceLabel: {
    ...typography.meta,
    color: colors.muted,
  },
  distanceValue: {
    ...typography.body,
    fontWeight: "700",
    color: colors.accent,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  modalTitle: {
    ...typography.header,
    color: colors.ink,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  modalMessage: {
    ...typography.body,
    color: colors.muted,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  modalButton: {
    backgroundColor: colors.chip,
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonText: {
    ...typography.body,
    fontWeight: "700",
    color: colors.ink,
  },
});
