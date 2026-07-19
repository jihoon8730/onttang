import AttractionListItem from "@/components/attraction-list-item";
import AttractionMarker from "@/components/attraction-marker";
import { colors, spacing, typography } from "@/constants/theme";
import { fetchAttractions } from "@/lib/api";
import { useFilterStore } from "@/stores/use-filter-store";
import { Attraction } from "@/types/attraction";
import BottomSheet, {
  useBottomSheetScrollableCreator,
  useBottomSheetTimingConfigs,
} from "@gorhom/bottom-sheet";
import {
  NaverMapView,
  type NaverMapViewRef,
} from "@mj-studio/react-native-naver-map";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const INITIAL_CAMERA = {
  latitude: 37.5665, // 서울시청
  longitude: 126.978,
  zoom: 11, // 도시 단위 (클수록 확대)
};

// 마커 클릭 시 카메라 이동
const FOCUS_ZOOM = 15;
const FOCUS_DURATION = 1000;

// 바텀시트 (접힘 peek / 펼침 full 2단계 — 중간 스냅 제거로 45%에서 바닥 안 보이던 문제 해결)
// peek 35% (검색바+헤더+항목 2~3개 노출), full 80%에서 리스트 전체 스크롤
const SHEET_SNAP_POINTS = ["35%", "80%"];
const SHEET_SNAP_RATIOS = [0.35, 0.8]; // SNAP_POINTS와 1:1 대응 (mapPadding 계산용)
const SHEET_INITIAL_INDEX = 0; // 접힘(peek)으로 시작 → 지도가 메인
const SHEET_ANIM_DURATION = 500;
const LIST_BOTTOM_PADDING = 90;
// mapPadding이 화면을 너무 밀어 올리지 않도록 상한 (80%까지 열면 지도가 과하게 밀림)
const MAP_PADDING_MAX_RATIO = 0.45;

