import { colors, spacing, typography } from "@/constants/theme";
import { Attraction } from "@/types/attraction";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  attraction: Attraction;
  selected: boolean;
  visitCount?: number; // undefined = 미탐험, >=1 = 이미 도장 찍은 곳
  onPress: (attraction: Attraction) => void;
  onExplore: (attraction: Attraction) => void;
};

function AttractionListItem({
  attraction,
  selected,
  visitCount,
  onPress,
  onExplore,
}: Props) {
  const stamped = visitCount != null;

  return (
    <Pressable
      style={[styles.box, selected && styles.boxSelected]}
      onPress={() => onPress(attraction)}
    >
      <View style={styles.thumbWrap}>
        <Image
          style={styles.image}
          source={attraction.image_url}
          contentFit="cover"
        />
        {/* 이미 탐험한(도장 찍은) 곳 표시 — 내 영토 여권과 같은 모티프 */}
        {stamped ? (
          <View style={styles.seal}>
            <Text style={styles.sealFlag}>⚑</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {attraction.title}
        </Text>
        <View style={styles.metaRow}>
          {attraction.category ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{attraction.category}</Text>
            </View>
          ) : null}
          {stamped ? (
            <Text style={styles.done}>
              탐험함{visitCount > 1 ? ` · ${visitCount}회` : ""}
            </Text>
          ) : (
            <Text style={styles.address} numberOfLines={1} ellipsizeMode="tail">
              {attraction.address}
            </Text>
          )}
        </View>
      </View>

      {/* 상세로 — 은은한 셰브론 */}
      <Pressable
        onPress={() => onExplore(attraction)}
        hitSlop={10}
        style={styles.chevron}
      >
        <SymbolView
          name={{ ios: "chevron.right", android: "chevron_right" }}
          size={16}
          tintColor={colors.muted}
        />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  boxSelected: { backgroundColor: colors.accentSoft },
  thumbWrap: { width: 56, height: 56 },
  image: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.chip,
  },
  seal: {
    position: "absolute",
    right: -6,
    bottom: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.accentDark,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-12deg" }],
  },
  sealFlag: { fontSize: 12, color: colors.accentDark },
  info: { flex: 1, gap: 3 },
  title: { ...typography.body, fontWeight: "700", color: colors.ink },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  chip: {
    backgroundColor: colors.chip,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
  },
  chipText: { ...typography.chip, color: colors.muted },
  address: { ...typography.meta, color: colors.muted, flex: 1 },
  done: { ...typography.meta, color: colors.accentDark, fontWeight: "700" },
  chevron: { paddingLeft: spacing.xs },
});

export default memo(AttractionListItem);
