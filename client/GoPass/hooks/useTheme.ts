import { useThemeStore } from '../stores/theme.store';

export const useTheme = () => {
  const { theme, mode, toggleTheme, setMode } = useThemeStore();
  
  return {
    theme,
    mode,
    toggleTheme,
    setMode,
    colors: theme.colors,
    isDark: mode === 'dark',
  };
};
