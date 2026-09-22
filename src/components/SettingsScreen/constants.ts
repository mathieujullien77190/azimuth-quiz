import Constants from 'expo-constants';

// Version affichee dans "A propos" : lue depuis app.json (source commune avec package.json),
// donc toujours a jour sans jamais avoir a la dupliquer/mettre a jour ici a la main.
export const APP_VERSION = `v${Constants.expoConfig?.version ?? '0.0.0'}`;
