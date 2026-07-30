import { API_URL } from "@/constants/config";
import { queryClient } from "@/lib/query-client";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";

export const GEOFENCE_TASK_NAME = "onttang-geofence-stamp-task";

// use-auth-store.ts의 TOKEN_KEY와 동일한 값. 이 파일은 React 트리 밖(백그라운드)에서
// 실행돼 zustand 스토어에 접근할 수 없어서, SecureStore 키를 직접 참조한다.
const TOKEN_KEY = "token";

// TaskManager.defineTask는 반드시 모듈 최상위(컴포넌트 밖)에서, 앱이 시작될 때
// 한 번은 실행되도록 import돼야 한다 — 그래야 앱이 종료된 상태에서도
// OS가 이 태스크 이름으로 앱을 깨워 콜백을 실행할 수 있다.
TaskManager.defineTask(GEOFENCE_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.warn("[geofence] 태스크 에러", error);
    return;
  }

  const { eventType, region } = data as {
    eventType: Location.GeofencingEventType;
    region: Location.LocationRegion;
  };

  if (eventType !== Location.GeofencingEventType.Enter) return;

  const contentId = region.identifier;
  if (!contentId) return;

  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) return; // 로그아웃 상태 — 스탬프 찍을 계정이 없음

  // 지금 이 순간의 정확한 위치를 다시 얻으면 배터리·시간을 더 쓰므로,
  // 이미 알고 있는 최근 위치(OS가 geofence 판정에 쓴 값과 사실상 동일)를 재사용.
  const lastKnown = await Location.getLastKnownPositionAsync();
  const lat = lastKnown?.coords.latitude ?? region.latitude;
  const lng = lastKnown?.coords.longitude ?? region.longitude;

  try {
    const res = await fetch(`${API_URL}/stamps`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content_id: contentId, lat, lng }),
    });

    if (!res.ok) return; // 반경 밖(오차)·만료 토큰 등 — 조용히 무시, 다음 진입 때 재시도됨

    const stamp = await res.json();
    // counted=false는 재방문 쿨다운 중(서버가 이미 카운트한 최근 방문) — 같은 자리에
    // 머무는 동안 geofence가 재등록될 때마다 알림이 반복 발송되는 것을 막는다.
    if (!stamp.counted) return;

    queryClient.invalidateQueries({ queryKey: ["my-stamps"] });
    queryClient.invalidateQueries({ queryKey: ["my-stats"] });
    queryClient.invalidateQueries({ queryKey: ["rankings"] });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "새로운 영토를 발견했어요 🚩",
        body:
          stamp.visit_count === 1
            ? `${stamp.title}에서 자동으로 스탬프가 찍혔어요!`
            : `${stamp.title}, 벌써 ${stamp.visit_count}번째 방문이에요!`,
      },
      trigger: null, // 즉시 발송
    });
  } catch (e) {
    console.warn("[geofence] 자동 스탬프 요청 실패", e);
  }
});
