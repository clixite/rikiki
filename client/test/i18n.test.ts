import { describe, expect, it } from 'vitest';
import { LOCALES, type Locale, type Messages } from '../src/i18n/types';
import { fr } from '../src/i18n/locales/fr';

/**
 * Contrôle mécanique des vingt-quatre traductions.
 *
 * TypeScript garantit déjà qu'aucune clé ne manque et qu'aucune signature ne
 * diverge — c'est le rôle du type `Messages`. Il ne dit rien, en revanche, de
 * ce qui fait vraiment échouer une traduction en production : un paramètre
 * oublié dans une phrase à trou, une clé recopiée telle quelle du français, un
 * libellé trois fois trop long pour son bouton. Ce sont des erreurs de contenu,
 * invisibles au compilateur, et personne ne relit vingt-quatre langues à l'œil.
 */

/* Chargement synchrone des 24 modules : `import.meta.glob` est réservé à Vite,
   et ces tests tournent sous Node. */
const modules = import.meta.glob<Messages>('../src/i18n/locales/*.ts', {
  eager: true,
  import: 'default',
});

const catalogue = new Map<Locale, Messages>();
for (const [path, messages] of Object.entries(modules)) {
  const code = path.split('/').pop()!.replace('.ts', '') as Locale;
  catalogue.set(code, messages);
}

/** Toutes les langues sauf le français, qui sert de référence. */
const OTHERS = LOCALES.filter((l) => l !== 'fr');

type Leaf = { path: string; value: string | ((...args: never[]) => string) };

/** Parcourt un catalogue et rend chaque valeur terminale avec son chemin. */
function leaves(obj: unknown, prefix = ''): Leaf[] {
  const out: Leaf[] = [];
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string' || typeof value === 'function') {
      out.push({ path, value: value as Leaf['value'] });
    } else if (value && typeof value === 'object') {
      out.push(...leaves(value, path));
    }
  }
  return out;
}

const frLeaves = leaves(fr);

/**
 * Jeu d'arguments plausible pour appeler une phrase à trou sans connaître sa
 * signature : les fonctions du catalogue prennent un nombre, un pseudo, ou les
 * deux. On passe des valeurs reconnaissables pour vérifier ensuite qu'elles
 * ressortent bien dans le texte produit.
 */
const PROBE_NUMBER = 7;
const PROBE_TEXT = 'ZzQq';

function callWithProbes(fn: (...args: never[]) => string): string {
  const args = Array.from({ length: fn.length }, (_, i) =>
    // Une signature mixte `(a: number, b: number)` existe (plis/contrat) ; on
    // alterne pour couvrir aussi les phrases qui prennent un pseudo.
    i === 0 && fn.length === 1 ? PROBE_NUMBER : i === 0 ? PROBE_NUMBER : PROBE_TEXT,
  ) as never[];
  try {
    return fn(...args);
  } catch {
    return '';
  }
}

/* ------------------------------------------------------------------ */
/* 1. Les phrases à trou utilisent réellement leurs paramètres          */
/* ------------------------------------------------------------------ */

