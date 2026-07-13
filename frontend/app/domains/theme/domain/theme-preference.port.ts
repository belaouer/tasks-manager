import type { ThemeMode } from './theme-mode';

export abstract class ThemePreferencePort {
  abstract read(): ThemeMode | null;

  abstract write(mode: ThemeMode): void;
}
