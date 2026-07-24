import { useAuthStore } from "@/stores/use-auth-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // 기본 3회 대신 1회만 재시도
      retryDelay: 300, // 기본(첫 재시도 전 약 1000ms) 대신 300ms로 단축
    },
  },
});

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate(); // 앱 시작 시 저장된 로그인 상태 복원
  }, [hydrate]);

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
          <Stack.Screen name="login" options={{ presentation: "modal" }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
