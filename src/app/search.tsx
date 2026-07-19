import { colors, radius, spacing, typography } from "@/constants/theme";
import { fetchAttractions } from "@/lib/api";
import { useFilterStore } from "@/stores/use-filter-store";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Search() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setPendingFocusId = useFilterStore((s) => s.setPendingFocusId);
  const [query, setQuery] = useState("");

  const { data: attractions = [] } = useQuery({
    queryKey: ["attractions"],
    queryFn: fetchAttractions,
  });

  const q = query.trim().toLowerCase();
  const results =
    q === ""
      ? []
      : attractions.filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.address?.toLowerCase().includes(q),
        );

  // 장소 선택 → 지도가 포커스할 id를 저장하고 지도로 복귀
  const selectPlace = (id: string) => {
    setPendingFocusId(id);
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      {/* 검색 바 */}
      <View style={styles.bar}>
        <View style={styles.field}>
          <SymbolView
            name={{ ios: "magnifyingglass", android: "search" }}
            size={18}
            tintColor={colors.muted}
          />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="관광지 이름·지역 검색"
            placeholderTextColor={colors.muted}
            autoFocus
            returnKeyType="search"
          />
          <View style={styles.clearSlot}>
            {query ? (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <SymbolView
                  name={{ ios: "xmark.circle.fill", android: "cancel" }}
                  size={18}
                  tintColor={colors.muted}
                />
              </Pressable>
            ) : null}
          </View>
        </View>
        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            router.back();
          }}
          hitSlop={8}
        >
          <Text style={styles.cancel}>취소</Text>
        </Pressable>
      </View>

      {/* 결과 / 빈 상태 */}
      {q === "" ? (
        <View style={styles.center}>
          <SymbolView
            name={{ ios: "magnifyingglass", android: "search" }}
            size={44}
            tintColor={colors.hairline}
          />
          <Text style={styles.hint}>관광지 이름이나 지역을 검색해보세요</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.hint}>‘{query.trim()}’ 검색 결과가 없어요</Text>
        </View>
      ) : (
        <FlashList
          data={results}
          keyExtractor={(item) => item.content_id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => selectPlace(item.content_id)}
            >
              {item.image_url ? (
                <Image
                  source={item.image_url}
                  style={styles.rowImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.rowImage, styles.rowImagePlaceholder]}>
                  <SymbolView
                    name={{ ios: "mappin", android: "location_on" }}
                    size={16}
                    tintColor={colors.muted}
                  />
                </View>
              )}
              <View style={styles.rowText}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.address ? (
                  <Text style={styles.rowAddr} numberOfLines={1}>
                    {item.address}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  field: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.chip,
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.ink,
    paddingVertical: spacing.md,
  },
  clearSlot: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cancel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.accent,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingBottom: 80,
    paddingHorizontal: spacing.xl,
  },
  hint: {
    ...typography.body,
    color: colors.muted,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowPressed: {
    backgroundColor: colors.chip,
  },
  rowImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.chip,
  },
  rowImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...typography.body,
    color: colors.ink,
    fontWeight: "600",
  },
  rowAddr: {
    ...typography.meta,
    color: colors.muted,
  },
});
