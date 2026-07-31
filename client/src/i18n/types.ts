import { fr } from './locales/fr';

/**
 * Contrat de traduction.
 *
 * Le français fait référence : toute autre langue doit fournir exactement les
 * mêmes clés, avec les mêmes signatures de fonctions. TypeScript refuse de
 * compiler si une traduction est incomplète ou mal typée — c'est le garde-fou
 * qui rend tenable la maintenance de 24 langues.
 */
export type Messages = typeof fr;

/** Les 24 langues officielles de l'Union européenne. */
export const LOCALES = [
  'bg', // български
  'cs', // čeština
  'da', // dansk
  'de', // Deutsch
  'el', // ελληνικά
  'en', // English
  'es', // español
  'et', // eesti
  'fi', // suomi
  'fr', // français
  'ga', // Gaeilge
  'hr', // hrvatski
  'hu', // magyar
  'it', // italiano
  'lt', // lietuvių
  'lv', // latviešu
  'mt', // Malti
  'nl', // Nederlands
  'pl', // polski
  'pt', // português
  'ro', // română
  'sk', // slovenčina
  'sl', // slovenščina
  'sv', // svenska
] as const;

export type Locale = (typeof LOCALES)[number];

/** Nom de chaque langue, écrit dans cette langue (endonyme). */
export const LOCALE_NAMES: Record<Locale, string> = {
  bg: 'Български',
  cs: 'Čeština',
  da: 'Dansk',
  de: 'Deutsch',
  el: 'Ελληνικά',
  en: 'English',
  es: 'Español',
  et: 'Eesti',
  fi: 'Suomi',
  fr: 'Français',
  ga: 'Gaeilge',
  hr: 'Hrvatski',
  hu: 'Magyar',
  it: 'Italiano',
  lt: 'Lietuvių',
  lv: 'Latviešu',
  mt: 'Malti',
  nl: 'Nederlands',
  pl: 'Polski',
  pt: 'Português',
  ro: 'Română',
  sk: 'Slovenčina',
  sl: 'Slovenščina',
  sv: 'Svenska',
};

export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
