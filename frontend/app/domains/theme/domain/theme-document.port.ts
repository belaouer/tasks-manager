import type { ThemeMode } from './theme-mode';

export abstract class ThemeDocumentPort {
  abstract apply(mode: ThemeMode): void;
}