export default function Index() {
  // --- 외부 훅 ---
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const BottomSheetScrollable = useBottomSheetScrollableCreator();
  const animationConfigs = useBottomSheetTimingConfigs({
    duration: SHEET_ANIM_DURATION,
  });

  // --- 필터 상태 (Zustand) ---
  const searchQuery = useFilterStore((state) => state.searchQuery);
  const selectedCategory = useFilterStore((state) => state.selectedCategory);
  const setSearchQuery = useFilterStore((state) => state.setSearchQuery);
  const setSelectedCategory = useFilterStore(
    (state) => state.setSelectedCategory,
  );

  // --- refs ---
  const mapRef = useRef<NaverMapViewRef>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const listRef = useRef<FlashListRef<Attraction>>(null);
  const locationSub = useRef<Location.LocationSubscription | null>(null);

  // --- 로컬 상태 ---
  const [selectedId, setSelectedId] = useState<string>("");
  const [region, setRegion] = useState<Region | null>(null);
  const [sheetIndex, setSheetIndex] = useState(SHEET_INITIAL_INDEX);
  const [myLocation, setMyLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [pulseRadius, setPulseRadius] = useState(20);

  useEffect(() => {
    return () => {
      locationSub.current?.remove();
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setPulseRadius((r) => (r >= 20 ? 5 : r + 1));
    }, 60);
    return () => clearInterval(id);
  }, []);

  // --- 서버 데이터 ---
  const {
    data: attractions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["attractions"],
    queryFn: fetchAttractions,
  });

  // --- 파생 데이터: 필터 파이프라인 (검색·카테고리 → 지도 영역 bbox) ---
  const filteredAttractions = useMemo(() => {
    const filterQuery = searchQuery.trim().toLowerCase();

    return attractions.filter((a) => {
      const searchFilter =
        a.title.toLowerCase().includes(filterQuery) ||
        a.address?.toLowerCase().includes(filterQuery);
      const selectedCategoryFilter =
        a.category === selectedCategory || selectedCategory === null;
      return searchFilter && selectedCategoryFilter;
    });
  }, [attractions, searchQuery, selectedCategory]);

  const visibleAttractions = useMemo(() => {
    if (!region) return filteredAttractions;
    const minLat = region.latitude;
    const maxLat = region.latitude + region.latitudeDelta;
    const minLng = region.longitude;
    const maxLng = region.longitude + region.longitudeDelta;

    return filteredAttractions.filter(
      (a) =>
        a.latitude >= minLat &&
        a.latitude <= maxLat &&
        a.longitude >= minLng &&
        a.longitude <= maxLng,
    );
  }, [region, filteredAttractions]);

  const isSearching = searchQuery.trim() !== "";
  // 검색 중이면 화면 밖 매치까지 전부, 아니면 지도 영역 안만
  const listData = isSearching ? filteredAttractions : visibleAttractions;

  // 카테고리 칩 목록 (원본 기준 — 지도 이동에도 고정)
  const categories = useMemo(
    () =>
      [...new Set(attractions.map((a) => a.category))].filter(
        (c): c is string => c !== null,
      ),
    [attractions],
  );

  // 바텀시트가 덮는 만큼 지도 중심을 위로 올려, 보이는 영역 기준으로 카메라가 맞도록
  const mapPadding = useMemo(() => {
    const ratio = Math.min(
      SHEET_SNAP_RATIOS[sheetIndex],
      MAP_PADDING_MAX_RATIO,
    );
    return { bottom: screenH * ratio };
  }, [screenH, sheetIndex]);

  // --- 콜백 ---
  const focusAttraction = useCallback((a: Attraction) => {
    mapRef.current?.animateCameraTo({
      latitude: a.latitude,
      longitude: a.longitude,
      zoom: FOCUS_ZOOM,
      duration: FOCUS_DURATION,
      easing: "Fly",
    });
    setSelectedId(a.content_id);
  }, []);

  const openDetail = useCallback(
    (a: Attraction) => router.push(`/attraction/${a.content_id}`),
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Attraction }) => (
      <AttractionListItem
        attraction={item}
        selected={item.content_id === selectedId}
        onPress={focusAttraction}
        onOccupy={openDetail}
      />
    ),
    [selectedId, focusAttraction, openDetail],
  );

  // 내 위치 가져오기 + 위치 권한 요청
  const showMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") return;

    const loc = await Location.getCurrentPositionAsync();
    const coords = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
    setMyLocation(coords);

    mapRef.current?.animateCameraTo({ ...coords, zoom: 15 });

    locationSub.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 1,
      },
      (loc) => {
        setMyLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      },
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapSection}>
        <NaverMapView
          ref={mapRef}
          style={styles.map}
          initialCamera={INITIAL_CAMERA}
          mapPadding={mapPadding}
          onCameraIdle={(args) => {
            setRegion(args.region);
            listRef.current?.scrollToTop({ animated: false });
          }}
          locale="ko"
          locationOverlay={{
            isVisible: myLocation !== null,
            position: myLocation ?? INITIAL_CAMERA,
            circleRadius: pulseRadius,
            circleColor: "#4285F433",
          }}
        >
          {visibleAttractions.map((a) => (
            <AttractionMarker
              key={a.content_id}
              attraction={a}
              selected={a.content_id === selectedId}
              onPress={focusAttraction}
            />
          ))}
        </NaverMapView>
      </View>

      <BottomSheet
        ref={sheetRef}
        index={SHEET_INITIAL_INDEX}
        snapPoints={SHEET_SNAP_POINTS}
        onChange={setSheetIndex}
        animationConfigs={animationConfigs}
        enableDynamicSizing={false}
        enableContentPanningGesture={false}
      >
        <FlashList
          ref={listRef}
          style={styles.list}
          data={listData}
          keyExtractor={(item) => item.content_id}
          ListHeaderComponent={
            <Text style={styles.listHeader}>
              {isSearching ? "검색 결과" : "이 지역 관광지"} {listData.length}곳
            </Text>
          }
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: LIST_BOTTOM_PADDING }}
          renderScrollComponent={BottomSheetScrollable}
          maintainVisibleContentPosition={{ disabled: true }}
        />
      </BottomSheet>

      {/* 지도 위 상단 플로팅: 검색바 + 카테고리 칩 */}
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
            style={[
              styles.chip,
              selectedCategory === null && styles.chipActive,
            ]}
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
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <Pressable
        onPress={showMyLocation}
        style={{
          position: "absolute",
          right: 16,
          bottom: 300,
          backgroundColor: colors.white,
          padding: 12,
          borderRadius: 24,
          ...cardShadow,
        }}
      >
        <Text>📍</Text>
      </Pressable>

      {isLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" />
        </View>
      )}
      {isError && (
        <View style={styles.overlay}>
          <Text>데이터를 불러오지 못했어요</Text>
        </View>
      )}
    </View>
  );
}

// 지도 위에 뜨는 카드/칩 그림자 (iOS shadow* + Android elevation)
const cardShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.14,
  shadowRadius: 12,
  elevation: 5,
} as const;

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapSection: { flex: 1 },
  map: { flex: 1 },
  list: { flex: 1, backgroundColor: colors.background },
  listHeader: { padding: spacing.lg, ...typography.header },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
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
