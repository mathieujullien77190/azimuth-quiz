import appConfig from '../../app.json';

import type { Codename } from './version';

// Lu depuis app.json importe comme module, pas `expo-constants` : le bundler suit le fichier, alors que
// `Constants.expoConfig` garde ce que le serveur de dev a lu au demarrage. Le meme fichier alimente l'admin.
export const APP_VERSION_NUMBER: string = appConfig.expo.version;
export const APP_CODENAME: Codename | undefined = appConfig.expo.extra.codename;
