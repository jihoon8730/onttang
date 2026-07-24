import { colors, spacing, typography } from "@/constants/theme";
import { SymbolView } from "expo-symbols";
import LottieView from "lottie-react-native";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  type: "success" | "error" | "celebration";
  title: string;
  message: string;
  visitCount?: number;
  stampedTotal: number; // 나의 전국 탐험 총 개수 (celebration 변형에만 표시)
  onClose: () => void;
};

// "여기 찍기" 결과 모달 — 축하(celebration) 변형과 일반 성공/에러 변형 두 가지
export default function StampResultModal({
  visible,
  type,
  title,
  message,
  visitCount,
  stampedTotal,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        {type === "celebration" ? (
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
              <Text style={styles.celebTitle}>{title}</Text>
              <Text style={styles.celebMessage}>{message}</Text>

              <View style={styles.statBox}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>이번 장소 방문</Text>
                  <Text style={styles.statValue}>{visitCount}회</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>나의 전국 개척</Text>
                  <Text style={styles.statValue}>{stampedTotal}곳</Text>
                </View>
              </View>

              <Pressable style={styles.celebButton} onPress={onClose}>
                <Text style={styles.celebButtonText}>계속 탐험하기</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.modalContent}>
            <SymbolView
              name={
                type === "success"
                  ? { ios: "checkmark.circle.fill", android: "check_circle" }
                  : { ios: "exclamationmark.triangle.fill", android: "warning" }
              }
              size={56}
              tintColor={type === "success" ? colors.accent : colors.muted}
              style={{ marginBottom: spacing.md }}
            />
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalMessage}>{message}</Text>
            <Pressable style={styles.modalButton} onPress={onClose}>
              <Text style={styles.modalButtonText}>확인</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
