import { colors, spacing, typography } from "@/constants/theme";
import { SymbolView } from "expo-symbols";
import { ComponentProps } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  icon?: ComponentProps<typeof SymbolView>["name"];
  confirmLabel?: string;
  onClose: () => void;
};

// 네이티브 Alert 대신 쓰는 앱 톤에 맞춘 안내 모달 (아이콘 + 제목 + 메시지 + 확인 버튼)
export default function AlertModal({
  visible,
  title,
  message,
  icon = { ios: "info.circle.fill", android: "info" },
  confirmLabel = "확인",
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.iconBadge}>
            <SymbolView name={icon} size={40} tintColor={colors.accent} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>{confirmLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  content: {
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
  iconBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    ...typography.header,
    color: colors.ink,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  message: {
    ...typography.body,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.accent,
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    ...typography.body,
    fontWeight: "700",
    color: colors.white,
  },
});
