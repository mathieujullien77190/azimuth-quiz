/**
 * "Show code" de Storybook : le snippet qu'un consommateur ecrirait vraiment, au lieu du JSX reconstruit des `args`.
 * Il vit dans `<Story>.source.md` (bloc ```tsx), importe en `?raw`. A poser sur la *story*, jamais sur le `meta` :
 * le plugin CSF y ajoute sa cle `parameters` et la cle en double gagne.
 */
export const source = (markdown: string) => ({
  docs: {
    source: {
      code: markdown.replace(/^\s*```tsx\s*\n/, '').replace(/\n```\s*$/, ''),
      language: 'tsx',
    },
  },
});
