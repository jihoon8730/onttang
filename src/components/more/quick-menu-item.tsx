import { colors, spacing, typography } from "@/constants/theme";
import { Image, ImageProps } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  icon: ImageProps["source"];
  label: string;
  onPress: () => void;
};

// 더보기 화면 상단 퀵메뉴 아이템 (스탬프 이벤트 / 내 쿠폰함 / 고객센터 등)
export default function QuickMenuItem({ icon, label, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <View style={styles.iconWrap}>
        <Image source={icon} style={styles.icon} contentFit="cover" />
      </View>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    flex: 1,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  text: {
    ...typography.meta,
    color: colors.ink,
    fontWeight: "600",
  },
});
