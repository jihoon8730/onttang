import { colors, spacing, typography } from "@/constants/theme";
import { Attraction } from "@/types/attraction";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  attraction: Attraction;
  selected: boolean;
  visitCount?: number; // undefined = 미탐험, >=1 = 이미 스탬프 찍은 곳
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
      <View style={[styles.thumbRing, selected && styles.thumbRingSelected]}>
        <Image
          style={styles.image}
          source={attraction.image_url}
          contentFit="cover"
        />
        {/* 이미 탐험한(스탬프 찍은) 곳 표시 */}
        {stamped ? (
          <View style={styles.seal}>
            <Text style={styles.sealFlag}>⚑</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.info}>
        <Text
          style={[styles.title, selected && styles.titleSelected]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
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

      {/* 상세로 — 선택 시 예쁜 '탐험' 버튼으로 변신 */}
      <Pressable
        onPress={() => onExplore(attraction)}
        hitSlop={10}
        style={styles.exploreBtn}
      >
        {selected ? (
          <View style={styles.exploreBtnSelected}>
            <SymbolView name={{ ios: "chevron.right", android: "chevron_right" }} size={14} weight="bold" tintColor={colors.accent} style={{ marginLeft: 1 }} />
          </View>
        ) : (
          <SymbolView
            name={{ ios: "chevron.right", android: "chevron_right" }}
            size={16}
            tintColor={colors.muted}
          />
        )}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: "transparent",
  },
  boxSelected: {
    backgroundColor: "rgba(0,0,0,0.02)", // 아주 미세한 음영만
  },
  thumbRing: {
    width: 62,
    height: 62,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbRingSelected: {
    borderColor: colors.accent,
  },
  image: {
    width: 54,
    height: 54,
    borderRadius: 16,
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
  titleSelected: { color: colors.accent, fontWeight: "800" },
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
  exploreBtn: {
    paddingLeft: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    height: 32,
    width: 32, // 일정한 공간 차지
  },
  exploreBtnSelected: {
    width: 30,
    height: 30,
    backgroundColor: colors.accentSoft,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default memo(AttractionListItem);
