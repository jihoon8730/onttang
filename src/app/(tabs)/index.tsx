import AttractionListItem from "@/components/map/attraction-list-item";
import MapSearchOverlay from "@/components/map/map-search-overlay";
import MyLocationButton from "@/components/map/my-location-button";
import { API_URL } from "@/constants/config";
import {
  colors,
  fontMono,
  radius,
  spacing,
  typography,
} from "@/constants/theme";
import { useMyLocation } from "@/hooks/use-my-location";
import {
  fetchAttractionDetail,
  fetchAttractions,
  fetchMyStamps,
} from "@/lib/api";
import { useAuthStore } from "@/stores/use-auth-store";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
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
  const queryClient = useQueryClient();
  const { height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
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

  // 내 스탬프 (로그인 시) — 지도 리스트에 "탐험함" 표시용
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

  // 전국 대표를 클러스터 마커로 (네이버 SDK가 줌에 따라 자동 클러스터링)
  const clusterMarkers = useMemo(
    () =>
      filteredAttractions.map((a) => {
        const selected = a.content_id === selectedId;
        if (a.image_url) {
          // 관광지 사진을 원형 마커로 (백엔드가 합성 + 캐시)
          const url = `${API_URL}/markers?src=${encodeURIComponent(a.image_url)}${
            selected ? "&selected=true" : ""
          }`;
          return {
            identifier: a.content_id,
            latitude: a.latitude,
            longitude: a.longitude,
            image: { httpUri: url },
            width: selected ? 54 : 44,
            height: selected ? 65 : 53,
          };
        }
        // 사진 없으면 브랜드 핀으로 폴백
        return {
          identifier: a.content_id,
          latitude: a.latitude,
          longitude: a.longitude,
          image: selected
            ? require("../../../assets/images/marker-selected.png")
            : require("../../../assets/images/marker.png"),
          width: selected ? 34 : 28,
          height: selected ? 42 : 35,
        };
      }),
    [filteredAttractions, selectedId],
  );

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

  // 선택된 장소가 바뀔 때 백그라운드에서 상세 정보를 미리 패치 (프리페칭)
  useEffect(() => {
    if (selectedId) {
      queryClient.prefetchQuery({
        queryKey: ["attraction-detail", selectedId],
        queryFn: () => fetchAttractionDetail(selectedId),
      });
    }
  }, [selectedId, queryClient]);

  const openDetail = useCallback(
    (a: Attraction) => router.push(`/attraction/${a.content_id}`),
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Attraction }) => (
      <AttractionListItem
        attraction={item}
        selected={item.content_id === selectedId}
        visitCount={stampMap.get(item.content_id)}
        onPress={focusAttraction}
        onExplore={openDetail}
      />
    ),
    [selectedId, stampMap, focusAttraction, openDetail],
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
          minZoom={6}
          maxZoom={18}
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
          clusters={[
            {
              markers: clusterMarkers,
              screenDistance: 70,
              animate: true,
              width: 40,
              height: 40,
              maxZoom: 13, //클러스트 묶음 범위
            },
          ]}
          onTapClusterLeaf={({ markerIdentifier }) => {
            const target = attractions.find(
              (a) => a.content_id === markerIdentifier,
            );
            if (target) focusAttraction(target);
          }}
        />
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
        keyboardBehavior="interactive"
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <FlashList
          ref={listRef}
          style={styles.list}
          data={listData}
          keyExtractor={(item) => item.content_id}
          estimatedItemSize={110}
          ListHeaderComponent={
            <View style={styles.sheetHead}>
              <View style={styles.sheetHeaderLeft}>
                <View style={styles.sheetIconWrapper}>
                  <SymbolView
                    name="map.fill"
                    size={16}
                    tintColor={colors.accent}
                    type="hierarchical"
                  />
                </View>
                <Text style={styles.sheetEyebrow}>주변 탐험지</Text>
              </View>
              <View style={styles.sheetCountRow}>
                <Text style={styles.sheetCount}>{listData.length}</Text>
                <Text style={styles.sheetOf}>곳</Text>
              </View>
            </View>
          }
          renderItem={renderItem}
          contentContainerStyle={{
            paddingBottom: LIST_BOTTOM_PADDING + insets.bottom,
          }}
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
  sheetBackground: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  sheetHandle: {
    backgroundColor: "#E0DCD6",
    width: 44,
    height: 5,
    borderRadius: 999,
    marginTop: spacing.xs,
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    marginBottom: spacing.xs,
  },
  sheetHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sheetIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetEyebrow: {
    ...typography.body,
    fontWeight: "700",
    color: colors.ink,
  },
  sheetCountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  sheetCount: {
    fontFamily: fontMono,
    fontSize: 22,
    fontWeight: "900",
    color: colors.accent,
  },
  sheetOf: {
    ...typography.meta,
    color: colors.muted,
  },
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
