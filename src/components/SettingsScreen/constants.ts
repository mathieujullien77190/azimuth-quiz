import Constants from 'expo-constants';

// Version shown in "About": read from app.json (shared source with package.json),
// so always up to date without ever having to duplicate/update it here by hand.
export const APP_VERSION = `v${Constants.expoConfig?.version ?? '0.0.0'}`;
