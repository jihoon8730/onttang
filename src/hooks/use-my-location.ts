import { NaverMapViewRef } from "@mj-studio/react-native-naver-map";
import * as Location from "expo-location";
import { RefObject, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

type Coords = { latitude: number; longitude: number };

// 나침반 갱신 최소 간격(ms)·최소 각도 변화(deg) — 지하철·버스 등 고속 이동 시
// 센서가 초당 수십 번씩 값을 쏴서 리렌더가 폭주하는 것을 막는 수동 스로틀.
const HEADING_MIN_INTERVAL_MS = 200;
const HEADING_MIN_DELTA_DEG = 3;

// 내 위치: 현재 좌표 가져오기 + 실시간 추적 + 나침반 방향(화살표 회전).
export function useMyLocation(mapRef: RefObject<NaverMapViewRef | null>) {
  const [myLocation, setMyLocation] = useState<Coords | null>(null);
  const [heading, setHeading] = useState(0);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const headingSub = useRef<Location.LocationSubscription | null>(null);
  const lastHeadingAt = useRef(0);
  const lastHeadingValue = useRef(0);

  // 권한 요청(명시적 탭) 또는 이미 허용된 경우만 조용히 확인(자동 재개) → 위치 추적 시작.
  // moveCamera=true일 때만 카메라를 이동 — 조용히 재개할 땐 지도 시점은 그대로 둠.
  const locate = async (moveCamera: boolean) => {
    try {
      const { status } = moveCamera
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();
      if (status !== "granted") return;

      // Android: 위치 서비스가 꺼져 있으면 시스템에 켜달라고 요청 (명시적 액션에서만)
      if (moveCamera && Platform.OS === "android") {
        await Location.enableNetworkProviderAsync();
      }

      const loc = await Location.getCurrentPositionAsync();
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setMyLocation(coords);
      if (moveCamera) {
        mapRef.current?.animateCameraTo({ ...coords, zoom: 15 });
      }

      // 재개 시 기존 구독이 남아있으면 중복 등록되지 않도록 먼저 정리
      locationSub.current?.remove();
      headingSub.current?.remove();

      // 연속 추적은 Balanced로 (High는 지하철·버스 등 고속 이동 시 GPS를 과도하게
      // 자주 재측위해 연산 부담↑ → 끊김의 한 원인). distanceInterval도 1m→8m로 완화하고
      // Android는 timeInterval(ms)로 한 번 더 상한을 둠 — 걷기 땐 충분히 부드럽고
      // 차량 속도에서 리렌더가 폭주하지 않도록.
      locationSub.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 8,
          timeInterval: 1000,
        },
        (loc) => {
          setMyLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        },
      );

      // 나침반 방향 추적 (trueHeading 미지원 기기는 magHeading으로 대체).
      // 센서 원본은 매우 잦게 들어오므로, 최소 간격·최소 변화량 미만이면 무시.
      headingSub.current = await Location.watchHeadingAsync((data) => {
        const value = data.trueHeading >= 0 ? data.trueHeading : data.magHeading;
        const now = Date.now();
        if (
          now - lastHeadingAt.current < HEADING_MIN_INTERVAL_MS &&
          Math.abs(value - lastHeadingValue.current) < HEADING_MIN_DELTA_DEG
        ) {
          return;
        }
        lastHeadingAt.current = now;
        lastHeadingValue.current = value;
        setHeading(value);
      });
    } catch (e) {
      // 위치 서비스 꺼짐/거부 등 — 크래시 대신 조용히 무시
      console.warn("내 위치를 가져오지 못했어요", e);
    }
  };

  // 버튼 탭 — 권한 없으면 요청 팝업을 띄우고, 카메라도 내 위치로 이동
  const showMyLocation = () => locate(true);

  // 오래 백그라운드에 있다가 돌아오면(특히 iOS가 메모리 회수로 앱을 재기동한 경우)
  // 위치 추적 구독이 끊긴 채라 "내 위치" 점이 사라져 보임 — 포그라운드 복귀 시
  // 이미 권한이 있으면(팝업 없이) 조용히 재개. 카메라는 옮기지 않음.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") locate(false);
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 화면 떠날 때 위치·방향 구독 정리 (배터리 절약)
  useEffect(() => {
    return () => {
      locationSub.current?.remove();
      headingSub.current?.remove();
    };
  }, []);

  return { myLocation, heading, showMyLocation };
}
