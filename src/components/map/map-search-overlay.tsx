import { cardShadow, colors, spacing } from "@/constants/theme";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  categories: string[];
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
  onEventBannerPress?: () => void;
};

// 지도 상단 플로팅: 검색바(탭 → 검색 스크린) + 카테고리 칩 + 이벤트 원형 버튼(이벤트 기간 내내 노출)
export default function MapSearchOverlay({
  categories,
  selectedCategory,
  setSelectedCategory,
  onEventBannerPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={[styles.topOverlay, { top: insets.top + spacing.sm }]}
      pointerEvents="box-none"
    >
      <Pressable
        style={styles.searchField}
        onPress={() => router.push("/search")}
      >
        <Text style={styles.searchPlaceholder}>관광지 검색</Text>
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRow}
      >
        <Pressable
          onPress={() => setSelectedCategory(null)}
          style={[styles.chip, selectedCategory === null && styles.chipActive]}
        >
          <Text
            style={[
              styles.chipText,
              selectedCategory === null && styles.chipTextActive,
            ]}
          >
            전체
          </Text>
        </Pressable>
        {categories.map((c) => {
          const active = selectedCategory === c;
          return (
            <Pressable
              key={c}
              onPress={() => setSelectedCategory(c)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {c}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable style={styles.eventButton} onPress={onEventBannerPress}>
        <LottieView
          source={require("../../assets/lottie/gift.json")}
          autoPlay
          loop
          style={styles.eventLottie}
        />
        <View style={styles.eventContent}>
          <Text style={styles.eventButtonText}>이벤트</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  eventButton: {
    alignSelf: "flex-start",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...cardShadow,
  },
  eventLottie: {
    position: "absolute",
    width: 32,
    height: 32,
    top: 4,
    zIndex: 0,
  },
  eventContent: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
    paddingBottom: 6,
    zIndex: 1,
  },
  eventButtonText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 0.2,
  },
  searchField: {
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    ...cardShadow,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: colors.muted,
  },
  chipScroll: {
    flexGrow: 0,
    overflow: "visible",
  },
  chipRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingRight: spacing.lg,
  },
  chip: {
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...cardShadow,
  },
  chipActive: {
    backgroundColor: colors.accent,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
  },
  chipTextActive: {
    color: colors.white,
  },
});
