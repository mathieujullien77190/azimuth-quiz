import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// Recette standard react-native-web + Vite : les fichiers suffixes par plateforme (`.web.js`/`.web.tsx`) doivent
// passer avant leurs equivalents plain/`.native`, et `react-native` est un alias de `react-native-web`, pour que tout
// `from 'react-native'` de `src/components/**` marche sans Metro. Partagee entre `vite.config.ts` et
// `.storybook/main.ts`.
export const WEB_FIRST_EXTENSIONS = [
  '.web.tsx',
  '.web.ts',
  '.web.jsx',
  '.web.js',
  '.tsx',
  '.ts',
  '.jsx',
  '.js',
  '.mjs',
  '.json',
];

export const dedupePackages = [
  'react',
  'react-dom',
  'react-native-web',
  'react-native-svg',
  'react-native-safe-area-context',
  'expo-location',
  'expo-localization',
  // Surface OpenGL du globe 3D (`Globe3D`) : son build `.web` est un canvas simple, les stories dessinent le vrai
  // globe dans le navigateur.
  'expo-gl',
  // La lib 3D de la page Monde : une seule copie, quel que soit le dossier qui l'importe.
  'three',
  '@react-native-async-storage/async-storage',
];

export const optimizeDepsInclude = [
  'react-native-web',
  'react-native-svg',
  'expo-location',
  'expo-localization',
  'expo-gl',
  '@react-native-async-storage/async-storage',
];

export const sharedResolve = {
  alias: {
    '@': path.resolve(rootDir, '../src'),
    '~sb': path.resolve(rootDir, '.storybook/utils'),
    'react-native': 'react-native-web',
  },
  extensions: WEB_FIRST_EXTENSIONS,
  // `@/components/**` (src/ racine, resolu vers le node_modules racine) et les fichiers de l'admin (resolus vers
  // `admin/node_modules/*`) auraient chacun leur PROPRE copie de chaque paquet ci-dessous. Deux copies d'un meme
  // paquet (ex. safe-area-context) creent chacune leur `createContext(...)` : le Provider d'une ne correspond pas au
  // Consumer de l'autre et `useSafeAreaInsets()` jette "No safe area value available". `dedupe` force une seule copie
  // par paquet.
  dedupe: dedupePackages,
};

export const sharedDefine = (command: 'build' | 'serve') => ({
  // Le source de react-native/react-native-web lit ce global (Metro l'injecte) ; Vite non : sans ca, tout composant
  // RN plante au premier `__DEV__`.
  __DEV__: JSON.stringify(command !== 'build'),
  // react-native-web lui-meme a besoin de `global` (style Node) dans le navigateur.
  global: 'globalThis',
  // expo-modules-core (Platform.ts) et le HMR d'expo lisent `process.env.EXPO_OS`, normalement inline par Metro. Doit
  // etre le litteral 'web' (pas seulement defini) : `setup()` de expo/src/async-require/hmr.ts teste `=== 'web'` pour
  // choisir son chemin navigateur, l'autre attendant des params natifs (`platform`/`bundleEntry`/`host`) absents ici.
  'process.env.EXPO_OS': JSON.stringify('web'),
  'process.env': '{}',
});

export const sharedOptimizeDeps = {
  esbuildOptions: { resolveExtensions: WEB_FIRST_EXTENSIONS },
  // Pre-bundles d'emblee plutot que decouverts a la volee : touches des le premier rendu des stories, et la
  // resolution d'extensions d'esbuild pendant le scan est instable.
  include: optimizeDepsInclude,
};
