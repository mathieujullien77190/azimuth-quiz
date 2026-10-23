// Le suffixe `?raw` de Vite importe le texte d'un fichier (Storybook seul, voir `source.ts`).
declare module '*.md?raw' {
  const content: string;
  export default content;
}
