import type { Language, Translations } from '@/i18n/types';
import { en } from './en';
import { fr } from './fr';

export const translations: Record<Language, Translations> = { fr, en };
