import { defaultFont } from 'src/theme/core/typography';

import type { SettingsState } from './types';

// ----------------------------------------------------------------------

export const STORAGE_KEY = 'app-settings';

export const defaultSettings: SettingsState = {
  colorScheme: 'dark',
  direction: 'ltr',
  contrast: 'default',
  navLayout: 'mini',
  primaryColor: 'cyan',
  navColor: 'apparent',
  compactLayout: true,
  fontFamily: defaultFont,
} as const;
