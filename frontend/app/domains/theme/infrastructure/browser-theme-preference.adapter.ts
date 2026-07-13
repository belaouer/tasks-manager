import {
  DEFAULT_THEME_MODE,
  isThemeMode,
  type ThemeMode
} from '../domain/theme-mode';
import { ThemePreferencePort } from '../domain/theme-preference.port';

const STORAGE_KEY = 'tasks-manager.theme';

export class BrowserThemePreferenceAdapter extends ThemePreferencePort {
  read(): ThemeMode | null {
    if (!import.meta.client) {
      return null;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_THEME_MODE;
    }

    return isThemeMode(stored) ? stored : DEFAULT_THEME_MODE;
  }

  write(mode: ThemeMode): void {
    if (!import.meta.client) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, mode);
  }
}