describe('phrases à trou', () => {
  /*
   * Le cas qui fait mal : `playerJoined: (p) => 'Un joueur a rejoint'` compile
   * parfaitement — la signature est bonne — mais le pseudo disparaît, et tout
   * le monde voit « Un joueur a rejoint » sans savoir qui. Une traduction
   * pressée fait exactement cette faute.
   */
  it.each(OTHERS)('%s : chaque paramètre ressort dans le texte produit', (locale) => {
    const messages = catalogue.get(locale)!;
    const manquants: string[] = [];

    for (const { path, value } of frLeaves) {
      if (typeof value !== 'function') continue;
      const traduit = path.split('.').reduce<unknown>((o, k) => (o as never)?.[k], messages);
      if (typeof traduit !== 'function') continue;

      const attendu = callWithProbes(value);
      const obtenu = callWithProbes(traduit as (...args: never[]) => string);

      // On ne vérifie que les repères présents dans le français : si la phrase
      // française n'affiche pas le nombre, la traduction n'y est pas tenue.
      if (attendu.includes(String(PROBE_NUMBER)) && !obtenu.includes(String(PROBE_NUMBER))) {
        manquants.push(`${path} (nombre absent) → « ${obtenu} »`);
      }
      if (attendu.includes(PROBE_TEXT) && !obtenu.includes(PROBE_TEXT)) {
        manquants.push(`${path} (pseudo absent) → « ${obtenu} »`);
      }
    }

    expect(manquants, `${locale} : ${manquants.join(' | ')}`).toEqual([]);
  });

  it.each(OTHERS)('%s : aucune phrase à trou ne rend une chaîne vide', (locale) => {
    const messages = catalogue.get(locale)!;
    const vides: string[] = [];
    for (const { path, value } of frLeaves) {
      if (typeof value !== 'function') continue;
      const traduit = path.split('.').reduce<unknown>((o, k) => (o as never)?.[k], messages);
      if (typeof traduit === 'function' && callWithProbes(traduit as never).trim() === '') {
        vides.push(path);
      }
    }
    expect(vides, `${locale} : ${vides.join(', ')}`).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* 2. Rien n'est resté en français                                      */
/* ------------------------------------------------------------------ */

/**
 * Mots qui ont le droit d'être identiques au français.
 *
 * Un nom propre, un sigle, un emoji ou un mot réellement commun à deux langues
 * proches ne sont pas des oublis de traduction. Sans cette liste, le contrôle
 * crierait au loup à chaque « Rikiki » et deviendrait inutilisable.
 */
const IDENTIQUES_LEGITIMES =
  /^(rikiki|whatsapp|sms|abcdef|clixite|ok|bot|robot|score|scores|stop|pause|options?|menu|total|photo|email|e-mail|contact|version|installer?|application|note|solo|max|min|№|n°|—|·|✕|✓|\p{Lu}|\d+|[^\p{L}]*)$/iu;

/**
 * Clés dont la valeur est, par nature, la même dans toutes les langues :
 * marques, mentions légales, gabarits de saisie. Les exclure vaut mieux que
 * d'élargir l'expression ci-dessus, qui deviendrait permissive au point de ne
 * plus rien attraper.
 */
const CLES_UNIVERSELLES = new Set(['inviteWhatsApp', 'inviteSms', 'groupCodePlaceholder', 'copyright', 'appName']);

/**
 * Coïncidences vérifiées, langue par langue.
 *
 * Le vocabulaire des cartes est fait de mots courts qui se ressemblent d'une
 * langue à l'autre : « dame » est bien le mot danois pour la dame, « as » le
 * mot croate, polonais et slovène pour l'as. Les recenser un à un vaut mieux
 * que d'exempter en bloc les noms de cartes — un jour, l'un d'eux sera
 * réellement oublié, et le contrôle doit encore pouvoir le dire.
 */
const COINCIDENCES: Record<string, ReadonlySet<string>> = {
  da: new Set(['rankNames.12']),
  hr: new Set(['rankNames.14']),
  pl: new Set(['rankNames.14']),
  sl: new Set(['rankNames.14']),
};

/**
 * Langues où un fort recouvrement lexical avec le français est normal.
 * On y tolère davantage d'identités sans crier au loup.
 */
const PROCHES = new Set<Locale>(['it', 'es', 'pt', 'ro', 'en']);

describe('traductions réellement traduites', () => {
  it.each(OTHERS)('%s : les libellés ne sont pas recopiés du français', (locale) => {
    const messages = catalogue.get(locale)!;
    const suspects: string[] = [];

    for (const { path, value } of frLeaves) {
      if (typeof value !== 'string') continue;
      const traduit = path.split('.').reduce<unknown>((o, k) => (o as never)?.[k], messages);
      if (typeof traduit !== 'string') continue;
      if (traduit !== value) continue;
      if (CLES_UNIVERSELLES.has(path)) continue;
      if (COINCIDENCES[locale]?.has(path)) continue;
      if (IDENTIQUES_LEGITIMES.test(traduit.trim())) continue;
      // Un libellé d'un seul mot court peut légitimement coïncider entre
      // langues voisines ; une phrase entière, jamais.
      if (PROCHES.has(locale) && traduit.trim().split(/\s+/).length <= 2) continue;
      suspects.push(`${path} = « ${traduit} »`);
    }

    expect(suspects, `${locale} : ${suspects.length} libellé(s) identique(s) au français — ${suspects.slice(0, 12).join(' | ')}`).toEqual([]);
  });

  it.each(OTHERS)('%s : aucun libellé vide', (locale) => {
    const messages = catalogue.get(locale)!;
    const vides: string[] = [];
    for (const { path, value } of frLeaves) {
      if (typeof value !== 'string') continue;
      const traduit = path.split('.').reduce<unknown>((o, k) => (o as never)?.[k], messages);
      if (typeof traduit === 'string' && traduit.trim() === '') vides.push(path);
    }
    expect(vides, `${locale} : ${vides.join(', ')}`).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* 3. Rien n'est démesurément long                                      */
/* ------------------------------------------------------------------ */

/**
 * Libellés courts qui vivent dans un bouton ou une pastille : c'est là que la
 * place manque, et c'est là qu'une traduction trois fois plus longue casse la
 * mise en page. L'allemand et le finnois sont les récidivistes.
 *
 * Le seuil est volontairement généreux (2,4×) : on cherche l'accident, pas la
 * variation normale entre langues.
 */
const RATIO_MAX = 2.4;
/** En deçà, un rapport élevé n'a aucune conséquence visuelle (« OK » → « D'accord »). */
const LONGUEUR_PLANCHER = 12;

describe('longueur des libellés', () => {
  it.each(OTHERS)('%s : aucun libellé démesuré par rapport au français', (locale) => {
    const messages = catalogue.get(locale)!;
    const trop: string[] = [];

    for (const { path, value } of frLeaves) {
      if (typeof value !== 'string') continue;
      if (value.length < LONGUEUR_PLANCHER) continue;
      const traduit = path.split('.').reduce<unknown>((o, k) => (o as never)?.[k], messages);
      if (typeof traduit !== 'string') continue;
      const ratio = traduit.length / value.length;
      if (ratio > RATIO_MAX) {
        trop.push(`${path} ×${ratio.toFixed(1)} (${value.length}→${traduit.length}) « ${traduit} »`);
      }
    }

    expect(trop, `${locale} : ${trop.join(' | ')}`).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* 4. Cohérence de forme                                                */
/* ------------------------------------------------------------------ */

describe('forme des traductions', () => {
  /*
   * L'apostrophe droite (') passe pour un guillemet dans certaines polices et
   * casse la typographie ; le projet utilise l'apostrophe typographique (’)
   * partout. C'est aussi ce qui évite de casser une chaîne JavaScript.
   */
  it.each(LOCALES)('%s : apostrophe typographique uniquement', (locale) => {
    const messages = catalogue.get(locale)!;
    const fautes: string[] = [];
    for (const { path, value } of leaves(messages)) {
      const texte = typeof value === 'function' ? callWithProbes(value) : value;
      if (texte.includes("'")) fautes.push(`${path} = « ${texte} »`);
    }
    expect(fautes, `${locale} : ${fautes.join(' | ')}`).toEqual([]);
  });

  it.each(LOCALES)('%s : ni espace superflu ni double espace', (locale) => {
    const messages = catalogue.get(locale)!;
    const fautes: string[] = [];
    for (const { path, value } of leaves(messages)) {
      if (typeof value !== 'string') continue;
      if (value !== value.trim()) fautes.push(`${path} (espace en bord)`);
      if (/ {2}/.test(value)) fautes.push(`${path} (double espace)`);
    }
    expect(fautes, `${locale} : ${fautes.join(' | ')}`).toEqual([]);
  });

  /*
   * Les dix petites phrases et les huit réactions sont des listes fermées
   * partagées avec le serveur : une clé en trop ou en moins côté traduction
   * signifierait qu'une phrase envoyable ne s'affiche pas.
   */
  it.each(LOCALES)('%s : les dix petites phrases sont toutes traduites', (locale) => {
    const messages = catalogue.get(locale)!;
    const textes = messages.phraseTexts;
    expect(Object.keys(textes).sort()).toEqual(Object.keys(fr.phraseTexts).sort());
    for (const [id, texte] of Object.entries(textes)) {
      expect(texte.trim(), `${locale}.phraseTexts.${id}`).not.toBe('');
    }
  });
});
