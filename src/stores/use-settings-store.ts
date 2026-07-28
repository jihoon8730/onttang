import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const BACKGROUND_STAMPS_KEY = "background_stamps_enabled";

type SettingsState = {
  backgroundStampsEnabled: boolean;
  hydrated: boolean;
  setBackgroundStampsEnabled: (enabled: boolean) => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  backgroundStampsEnabled: false,
  hydrated: false,
  setBackgroundStampsEnabled: async (enabled) => {
    await SecureStore.setItemAsync(BACKGROUND_STAMPS_KEY, String(enabled));
    set({ backgroundStampsEnabled: enabled });
  },
  hydrate: async () => {
    const saved = await SecureStore.getItemAsync(BACKGROUND_STAMPS_KEY);
    set({ backgroundStampsEnabled: saved === "true", hydrated: true });
  },
}));
