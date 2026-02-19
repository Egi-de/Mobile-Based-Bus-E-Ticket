import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme as darkTheme, lightTheme, Theme } from '../config/theme';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  theme: Theme;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark', // Default to dark as per original design
      theme: darkTheme as Theme,
      toggleTheme: () =>
        set((state) => {
          const newMode = state.mode === 'light' ? 'dark' : 'light';
          return {
            mode: newMode,
            theme: (newMode === 'light' ? lightTheme : darkTheme) as Theme,
          };
        }),
      setMode: (mode) =>
        set(() => ({
          mode,
          theme: (mode === 'light' ? lightTheme : darkTheme) as Theme,
        })),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
