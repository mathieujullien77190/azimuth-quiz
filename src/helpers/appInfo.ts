import appConfig from '../../app.json';

import type { Codename } from './version';

// The version and its animal are read from app.json itself, imported as a module, not from `expo-constants`: the bundler
// follows the file, so a change of version shows at once, where `Constants.expoConfig` keeps what the dev server read
// when it started (the About line and the splash showed an old version without its animal until it was restarted).
// The same file feeds the admin's header, `package.json` is kept in step by the `push` skill.
export const APP_VERSION_NUMBER: string = appConfig.expo.version;
export const APP_CODENAME: Codename | undefined = appConfig.expo.extra.codename;
