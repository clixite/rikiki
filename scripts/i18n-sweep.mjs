/**
 * Balayage i18n : chaque bouton, dans chacune des 24 langues.
 *
 * Le propriétaire a déjà eu des confusions de traduction. Ce script ne relit
 * pas les textes (aucun robot ne sait juger une traduction) : il vérifie
 * MÉCANIQUEMENT ce qu'une mauvaise traduction casse concrètement à l'écran —
 * un mot allemand ou finnois trop long qui déborde de son bouton, une cible
 * tactile qui rétrécit sous la légende, un bouton resté muet, une chaîne
 * oubliée en français au milieu d'une interface traduite.
 *
 * Parcours par langue (aucune partie en cours n'est nécessaire) :
 *   profil initial → accueil → règles → groupes (+ panneaux créer/rejoindre)
 *   → historique → profil (édition) → salon d'une partie avec 2 robots
 *   (+ feuille de réglages).
 *
 * Usage :
 *   node scripts/i18n-sweep.mjs                       # les 24 langues
 *   LOCALES=fr,de,fi,el,ga,mt node scripts/i18n-sweep.mjs   # sous-ensemble
 *   BASE_URL=https://…  SHOTS_DIR=/tmp/shots  node scripts/i18n-sweep.mjs
 *
 * Un seul navigateur, un contexte par langue — comme table-audit.mjs, dont
 * ce script reprend la structure et la technique de détection de troncature.
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL ?? 'http://localhost:3111';
const SHOTS = process.env.SHOTS_DIR ?? null;
const MIN_TOUCH = 44;
/** Pseudo fixe : assez long pour être réaliste, jamais traduit — voir EXCEPTIONS. */
const PSEUDO = 'Christophe';

