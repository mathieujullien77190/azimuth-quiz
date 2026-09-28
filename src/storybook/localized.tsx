import type { Decorator } from '@storybook/react-vite';

import type { Language, Translations } from '@/i18n';
import { translations } from '@/i18n/translations';

/**
 * Story `args` that carry text ("Difficulté", "Jouer"...) are computed once, when the file loads —
 * so they can't follow the toolbar's language on their own. This decorator rebuilds them from the
 * current language on every render: give it the same `build` function that produced the story's
 * initial `args` (with `translations.fr`). `build` also receives the story's current args, to
 * re-text something nested without losing its handlers (a list of options, say), and the language code
 * (for what depends on it beyond the texts: country names on a board...).
 *
 * ```tsx
 * const args = (t: Translations) => ({ title: t.setup.difficultyTitle });
 * export const Default = { args: args(translations.fr), decorators: [localizedArgs(args)] };
 * ```
 */
export const localizedArgs = (
  build: (t: Translations, args: Record<string, unknown>, language: Language) => Record<string, unknown>,
): Decorator => {
  const LocalizedArgs: Decorator = (Story, context) => {
    const language: Language = context.globals.locale === 'en' ? 'en' : 'fr';
    const args = context.args as Record<string, unknown>;
    return <Story args={{ ...context.args, ...build(translations[language], args, language) }} />;
  };
  return LocalizedArgs;
};
