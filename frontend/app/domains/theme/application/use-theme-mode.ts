import { computed } from 'vue';
import {
  DEFAULT_THEME_MODE,
  type ThemeMode
} from '../domain/theme-mode';
import { BrowserThemeDocumentAdapter } from '../infrastructure/browser-theme-document.adapter';
import { BrowserThemePreferenceAdapter } from '../infrastructure/browser-theme-preference.adapter';

const THEME_STATE_KEY = 'tasks-manager.theme-state';

const preferenceAdapter = new BrowserThemePreferenceAdapter();
const documentAdapter = new BrowserThemeDocumentAdapter();

export function useThemeMode() {
  const mode = useState<ThemeMode>(THEME_STATE_KEY, () => DEFAULT_THEME_MODE);

  function apply(nextMode: ThemeMode): void {
    mode.value = nextMode;
    documentAdapter.apply(nextMode);
    preferenceAdapter.write(nextMode);
  }

  function initialize(): void {
    const preferred = preferenceAdapter.read() ?? DEFAULT_THEME_MODE;
    mode.value = preferred;
    documentAdapter.apply(preferred);
  }

  function toggle(): void {
    apply(mode.value === 'dark' ? 'light' : 'dark');
  }

  return {
    mode: computed(() => mode.value),
    isDarkMode: computed(() => mode.value === 'dark'),
    initialize,
    toggle,
    apply
  };
}