function chromiumPath() {
  const explicit = process.env.CHROMIUM_PATH;
  if (explicit) return explicit;
  return existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Les 24 langues : lues dans client/src/i18n/types.ts plutôt que recopiées, pour
// ne jamais se désynchroniser de la vraie liste si elle évolue.
// ─────────────────────────────────────────────────────────────────────────────
const typesSrc = readFileSync(path.join(HERE, '../client/src/i18n/types.ts'), 'utf8');
const localesBlock = typesSrc.match(/export const LOCALES = \[([\s\S]*?)\] as const;/)?.[1] ?? '';
const ALL_LOCALES = [...localesBlock.matchAll(/'([a-z]{2})'/g)].map((m) => m[1]);
const namesBlock = typesSrc.match(/export const LOCALE_NAMES: Record<Locale, string> = \{([\s\S]*?)\};/)?.[1] ?? '';
const LOCALE_NAME_ENTRIES = [...namesBlock.matchAll(/(\w+):\s*'([^']+)'/g)].map((m) => [m[1], m[2]]);
const LOCALE_NAMES = Object.fromEntries(LOCALE_NAME_ENTRIES);
if (ALL_LOCALES.length !== 24) {
  console.warn(`⚠ ${ALL_LOCALES.length} langues lues dans types.ts au lieu de 24 attendues — le fichier a-t-il changé ?`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Exceptions au test « resté en français ».
//
// Une chaîne identique entre le rendu français et le rendu dans une autre
// langue n'est PAS forcément un oubli de traduction. Trois cas légitimes :
//
//  1. Marques et acronymes qui ne se traduisent jamais (Rikiki, WhatsApp, SMS,
//     le nom de la société dans la mention de copyright).
//  2. Artefacts propres à ce script, pas au produit : le pseudo fixe qu'il
//     saisit pour créer le compte de test, identique quelle que soit la langue
//     puisque c'est LE SCRIPT qui le tape, pas l'utilisateur.
//  3. Vrais mots communs à plusieurs langues (cognats). Ex. « robot » est
//     identique en français, tchèque, estonien, roumain et slovaque — ce
//     n'est pas un oubli, ces langues empruntent le même mot. Trouvé en
//     exécutant ce script une première fois et en lisant les résultats.
//  4. Coïncidence numérique/typographique : le français et l'anglais disent
//     tous deux « version » (minuscule) — un seul mot commun, sans rapport
//     avec une traduction manquante.
//
// Tout le reste — un libellé de bouton, une description de réglage, un titre
// de section — identique au français dans une langue qui ne l'est pas, EST
// suspect et doit être signalé.
// ─────────────────────────────────────────────────────────────────────────────
const EXCEPTIONS = new Set([
  'Rikiki', // nom de marque, jamais traduit
  'WhatsApp',
  'SMS',
  'Clixite SRL', // raison sociale
  PSEUDO, // artefact du script, pas du produit
  'robot', // cognat : identique en fr/cs/et/ro/sk (constaté à l'exécution)
  'ABCDEF', // exemple de code de groupe à 6 lettres, volontairement identique partout (groupCodePlaceholder)
  ...Object.values(LOCALE_NAMES), // endonymes du sélecteur de langue : jamais traduits par construction
  ...ALL_LOCALES, // codes ISO à côté de chaque endonyme (bg, cs, de…)
]);
/** La mention légale complète coïncide en partie (copyright non traduit, et
 * « version » s'écrit pareil en français et en anglais) : un motif plutôt
 * qu'une chaîne exacte, pour couvrir toutes les valeurs de version. */
// (`normalize()` a déjà ôté le « © » décoratif en tête avant ce test — d'où
// l'absence du symbole dans le motif, sans quoi il ne matcherait jamais.)
const COPYRIGHT_LINE = /^\d{4}\s*Clixite SRL(\s*·\s*(version|Version)\s*[\d.]+.*)?$/;

/** Ôte les symboles/emoji décoratifs en tête et en fin de chaîne (💬 WhatsApp
 * → WhatsApp) avant de comparer ou de chercher une exception : ce sont des
 * icônes, pas du texte à traduire, et ils ne doivent pas cacher un vrai match. */
function normalize(text) {
  return text.replace(/^[^\p{L}\p{N}]+/u, '').replace(/[^\p{L}\p{N}]+$/u, '').trim();
}
/** Une chaîne sans aucune lettre (chiffres, codes, émoji, symboles seuls) n'a
 * rien à traduire — cible tactile numérotée, pictogramme, code de partie. */
function hasLetters(text) {
  return /\p{L}/u.test(text);
}
function isExpectedMatch(normalized) {
  if (!hasLetters(normalized)) return true;
  if (EXCEPTIONS.has(normalized)) return true;
  if (COPYRIGHT_LINE.test(normalized)) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sortie
// ─────────────────────────────────────────────────────────────────────────────
let passed = 0;
const failures = [];
function check(locale, label, ok, detail) {
  if (ok) {
    passed++;
    console.log(`  ✓ [${locale}] ${label}`);
  } else {
    const line = `[${locale}] ${label}${detail ? ` — ${detail}` : ''}`;
    failures.push(line);
    console.log(`  ✗ ${line}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Relevé exécuté dans la page.
// ─────────────────────────────────────────────────────────────────────────────
/* eslint-disable no-undef */
function auditPage(minTouch) {
  const vw = window.innerWidth;
  const visible = (el) => {
    // `.sr-only` : caché à dessein pour les yeux (1×1px, clip-path), réservé
    // aux lecteurs d'écran. Une « troncature » y est un artefact de mesure,
    // pas un défaut visible par personne.
    if (el.closest('.sr-only')) return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const s = getComputedStyle(el);
    return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) !== 0;
  };
  const describe = (el) => {
    const cls = (el.className && el.className.toString().trim().split(/\s+/).slice(0, 3).join('.')) || '';
    const txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    const tid = el.getAttribute('data-testid');
    return `${tid ? `[data-testid=${tid}]` : `<${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}>`} "${txt}"`;
  };

  const small = [];
  const mute = [];
  const buttonOverflow = [];
  for (const el of document.querySelectorAll('button, a[href], [role="button"]')) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < minTouch - 0.5 || r.height < minTouch - 0.5) {
      small.push(`${describe(el)} ${Math.round(r.width)}×${Math.round(r.height)}px`);
    }
    if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') {
      const text = (el.textContent || '').trim();
      const aria = el.getAttribute('aria-label') || el.getAttribute('title');
      if (!text && !aria) mute.push(describe(el));
      if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
        buttonOverflow.push(`${describe(el)} (${el.clientWidth}px de large, texte sur ${el.scrollWidth}px)`);
      }
    }
  }

  // Troncature générale : toute feuille de texte visible ET tout élément taggé
  // `.truncate` (l'utilitaire CSS que le produit utilise pour couper au ⋯).
  const candidates = new Set([
    ...document.querySelectorAll('.truncate'),
    ...[...document.querySelectorAll('*')].filter((el) => el.children.length === 0 && el.textContent?.trim()),
  ]);
  const truncated = [];
  for (const el of candidates) {
    if (!visible(el)) continue;
    if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
      truncated.push(`${describe(el)} (${el.clientWidth}px < ${el.scrollWidth}px)`);
    }
  }

  return {
    docOverflow: document.documentElement.scrollWidth - vw,
    small,
    mute,
    buttonOverflow,
    truncated,
  };
}

/** Relevé du texte visible, pour la comparaison avec le rendu français. */
function snapshotTexts() {
  const path = (el) => {
    const parts = [];
    let node = el;
    while (node && node !== document.body) {
      const tid = node.getAttribute && node.getAttribute('data-testid');
      if (tid) {
        parts.unshift(`#${tid}`);
        break;
      }
      const parent = node.parentElement;
      if (!parent) break;
      const idx = Array.prototype.indexOf.call(parent.children, node);
      parts.unshift(`${node.tagName}${idx}`);
      node = parent;
    }
    return parts.join('>');
  };
  const sel = 'button, a[href], label, h1, h2, h3, p, span, li, input[placeholder]';
  const out = [];
  const seenKeys = new Set();
  for (const el of document.querySelectorAll(sel)) {
    if (el.children.length > 0) continue; // feuilles de texte seulement
    if (el.closest('.sr-only')) continue; // réservé aux lecteurs d'écran, hors sujet ici
    const raw = el.tagName === 'INPUT' ? el.getAttribute('placeholder') || '' : el.textContent || '';
    const text = raw.trim();
    if (!text) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue; // masqué
    const key = path(el);
    if (!key || seenKeys.has(key)) continue;
    seenKeys.add(key);
    out.push({ key, text });
  }
  return out;
}
/* eslint-enable no-undef */

// ─────────────────────────────────────────────────────────────────────────────
// Un audit de page = géométrie (imprimée tout de suite) + capture de texte
// (comparée au français une fois toutes les langues passées par cette page).
// ─────────────────────────────────────────────────────────────────────────────
async function auditAndReport(page, locale, label) {
  const m = await page.evaluate(auditPage, MIN_TOUCH);
  check(locale, `${label} : pas de débordement horizontal`, m.docOverflow <= 0, m.docOverflow > 0 ? `${m.docOverflow}px` : '');
  check(locale, `${label} : cibles tactiles ≥ 44px (${m.small.length})`, m.small.length === 0, m.small.join(' | '));
  check(locale, `${label} : aucun texte tronqué (${m.truncated.length})`, m.truncated.length === 0, m.truncated.join(' | '));
  check(
    locale,
    `${label} : aucun texte ne déborde de son bouton (${m.buttonOverflow.length})`,
    m.buttonOverflow.length === 0,
    m.buttonOverflow.join(' | '),
  );
  check(locale, `${label} : aucun bouton muet (${m.mute.length})`, m.mute.length === 0, m.mute.join(' | '));
  const texts = await page.evaluate(snapshotTexts);
  return texts;
}

/** Compare les textes d'une page à la référence française et signale les
 * chaînes suspectes — mêmes clés, même texte, alors que la langue n'est pas
 * le français, et hors de la liste d'exceptions. */
function reportFrenchLeftovers(locale, label, texts, frBaseline) {
  if (locale === 'fr' || !frBaseline) return;
  const hits = [];
  for (const { key, text } of texts) {
    const frText = frBaseline.get(key);
    if (frText === undefined || frText !== text) continue;
    if (isExpectedMatch(normalize(text))) continue;
    hits.push(`${key} = "${text}"`);
  }
  check(locale, `${label} : aucune chaîne restée en français (${hits.length})`, hits.length === 0, hits.join(' | '));
}

// ─────────────────────────────────────────────────────────────────────────────
// Parcours complet d'une langue.
//
// Renvoie une Map<page, Map<key, text>> — la référence française si `locale
// === 'fr'`, ignorée sinon (seule la sortie console compte pour les autres).
// ─────────────────────────────────────────────────────────────────────────────
async function sweep(browser, locale, { report, frBaseline }) {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 667 },
    isMobile: true,
    hasTouch: true,
    ignoreHTTPSErrors: true,
  });
  await ctx.addInitScript((loc) => {
    try {
      localStorage.setItem('rikiki-locale', loc);
    } catch {
      /* stockage indisponible : la langue par défaut fera l'affaire */
    }
  }, locale);
  const page = await ctx.newPage();
  const pageSnapshots = new Map();
  const shoot = async (name) => {
    if (SHOTS && report) await page.screenshot({ path: `${SHOTS}/i18n-${locale}-${name}.png` }).catch(() => undefined);
  };

  const record = async (label, texts) => {
    pageSnapshots.set(label, new Map(texts.map((t) => [t.key, t.text])));
    if (report) reportFrenchLeftovers(locale, label, texts, frBaseline?.get(label));
  };
  const audit = async (label) => {
    const texts = report ? await auditAndReport(page, locale, label) : await page.evaluate(snapshotTexts);
    await record(label, texts);
    await shoot(label.replace(/[^a-z0-9]+/gi, '-'));
  };

  // ---- 1. Profil initial (création de compte)
  await page.goto(`${BASE}/`);
  await page.waitForSelector('#pseudo', { timeout: 20000 });
  await page.waitForTimeout(150); // fin des micro-animations d'entrée
  await audit('profil-initial');
  await page.fill('#pseudo', PSEUDO);
  await page.click('[data-testid="profile-submit"]');
  await page.waitForSelector('[data-testid="create-game"]', { timeout: 20000 });

  // ---- 2. Accueil
  await page.waitForTimeout(200);
  await audit('accueil');

  // ---- 3. Règles
  await page.click('[data-testid="open-rules"]');
  await page.waitForSelector('[data-testid="rules-back"]', { timeout: 15000 });
  await page.waitForTimeout(200);
  await audit('règles');
  await page.goto(`${BASE}/`);
  await page.waitForSelector('[data-testid="create-game"]', { timeout: 15000 });

  // ---- 4. Groupes (+ panneaux créer / rejoindre)
  await page.click('[data-testid="open-groups"]');
  await page.waitForSelector('[data-testid="group-create-toggle"]', { timeout: 15000 });
  await page.waitForTimeout(250); // la liste (cache ou « aucun groupe ») se stabilise
  await audit('groupes');
  await page.click('[data-testid="group-create-toggle"]');
  await page.waitForSelector('[data-testid="group-name-input"]', { timeout: 10000 });
  await audit('groupes (créer un groupe)');
  await page.click('[data-testid="group-create-toggle"]');
  await page.click('[data-testid="group-join-toggle"]');
  await page.waitForSelector('[data-testid="group-code-input"]', { timeout: 10000 });
  await audit('groupes (rejoindre un groupe)');
  await page.goto(`${BASE}/`);
  await page.waitForSelector('[data-testid="create-game"]', { timeout: 15000 });

  // ---- 5. Historique (« mes parties »)
  await page.goto(`${BASE}/history`);
  await page.waitForSelector('[data-testid="sound-toggle"]', { timeout: 15000 });
  await page.waitForTimeout(300);
  await audit('historique');
  await page.goto(`${BASE}/`);
  await page.waitForSelector('[data-testid="create-game"]', { timeout: 15000 });

  // ---- 6. Profil (édition)
  await page.click('[data-testid="open-profile"]');
  await page.waitForSelector('[data-testid="delete-account"]', { timeout: 15000 });
  await page.waitForTimeout(200);
  await audit('profil (édition)');
  await page.goto(`${BASE}/`);
  await page.waitForSelector('[data-testid="create-game"]', { timeout: 15000 });

  // ---- 7. Salon d'une partie créée avec des robots
  await page.click('[data-testid="create-game"]');
  await page.waitForSelector('[data-testid="room-code"]', { timeout: 15000 });
  await page.waitForTimeout(200);
  await audit('salon');
  await page.click('[data-testid="add-bot"]');
  await page.waitForFunction(() => document.querySelectorAll('[data-testid^="lobby-player-"]').length >= 2, {
    timeout: 10000,
  });
  await page.click('[data-testid="add-bot"]');
  await page.waitForFunction(() => document.querySelectorAll('[data-testid^="lobby-player-"]').length >= 3, {
    timeout: 10000,
  });
  await page.waitForTimeout(200);
  await audit('salon (table complétée par des robots)');
  await page.click('[data-testid="open-settings"]');
  await page.waitForSelector('[data-testid="settings-sheet"]', { timeout: 10000 });
  await page.waitForTimeout(400); // la feuille termine son ressort
  await audit('salon (réglages de la partie)');
  await page.click('[data-testid="settings-close"]');
  await page.waitForSelector('[data-testid="settings-sheet"]', { state: 'detached', timeout: 10000 });

  await ctx.close();
  return pageSnapshots;
}

