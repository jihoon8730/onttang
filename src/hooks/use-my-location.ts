import { NaverMapViewRef } from "@mj-studio/react-native-naver-map";
import * as Location from "expo-location";
import { RefObject, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

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

  // 화면 떠날 때 위치·방향 구독 정리 (배터리 절약)
  useEffect(() => {
    return () => {
      locationSub.current?.remove();
      headingSub.current?.remove();
    };
  }, []);

  // 권한 요청 → 현재 위치로 카메라 이동 → 이후 이동을 실시간 추적
  const showMyLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      // Android: 위치 서비스가 꺼져 있으면 시스템에 켜달라고 요청
      if (Platform.OS === "android") {
        await Location.enableNetworkProviderAsync();
      }

      const loc = await Location.getCurrentPositionAsync();
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setMyLocation(coords);
      mapRef.current?.animateCameraTo({ ...coords, zoom: 15 });

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

  return { myLocation, heading, showMyLocation };
}
