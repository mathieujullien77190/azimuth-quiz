import Constants from 'expo-constants';

import { versionLabel, type Codename } from '@/helpers/version';

// Version shown in "About": read from app.json (shared source with package.json),
// (with the animal the version is named after, see the `push` skill), so always up to date without ever having to duplicate/update it here by hand.
export const APP_VERSION = versionLabel(
  Constants.expoConfig?.version ?? '0.0.0',
  Constants.expoConfig?.extra?.codename as Codename | undefined,
);
