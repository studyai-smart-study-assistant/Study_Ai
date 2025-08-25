
import { englishTranslations } from './en';
import { hindiTranslations } from './hi';
import { TranslationsRecord, Language } from '../types/translation-types';

export const translations: TranslationsRecord = {
  en: englishTranslations,
  hi: hindiTranslations
};

export type { Language, TranslationKeys } from '../types/translation-types';
