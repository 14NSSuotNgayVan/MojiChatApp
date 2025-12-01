import type { ThemeState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,
      toggleTheme: () => {
        const isDark = !get().isDark;
        if (isDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        set({ isDark });
      },
      setTheme: (isDark) => {
        if (isDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        set({ isDark });
      },
    }),
    { name: "theme-storage" }
  )
);
