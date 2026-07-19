import { colors, spacing, typography } from "@/constants/theme";
import { formatInfoText } from "@/lib/utils";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
  value: string;
};

// 운영 정보 한 줄 (라벨 + 값). 값이 길면 2줄로 접고 "더보기"로 펼침.
export default function InfoRow({ label, value }: Props) {
  const [expanded, setExpanded] = useState(false);
  const text = formatInfoText(value);
  // 여러 줄(구간·개행)이거나 긴 텍스트일 때만 접기/더보기 노출
  const collapsible = text.includes("\n") || text.length > 45;

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueWrap}>
        <Text
          style={styles.infoValue}
          numberOfLines={collapsible && !expanded ? 2 : undefined}
        >
          {text}
        </Text>
        {collapsible ? (
          <Pressable onPress={() => setExpanded((prev) => !prev)} hitSlop={6}>
            <Text style={styles.moreButton}>{expanded ? "접기" : "더보기"}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  infoLabel: {
    ...typography.meta,
    color: colors.accent,
    width: 56,
    paddingTop: 1,
  },
  infoValueWrap: {
    flex: 1,
    minWidth: 0, // 콘텐츠보다 작게 줄어들 수 있게 → 텍스트가 카드 안에서 줄바꿈됨
    gap: 2,
  },
  infoValue: {
    ...typography.body,
    color: colors.ink,
  },
  moreButton: {
    ...typography.meta,
    color: colors.accent,
    fontWeight: "700",
  },
});
