import { colors } from "@/constants/theme";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <NativeTabs
      // 흰 배경은 Android에만 (iOS는 기본 블러 유지)
      backgroundColor={Platform.select({ android: colors.white })}
      tintColor={colors.accent} // 선택된 탭(아이콘·라벨)
      iconColor={colors.muted} // 미선택 아이콘
      indicatorColor={colors.accentSoft} // Android 선택 인디케이터(연한 accent)
      rippleColor={colors.accentSoft} // Android 터치 리플
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="map.fill" md="map" />
        <NativeTabs.Trigger.Label>탐험</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="territory">
        <NativeTabs.Trigger.Icon sf="flag.fill" md="flag" />
        <NativeTabs.Trigger.Label>내 영토</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