// ─────────────────────────────────────────────────────────────────────────────
// Orchestration
// ─────────────────────────────────────────────────────────────────────────────
const requested = process.env.LOCALES
  ? process.env.LOCALES.split(',').map((s) => s.trim()).filter(Boolean)
  : ALL_LOCALES;
for (const code of requested) {
  if (!ALL_LOCALES.includes(code)) {
    console.error(`✗ langue inconnue : ${code} (voir client/src/i18n/types.ts)`);
    process.exit(1);
  }
}
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const launchOpts = {};
const exec = chromiumPath();
if (exec) launchOpts.executablePath = exec;
if (process.env.HTTPS_PROXY && BASE.startsWith('https://')) {
  launchOpts.proxy = { server: process.env.HTTPS_PROXY };
}
const browser = await chromium.launch(launchOpts);
const startedAt = Date.now();

// La référence française est toujours construite, même si 'fr' n'est pas
// demandé explicitement : sans elle, aucune langue ne peut être comparée.
console.log('▸ référence française (silencieuse, sert de comparaison)');
let frBaseline;
try {
  frBaseline = await sweep(browser, 'fr', { report: requested.includes('fr'), frBaseline: null });
} catch (e) {
  console.error(`✗ impossible de construire la référence française — ${e.message}`);
  await browser.close();
  process.exit(1);
}

for (const code of requested) {
  if (code === 'fr') continue;
  const label = LOCALE_NAMES[code] ?? code;
  console.log(`\n▸ ${code} — ${label}`);
  try {
    await sweep(browser, code, { report: true, frBaseline });
  } catch (e) {
    check(code, 'parcours complet sans erreur', false, e.message);
  }
}

await browser.close();
const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

console.log('\n' + '─'.repeat(70));
console.log(`${passed} vérification(s) réussie(s), ${failures.length} échec(s) — ${requested.length} langue(s) en ${elapsed}s`);
if (failures.length > 0) {
  console.log('\nÉchecs :');
  failures.forEach((f) => console.log(`  ✗ ${f}`));
  process.exitCode = 1;
} else {
  console.log('✅ Tous les boutons, dans toutes les langues demandées, passent le balayage mécanique');
}
