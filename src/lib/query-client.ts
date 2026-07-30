import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // 기본 3회 대신 1회만 재시도
      retryDelay: 300, // 기본(첫 재시도 전 약 1000ms) 대신 300ms로 단축
    },
  },
});
