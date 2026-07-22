import { API_URL } from "@/constants/config";
import { colors, spacing, typography } from "@/constants/theme";
import { fetchMyStats } from "@/lib/api";
import { getDistance } from "@/lib/utils";
import { useAuthStore } from "@/stores/use-auth-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { SymbolView } from "expo-symbols";
import LottieView from "lottie-react-native";
import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

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

  const { data: stats } = useQuery({
    queryKey: ["my-stats"],
    queryFn: () => fetchMyStats(token!),
    enabled: !!token,
  });

  const [modal, setModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "celebration";
    visitCount?: number;
  }>({ visible: false, title: "", message: "", type: "success" });

  const showModal = (
    title: string,
    message: string,
    type: "success" | "error" | "celebration" = "error",
    visitCount?: number,
  ) => {
    setModal({ visible: true, title, message, type, visitCount });
  };

  useEffect(() => {
    let sub: Location.LocationSubscription;
    (async () => {
      try {
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
      } catch (e) {
        // 위치 서비스 꺼짐 등으로 추적 실패 — 거리 표시만 생략 (크래시 방지)
        console.warn("거리 추적을 시작하지 못했어요", e);
      }
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

    // 현재 위치 가져오기 (Android는 위치 서비스 꺼짐 대비해 켜기 유도)
    let loc: Location.LocationObject;
    try {
      if (Platform.OS === "android") {
        await Location.enableNetworkProviderAsync();
      }
      loc = await Location.getCurrentPositionAsync();
    } catch {
      setLoading(false);
      showModal(
        "위치를 확인할 수 없어요",
        "기기의 위치 서비스가 켜져 있는지 확인해주세요",
        "error",
      );
      return;
    }

    try {
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
        queryClient.invalidateQueries({ queryKey: ["rankings"] });
        if (data.visit_count === 1) {
          showModal(
            "탐험 성공!",
            "새로운 영토를 발견했습니다",
            "celebration",
            data.visit_count,
          );
        } else {
          showModal(
            "탐험 완료",
            `이곳에 벌써 ${data.visit_count}번째 방문하셨네요!`,
            "celebration",
            data.visit_count,
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
          {modal.type === "celebration" ? (
            <View style={styles.celebrationContent}>
              <LottieView
                source={require("../../assets/lottie/confetti.json")}
                autoPlay
                loop
                resizeMode="cover"
              />
              <View style={styles.celebInner}>
                <View style={styles.celebIconBadge}>
                  <SymbolView
                    name={{ ios: "flag.fill", android: "flag" }}
                    size={48}
                    tintColor={colors.accent}
                  />
                </View>
                <Text style={styles.celebTitle}>{modal.title}</Text>
                <Text style={styles.celebMessage}>{modal.message}</Text>

                <View style={styles.statBox}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>이번 장소 방문</Text>
                    <Text style={styles.statValue}>{modal.visitCount}회</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>나의 전국 개척</Text>
                    <Text style={styles.statValue}>
                      {stats?.stamped ?? 0}곳
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={styles.celebButton}
                  onPress={() => setModal((p) => ({ ...p, visible: false }))}
                >
                  <Text style={styles.celebButtonText}>계속 탐험하기</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.modalContent}>
              <SymbolView
                name={
                  modal.type === "success"
                    ? { ios: "checkmark.circle.fill", android: "check_circle" }
                    : {
                        ios: "exclamationmark.triangle.fill",
                        android: "warning",
                      }
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
          )}
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

  // Celebration UI
  celebrationContent: {
    backgroundColor: colors.white,
    borderRadius: 28,
    width: "100%",
    maxWidth: 340,
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
  },
  celebInner: {
    padding: spacing.xl * 1.5,
    alignItems: "center",
  },
  celebIconBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
    borderWidth: 4,
    borderColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  celebTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.6,
    marginBottom: spacing.sm,
  },
  celebMessage: {
    ...typography.body,
    color: colors.muted,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  statBox: {
    backgroundColor: colors.chip,
    width: "100%",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    marginBottom: spacing.xl,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  statDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 4,
  },
  statLabel: {
    ...typography.meta,
    color: colors.muted,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.accent,
  },
  celebButton: {
    backgroundColor: colors.accent,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: colors.accentDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  celebButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
});
