import AttractionListItem from "@/components/map/attraction-list-item";
import AttractionMarker from "@/components/map/attraction-marker";
import MapSearchOverlay from "@/components/map/map-search-overlay";
import MyLocationButton from "@/components/map/my-location-button";
import { colors, spacing, typography } from "@/constants/theme";
import { useMyLocation } from "@/hooks/use-my-location";
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
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

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

// 바텀시트 스크롤 영역
const SHEET_SNAP_POINTS = ["35%", "80%"];
const SHEET_SNAP_RATIOS = [0.35, 0.8]; // SNAP_POINTS와 1:1 대응 (mapPadding 계산용)
const SHEET_INITIAL_INDEX = 0; // 접힘으로 시작
const SHEET_ANIM_DURATION = 500;
const LIST_BOTTOM_PADDING = 90;
// mapPadding이 화면을 너무 밀어 올리지 않도록
const MAP_PADDING_MAX_RATIO = 0.45;

export default function Index() {
  // --- 외부 훅 ---
  const router = useRouter();
  const { height: screenH } = useWindowDimensions();
  const BottomSheetScrollable = useBottomSheetScrollableCreator();
  const animationConfigs = useBottomSheetTimingConfigs({
    duration: SHEET_ANIM_DURATION,
  });

  // --- 필터 상태 (Zustand) ---
  const selectedCategory = useFilterStore((state) => state.selectedCategory);
  const setSelectedCategory = useFilterStore(
    (state) => state.setSelectedCategory,
  );
  const pendingFocusId = useFilterStore((state) => state.pendingFocusId);
  const setPendingFocusId = useFilterStore((state) => state.setPendingFocusId);

  // --- refs ---
  const mapRef = useRef<NaverMapViewRef>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const listRef = useRef<FlashListRef<Attraction>>(null);

  // --- 로컬 상태 ---
  const [selectedId, setSelectedId] = useState<string>("");
  const [region, setRegion] = useState<Region | null>(null);
  const [sheetIndex, setSheetIndex] = useState(SHEET_INITIAL_INDEX);

  // --- 내 위치 (커스텀 훅) ---
  const { myLocation, pulseRadius, showMyLocation } = useMyLocation(mapRef);

  // --- 서버 데이터 ---
  const {
    data: attractions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["attractions"],
    queryFn: fetchAttractions,
  });

  // --- 파생 데이터: 카테고리 필터 → 지도 영역 bbox ---
  const filteredAttractions = useMemo(
    () =>
      attractions.filter(
        (a) => selectedCategory === null || a.category === selectedCategory,
      ),
    [attractions, selectedCategory],
  );

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

  // 선택된(검색으로 고른) 장소를 리스트 맨 위로
  const listData = useMemo(() => {
    if (!selectedId) return visibleAttractions;
    const idx = visibleAttractions.findIndex(
      (a) => a.content_id === selectedId,
    );
    if (idx <= 0) return visibleAttractions;
    return [
      visibleAttractions[idx],
      ...visibleAttractions.slice(0, idx),
      ...visibleAttractions.slice(idx + 1),
    ];
  }, [visibleAttractions, selectedId]);

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
    sheetRef.current?.collapse(); // 장소 선택 시 시트 접어 지도 보이게
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
        onExplore={openDetail}
      />
    ),
    [selectedId, focusAttraction, openDetail],
  );

  // 검색 스크린에서 고른 장소를 지도에 포커스 (돌아왔을 때 소비 후 clear)
  useEffect(() => {
    if (!pendingFocusId || attractions.length === 0) return;
    const target = attractions.find((a) => a.content_id === pendingFocusId);
    if (target) focusAttraction(target);
    setPendingFocusId(null);
  }, [pendingFocusId, attractions, focusAttraction, setPendingFocusId]);

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

      <MyLocationButton onPress={showMyLocation} />

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
              이 지역 관광지 {listData.length}곳
            </Text>
          }
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: LIST_BOTTOM_PADDING }}
          renderScrollComponent={BottomSheetScrollable}
          maintainVisibleContentPosition={{ disabled: true }}
        />
      </BottomSheet>

      <MapSearchOverlay
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

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
});
