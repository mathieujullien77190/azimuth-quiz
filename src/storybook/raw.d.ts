// Vite's `?raw` suffix imports a file's text (Storybook only — see `source.ts`).
declare module '*.md?raw' {
  const content: string;
  export default content;
}
