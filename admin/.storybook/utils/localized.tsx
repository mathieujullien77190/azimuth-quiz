import type { Decorator } from '@storybook/react-vite';

import type { Language, Translations } from '@/i18n';
import { translations } from '@/i18n/translations';

/**
 * Les `args` de story qui portent du texte sont calcules au chargement et ne suivent pas la langue de la barre d'outils :
 * ce decorateur les reconstruit a chaque rendu avec la meme fonction `build` (args courants et code de langue en parametres).
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
