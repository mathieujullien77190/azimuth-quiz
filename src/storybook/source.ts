/**
 * Storybook's "Show code" for a story: the snippet a consumer of the component would actually write
 * (imports from `@/…`, real wiring), instead of the JSX Storybook rebuilds from the story's `args`.
 *
 * The snippet lives in `<Story>.source.md` next to the story file, in a ```tsx fence, and is
 * imported with `?raw` — no backtick or `${` to escape. Put `source()` on the *story*, never on the
 * `meta`: the CSF plugin adds its own `parameters` key to a meta that carries a doc comment, and the
 * duplicate key wins there.
 */
export const source = (markdown: string) => ({
  docs: {
    source: {
      code: markdown.replace(/^\s*```tsx\s*\n/, '').replace(/\n```\s*$/, ''),
      language: 'tsx',
    },
  },
});
