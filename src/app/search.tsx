import { colors, radius, spacing, typography } from "@/constants/theme";
import { fetchAttractions, fetchMyStamps } from "@/lib/api";
import { useAuthStore } from "@/stores/use-auth-store";
import { useFilterStore } from "@/stores/use-filter-store";
import { Attraction } from "@/types/attraction";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { SymbolView } from "expo-symbols";
import { useEffect, useMemo, useState } from "react";
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

const RECENT_KEY = "recentSearches";
const REGIONS = ["서울", "부산", "제주", "경주", "강원", "전주", "여수", "경기"];
const THEMES = ["자연", "역사", "체험·즐길거리", "명소"];

export default function Search() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setPendingFocusId = useFilterStore((s) => s.setPendingFocusId);

  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>([]);

  const { data: attractions = [] } = useQuery({
    queryKey: ["attractions"],
    queryFn: fetchAttractions,
  });

  // 내 스탬프 → 결과에 "탐험함" 표시
  const token = useAuthStore((s) => s.token);
  const { data: myStamps } = useQuery({
    queryKey: ["my-stamps"],
    queryFn: () => fetchMyStamps(token!),
    enabled: !!token,
  });
  const stampMap = useMemo(() => {
    const m = new Map<string, number>();
    (myStamps ?? []).forEach((s) => m.set(s.content_id, s.visit_count));
    return m;
  }, [myStamps]);

  // 최근 검색 로드
  useEffect(() => {
    SecureStore.getItemAsync(RECENT_KEY).then((v) => {
      if (!v) return;
      try {
        setRecent(JSON.parse(v));
      } catch {
        // 무시
      }
    });
  }, []);

  const saveRecent = (title: string) => {
    setRecent((prev) => {
      const next = [title, ...prev.filter((t) => t !== title)].slice(0, 8);
      SecureStore.setItemAsync(RECENT_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const clearRecent = () => {
    setRecent([]);
    SecureStore.deleteItemAsync(RECENT_KEY).catch(() => {});
  };

  const q = query.trim().toLowerCase();
  const filtering = q !== "" || theme !== null;
  const results = !filtering
    ? []
    : attractions.filter((a) => {
        const textOk =
          q === "" ||
          a.title.toLowerCase().includes(q) ||
          (a.address?.toLowerCase().includes(q) ?? false);
        const themeOk = theme === null || a.category === theme;
        return textOk && themeOk;
      });

  const selectPlace = (a: Attraction) => {
    setPendingFocusId(a.content_id);
    saveRecent(a.title);
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
            placeholder="관광지·지역 검색"
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

      {/* 활성 테마 필터 */}
      {theme ? (
        <View style={styles.activeRow}>
          <Pressable style={styles.activeChip} onPress={() => setTheme(null)}>
            <Text style={styles.activeChipText}>테마 · {theme}</Text>
            <SymbolView
              name={{ ios: "xmark", android: "close" }}
              size={11}
              tintColor={colors.accent}
            />
          </Pressable>
        </View>
      ) : null}

      {filtering ? (
        results.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.hint}>검색 결과가 없어요</Text>
          </View>
        ) : (
          <FlashList
            data={results}
            keyExtractor={(item) => item.content_id}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={({ item }) => (
              <ResultRow
                attraction={item}
                visitCount={stampMap.get(item.content_id)}
                onPress={() => selectPlace(item)}
              />
            )}
          />
        )
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.initial}
        >
          <Text style={styles.heroTitle}>
            어디를 <Text style={styles.heroAccent}>탐험</Text>할까요?
          </Text>

          <View style={styles.block}>
            <Text style={styles.label}>지역</Text>
            <View style={styles.chips}>
              {REGIONS.map((r) => (
                <Pressable
                  key={r}
                  style={styles.chip}
                  onPress={() => setQuery(r)}
                >
                  <Text style={styles.chipText}>{r}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.block}>
            <Text style={styles.label}>테마</Text>
            <View style={styles.chips}>
              {THEMES.map((t) => (
                <Pressable
                  key={t}
                  style={styles.themeChip}
                  onPress={() => setTheme(t)}
                >
                  <Text style={styles.themeChipText}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {recent.length > 0 ? (
            <View style={styles.block}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>최근 검색</Text>
                <Pressable onPress={clearRecent} hitSlop={8}>
                  <Text style={styles.clearRecent}>지우기</Text>
                </Pressable>
              </View>
              {recent.map((t) => (
                <Pressable
                  key={t}
                  style={styles.recentRow}
                  onPress={() => setQuery(t)}
                >
                  <SymbolView
                    name={{ ios: "clock", android: "schedule" }}
                    size={16}
                    tintColor={colors.muted}
                  />
                  <Text style={styles.recentText} numberOfLines={1}>
                    {t}
                  </Text>
                  <SymbolView
                    name={{ ios: "arrow.up.left", android: "north_west" }}
                    size={14}
                    tintColor={colors.hairline}
                  />
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function ResultRow({
  attraction,
  visitCount,
  onPress,
}: {
  attraction: Attraction;
  visitCount?: number;
  onPress: () => void;
}) {
  const stamped = visitCount != null;
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={styles.thumbWrap}>
        {attraction.image_url ? (
          <Image
            source={attraction.image_url}
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
        {stamped ? (
          <View style={styles.seal}>
            <Text style={styles.sealFlag}>⚑</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {attraction.title}
        </Text>
        <View style={styles.rowMeta}>
          {attraction.category ? (
            <View style={styles.miniChip}>
              <Text style={styles.miniChipText}>{attraction.category}</Text>
            </View>
          ) : null}
          {stamped ? (
            <Text style={styles.done}>
              탐험함{visitCount > 1 ? ` · ${visitCount}회` : ""}
            </Text>
          ) : attraction.address ? (
            <Text style={styles.rowAddr} numberOfLines={1}>
              {attraction.address}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
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
  cancel: { fontSize: 15, fontWeight: "600", color: colors.accent },

  activeRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  activeChipText: { fontSize: 13, fontWeight: "700", color: colors.accent },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  hint: { ...typography.body, color: colors.muted },

  // 초기 상태
  initial: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  heroAccent: { color: colors.accent },
  block: { marginTop: spacing.lg },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.muted,
    fontWeight: "800",
    marginBottom: spacing.md,
  },
  clearRecent: { ...typography.meta, color: colors.muted },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chipText: { fontSize: 13, fontWeight: "700", color: colors.ink },
  themeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
  },
  themeChipText: { fontSize: 13, fontWeight: "700", color: colors.accentDark },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  recentText: { flex: 1, ...typography.body, color: colors.ink },

  // 결과 행
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowPressed: { backgroundColor: colors.chip },
  thumbWrap: { width: 48, height: 48 },
  rowImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.chip,
  },
  rowImagePlaceholder: { alignItems: "center", justifyContent: "center" },
  seal: {
    position: "absolute",
    right: -5,
    bottom: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.accentDark,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-12deg" }],
  },
  sealFlag: { fontSize: 10, color: colors.accentDark },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { ...typography.body, fontWeight: "700", color: colors.ink },
  rowMeta: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  miniChip: {
    backgroundColor: colors.chip,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
  },
  miniChipText: { ...typography.chip, color: colors.muted },
  rowAddr: { ...typography.meta, color: colors.muted, flex: 1 },
  done: { ...typography.meta, color: colors.accentDark, fontWeight: "700" },
});
