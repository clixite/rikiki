/**
 * Contrôle du dossier de soumission App Store.
 *
 * Apple refuse une livraison pour des motifs mécaniques — un texte trop long,
 * une image à la mauvaise taille, un canal alpha dans l'icône — et le rejet
 * arrive après plusieurs jours d'attente. Autant tout vérifier ici.
 *
 *   node scripts/check-store.mjs
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.env.STORE_DIR ?? 'store';
const META = path.join(ROOT, 'metadata');
const ASSETS = path.join(ROOT, 'assets');

/** Codes de langue App Store Connect attendus. */
const LOCALES = [
  'fr-FR', 'en-US', 'de-DE', 'es-ES', 'it', 'nl-NL', 'pt-PT', 'pl', 'sv',
  'da', 'fi', 'cs', 'sk', 'sl', 'hr', 'hu', 'ro', 'el',
];

/** Longueurs maximales imposées par App Store Connect. */
const LIMITS = {
  'name.txt': 30,
  'subtitle.txt': 30,
  'promotional_text.txt': 170,
  'keywords.txt': 100,
  'description.txt': 4000,
  'release_notes.txt': 4000,
};
const URL_FILES = ['support_url.txt', 'marketing_url.txt', 'privacy_url.txt'];

/** Tailles de capture acceptées pour l'iPhone 6,9" (portrait). */
const SHOT_SIZES = [
  [1260, 2736],
  [1290, 2796],
  [1320, 2868],
];

let ok = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    ok++;
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

/** Dimensions et type de couleur d'un PNG, lus dans son en-tête IHDR. */
function readPng(file) {
  const b = readFileSync(file);
  const signature = b.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
  return {
    signature,
    width: b.readUInt32BE(16),
    height: b.readUInt32BE(20),
    depth: b[24],
    colorType: b[25],
  };
}

/** Dimensions et nombre de composantes d'un JPEG, lus dans son marqueur SOF. */
function readJpeg(file) {
  const b = readFileSync(file);
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i < b.length - 1) {
    if (b[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = b[i + 1];
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7), components: b[i + 9] };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

console.log('\n▸ Textes de la fiche');
for (const locale of LOCALES) {
  const dir = path.join(META, locale);
  if (!existsSync(dir)) {
    check(`${locale} : dossier présent`, false);
    continue;
  }
  for (const [file, limit] of Object.entries(LIMITS)) {
    const p = path.join(dir, file);
    if (!existsSync(p)) {
      check(`${locale}/${file} : présent`, false);
      continue;
    }
    const text = readFileSync(p, 'utf8').trim();
    check(`${locale}/${file} : non vide`, text.length > 0);
    check(`${locale}/${file} : ≤ ${limit} caractères`, text.length <= limit, `${text.length}`);
  }
  for (const file of URL_FILES) {
    const p = path.join(dir, file);
    const url = existsSync(p) ? readFileSync(p, 'utf8').trim() : '';
    check(`${locale}/${file} : URL https`, url.startsWith('https://'), url);
  }
  // Les mots-clés sont comptés espaces compris : les virgules seules suffisent
  const keywords = readFileSync(path.join(dir, 'keywords.txt'), 'utf8').trim();
  check(`${locale} : mots-clés sans espace après la virgule`, !/,\s/.test(keywords), keywords);
}

console.log('\n▸ Icône');
const iconPath = path.join(ASSETS, 'icon-1024.png');
if (!existsSync(iconPath)) {
  check('icône : présente', false, iconPath);
} else {
  const icon = readPng(iconPath);
  check('icône : PNG valide', icon.signature);
  check('icône : 1024×1024', icon.width === 1024 && icon.height === 1024, `${icon.width}×${icon.height}`);
  check('icône : aucun canal alpha', icon.colorType === 2 || icon.colorType === 0, `type ${icon.colorType}`);
  check('icône : 8 bits par composante', icon.depth === 8, String(icon.depth));
}

console.log('\n▸ Captures d’écran');
const shotsDir = path.join(ASSETS, 'screenshots');
for (const locale of LOCALES) {
  // Le dossier de captures suit la langue de l'app, pas le code App Store
  const appLocale = locale.split('-')[0];
  const dir = path.join(shotsDir, appLocale);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    check(`${appLocale} : captures présentes`, false);
    continue;
  }
  const files = readdirSync(dir).filter((f) => f.endsWith('.jpg') || f.endsWith('.png'));
  check(`${appLocale} : entre 1 et 10 captures`, files.length >= 1 && files.length <= 10, String(files.length));
  for (const file of files) {
    const info = readJpeg(path.join(dir, file));
    if (!info) {
      check(`${appLocale}/${file} : JPEG lisible`, false);
      continue;
    }
    const sizeOk = SHOT_SIZES.some(([w, h]) => info.width === w && info.height === h);
    check(`${appLocale}/${file} : taille iPhone 6,9"`, sizeOk, `${info.width}×${info.height}`);
    check(`${appLocale}/${file} : aucun canal alpha`, info.components === 3, `${info.components} composantes`);
  }
}

console.log('\n' + '─'.repeat(60));
console.log(`${ok} vérifications réussies, ${failures.length} échec(s)`);
if (failures.length) {
  console.log('\nÉchecs :');
  failures.forEach((f) => console.log(`  ✗ ${f}`));
  process.exit(1);
}
console.log('✅ Le dossier de soumission est conforme');
