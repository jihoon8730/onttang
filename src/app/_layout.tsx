// 반드시 다른 어떤 import보다도 먼저 평가돼야 한다 — TaskManager.defineTask는
// 앱이 시작될 때 즉시 실행돼야 네이티브 쪽이 이 태스크 이름을 인식한다.
// (use-background-stamps를 통한 간접 import에만 의존하면 등록 타이밍이
// 어긋나 "Task not found for app ID" 에러가 날 수 있음)
import "@/tasks/geofence-stamp-task";

import { useBackgroundStamps } from "@/hooks/use-background-stamps";
import { queryClient } from "@/lib/query-client";
import { useAuthStore } from "@/stores/use-auth-store";
import { useSettingsStore } from "@/stores/use-settings-store";
import { focusManager, QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// 자동 스탬프 알림이 앱을 켜둔 동안(포그라운드)에도 배너로 뜨도록.
// (기본값은 포그라운드에서 알림을 숨김 — 이 핸들러가 없으면 조용히 넘어감)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

AppState.addEventListener("change", (state) => {
  focusManager.setFocused(state === "active");
});

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);

  useEffect(() => {
    hydrate(); // 앱 시작 시 저장된 로그인 상태 복원
    hydrateSettings(); // 백그라운드 자동 스탬프 on/off 저장값 복원
  }, [hydrate, hydrateSettings]);

  useBackgroundStamps(); // 로그인 + 설정 on 상태면 백그라운드 자동 스탬프 geofence 관리

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="attraction/[id]" />
          <Stack.Screen name="search" />
          <Stack.Screen
            name="legal"
            options={{
              headerShown: true,
              title: "약관 및 정책",
              headerBackTitle: "더보기",
            }}
          />
          <Stack.Screen
            name="coupon-box"
            options={{
              headerShown: true,
              title: "스탬프 이벤트",
              headerBackTitle: "더보기",
            }}
          />
          <Stack.Screen
            name="my-coupons"
            options={{
              headerShown: true,
              title: "내 쿠폰함",
              headerBackTitle: "더보기",
            }}
          />
          <Stack.Screen
            name="missions"
            options={{
              headerShown: true,
              title: "주변 미션",
              headerBackTitle: "탐험",
            }}
          />
          <Stack.Screen name="login" options={{ presentation: "modal" }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
