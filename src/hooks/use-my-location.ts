import { NaverMapViewRef } from "@mj-studio/react-native-naver-map";
import * as Location from "expo-location";
import { RefObject, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

type Coords = { latitude: number; longitude: number };

// 내 위치: 현재 좌표 가져오기 + 실시간 추적 + 표식 맥동 애니메이션.
export function useMyLocation(mapRef: RefObject<NaverMapViewRef | null>) {
  const [myLocation, setMyLocation] = useState<Coords | null>(null);
  const [pulseRadius, setPulseRadius] = useState(20);
  const locationSub = useRef<Location.LocationSubscription | null>(null);

  // 화면 떠날 때 위치 구독 정리 (배터리 절약)
  useEffect(() => {
    return () => {
      locationSub.current?.remove();
    };
  }, []);

  // 내 위치 표식 맥동 애니메이션 (원 반지름 5↔20 왕복)
  useEffect(() => {
    const id = setInterval(() => {
      setPulseRadius((r) => (r >= 20 ? 5 : r + 1));
    }, 60);
    return () => clearInterval(id);
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

      locationSub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 1 },
        (loc) => {
          setMyLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        },
      );
    } catch (e) {
      // 위치 서비스 꺼짐/거부 등 — 크래시 대신 조용히 무시
      console.warn("내 위치를 가져오지 못했어요", e);
    }
  };

  return { myLocation, pulseRadius, showMyLocation };
}
