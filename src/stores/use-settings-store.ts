import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const BACKGROUND_STAMPS_KEY = "background_stamps_enabled";
const BANNER_DISMISSED_KEY = "auto_stamp_banner_dismissed";

type SettingsState = {
  backgroundStampsEnabled: boolean;
  autoStampBannerDismissed: boolean;
  hydrated: boolean;
  setBackgroundStampsEnabled: (enabled: boolean) => Promise<void>;
  dismissAutoStampBanner: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  backgroundStampsEnabled: false,
  autoStampBannerDismissed: false,
  hydrated: false,
  setBackgroundStampsEnabled: async (enabled) => {
    await SecureStore.setItemAsync(BACKGROUND_STAMPS_KEY, String(enabled));
    set({ backgroundStampsEnabled: enabled });
  },
  dismissAutoStampBanner: async () => {
    await SecureStore.setItemAsync(BANNER_DISMISSED_KEY, "true");
    set({ autoStampBannerDismissed: true });
  },
  hydrate: async () => {
    const [enabled, bannerDismissed] = await Promise.all([
      SecureStore.getItemAsync(BACKGROUND_STAMPS_KEY),
      SecureStore.getItemAsync(BANNER_DISMISSED_KEY),
    ]);
    set({
      backgroundStampsEnabled: enabled === "true",
      autoStampBannerDismissed: bannerDismissed === "true",
      hydrated: true,
    });
  },
}));
