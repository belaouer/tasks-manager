import type { ThemeMode } from '../domain/theme-mode';
import { ThemeDocumentPort } from '../domain/theme-document.port';

export class BrowserThemeDocumentAdapter extends ThemeDocumentPort {
  apply(mode: ThemeMode): void {
    if (!import.meta.client) {
      return;
    }

    const root = window.document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(mode);
  }
}
