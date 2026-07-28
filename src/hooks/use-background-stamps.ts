import { STAMP_RADIUS_M } from "@/constants/config";
import { fetchNearbyAttractions } from "@/lib/api";
import { useAuthStore } from "@/stores/use-auth-store";
import { useSettingsStore } from "@/stores/use-settings-store";
import { GEOFENCE_TASK_NAME } from "@/tasks/geofence-stamp-task";
import * as Location from "expo-location";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

// 감시 목록을 다시 계산하는 최소 간격 — 앱을 포그라운드로 열 때마다 매번
// 서버를 부르지 않도록(배터리·서버 부하 절약).
const REFRESH_MIN_INTERVAL_MS = 10 * 60 * 1000; // 10분

// 로그인 + "더보기"에서 사용자가 직접 켠 경우에만 백그라운드 자동 스탬프를 켠다.
// 권한(위치 항상 허용·알림)은 더보기 화면에서 토글을 켤 때 이미 다 받았으므로,
// 여기서는 그 상태를 확인만 하고 다시 요청 팝업을 띄우지 않는다.
export function useBackgroundStamps() {
  const token = useAuthStore((s) => s.token);
  const enabled = useSettingsStore((s) => s.backgroundStampsEnabled);
  const lastRefreshAt = useRef(0);

  useEffect(() => {
    if (!token || !enabled) {
      lastRefreshAt.current = 0; // 다음에 다시 켤 때 최소 간격 제한 없이 즉시 재등록되도록
      Location.hasStartedGeofencingAsync(GEOFENCE_TASK_NAME).then(
        (started) => {
          if (started) Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
        },
      );
      return;
    }

    const refreshGeofences = async () => {
      const now = Date.now();
      if (now - lastRefreshAt.current < REFRESH_MIN_INTERVAL_MS) return;

      const { status: fgStatus } =
        await Location.getForegroundPermissionsAsync();
      if (fgStatus !== "granted") return;

      const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
      if (bgStatus !== "granted") return; // "항상 허용" 아니면 기능을 켜지 않음

      try {
        // GPS를 절대 직접 켜지 않는다 — 캐시된 위치(다른 화면의 위치 추적이
        // 이미 채워놨을 값)만 쓰고, 캐시가 없으면 이번엔 그냥 건너뛰고
        // 다음 갱신 기회(10분 후 또는 다음 포그라운드)에 다시 시도한다.
        // 여기서 새 GPS 요청을 하면 지도 화면 등 다른 곳의 위치 요청과
        // 겹쳐서 그쪽 응답까지 같이 늦어지는 문제가 있었다.
        const cached = await Location.getLastKnownPositionAsync();
        if (!cached) return;
        const { coords } = cached;

        const nearby = await fetchNearbyAttractions(
          coords.latitude,
          coords.longitude,
        );
        if (nearby.length === 0) return;

        await Location.startGeofencingAsync(
          GEOFENCE_TASK_NAME,
          nearby.map((a) => ({
            identifier: a.content_id,
            latitude: a.latitude,
            longitude: a.longitude,
            radius: STAMP_RADIUS_M,
            notifyOnEnter: true,
            notifyOnExit: false,
          })),
        );
        lastRefreshAt.current = now;
      } catch (e) {
        console.warn("[geofence] 감시 목록 갱신 실패", e);
      }
    };

    refreshGeofences(); // 로그인 직후 1회 시도

    // 앱을 다시 열 때마다(백그라운드→포그라운드) 위치가 많이 바뀌었을 수 있으니 재시도
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshGeofences();
    });
    return () => sub.remove();
  }, [token, enabled]);
}
