import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// Standard react-native-web + Vite recipe (react-native-web itself has no official Vite guide,
// this mirrors the community-documented setup): platform-suffixed files (`.web.js`/`.web.tsx`,
// shipped by react-native-web, react-native-svg, expo-location, expo-localization and
// @react-native-async-storage/async-storage's *own* packages — see ComponentGalleryView's own
// doc comment for why those specific packages) must resolve before their plain/`.native`
// counterparts, and `react-native` itself aliases straight to `react-native-web` so every
// `from 'react-native'` import in `src/components/**` resolves without needing Metro at all.
//
// Shared between `vite.config.ts` (the admin app itself) and `.storybook/main.ts`'s
// `viteFinal` (Storybook's own Vite builder) — both need the exact same react-native-web
// resolution recipe, so it lives here once instead of twice.
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
  // The 3D globe's OpenGL surface (`Globe3D`): its own `.web` build is a plain canvas, so the stories draw the real
  // thing in the browser.
  'expo-gl',
  // The Monde page's 3D library: one copy, whichever folder imports it.
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
  alias: { '@': path.resolve(rootDir, '../src'), 'react-native': 'react-native-web' },
  extensions: WEB_FIRST_EXTENSIONS,
  // `@/components/**` (root `src/`, resolved to root `node_modules/*` — it's outside `admin/`)
  // and admin's own files (resolved to `admin/node_modules/*`) would otherwise each get their
  // OWN separate copy of every package below, since Vite/Node resolve a bare specifier relative
  // to the IMPORTING file's own ancestor directories, not a single shared root. Two copies of
  // `react` breaks hooks outright; two copies of `react-native-safe-area-context` is subtler —
  // `SafeAreaProvider` (mounted from an admin file) and `SafeAreaView` (mounted from `ui/Screen`,
  // a root file) each create their own `createContext(...)`, so the Provider's copy never
  // matches the Consumer's, and `useSafeAreaInsets()` throws "No safe area value available"
  // even though a `<SafeAreaProvider>` is very much rendered above it. `dedupe` forces every
  // matching package to resolve to the single copy Vite finds from its own project root
  // (`admin/`), for every importer regardless of which `src/` tree it physically lives in.
  dedupe: dedupePackages,
};

export const sharedDefine = (command: 'build' | 'serve') => ({
  // react-native/react-native-web source reads this global directly (Metro normally injects
  // it); Vite doesn't, so without this every RN component would crash on the first `__DEV__`
  // check.
  __DEV__: JSON.stringify(command !== 'build'),
  // react-native-web itself needs `global` (Node-style) defined in the browser.
  global: 'globalThis',
  // expo-modules-core (Platform.ts) and expo's own HMR setup branch on `process.env.EXPO_OS`;
  // Metro/babel-preset-expo normally inlines it to the target platform. Must be the literal
  // `'web'` (not just defined) — expo/src/async-require/hmr.ts's `setup()` checks
  // `=== 'web'` to pick its browser code path vs. the Metro-native one, which expects
  // native-only params (`platform`/`bundleEntry`/`host`) we don't have here.
  'process.env.EXPO_OS': JSON.stringify('web'),
  'process.env': '{}',
});

export const sharedOptimizeDeps = {
  esbuildOptions: { resolveExtensions: WEB_FIRST_EXTENSIONS },
  // Pre-bundled eagerly rather than discovered lazily: these are hit from the very first
  // paint of the component gallery/Storybook stories, and esbuild's extension resolution
  // during dependency scanning is otherwise flaky.
  include: optimizeDepsInclude,
};
