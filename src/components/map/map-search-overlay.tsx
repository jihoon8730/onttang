import { cardShadow, colors, spacing } from "@/constants/theme";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  categories: string[];
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
};

// 지도 상단 플로팅: 검색바 + 카테고리 칩
export default function MapSearchOverlay({
  searchQuery,
  setSearchQuery,
  categories,
  selectedCategory,
  setSelectedCategory,
}: Props) {
  const insets = useSafeAreaInsets();
  const isSearching = searchQuery.trim() !== "";

  return (
    <View
      style={[styles.topOverlay, { top: insets.top + spacing.sm }]}
      pointerEvents="box-none"
    >
      <View style={styles.searchField}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="관광지 검색"
          placeholderTextColor={colors.muted}
          underlineColorAndroid="transparent"
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        {isSearching && (
          <Pressable
            onPress={() => setSearchQuery("")}
            hitSlop={8}
            style={styles.searchClear}
          >
            <Text style={styles.searchClearText}>✕</Text>
          </Pressable>
        )}
      </View>

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
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    ...cardShadow,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: spacing.md,
  },
  searchClear: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.muted,
  },
  searchClearText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 13,
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
