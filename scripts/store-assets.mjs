/**
 * Fabrique tous les visuels de la soumission App Store.
 *
 * Quatre livrables :
 *   1. `store/assets/icon-1024.png` — l'icône de la fiche, en PNG *sans* canal
 *      alpha : Apple refuse toute transparence, y compris un alpha
 *      entièrement opaque ;
 *   2. `ios/assets/icon-only.png` — la même image, source du jeu d'icônes que
 *      `@capacitor/assets` décline pour le projet Xcode ;
 *   3. `ios/assets/splash.png` et `splash-dark.png` — 2732×2732, l'écran de
 *      lancement, dont Capacitor tire toutes les déclinaisons ;
 *   4. `store/assets/screenshots/<langue>/` — les captures localisées.
 *
 * Tout est produit depuis l'application réelle : une capture qui ne
 * correspond pas à ce que l'utilisateur voit est un motif de rejet.
 *
 * Usage :
 *   node scripts/store-assets.mjs                 # toutes les langues
 *   LOCALES=fr,en node scripts/store-assets.mjs   # sous-ensemble
 *   DEVICE=ipad node scripts/store-assets.mjs     # captures iPad 13"
 *   SKIP_SHOTS=1 node scripts/store-assets.mjs    # icône et splash seulement
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3111';
const OUT = process.env.OUT_DIR ?? 'store/assets';
/** Sources dont `@capacitor/assets` décline les icônes et écrans de lancement. */
const IOS_ASSETS = process.env.IOS_ASSETS_DIR ?? 'ios/assets';
const EXEC = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';

/**
 * Langues de la fiche App Store. Apple n'accepte pas le bulgare, l'estonien,
 * l'irlandais, le letton, le lituanien ni le maltais : l'application les parle,
 * mais la fiche du store ne peut pas les afficher.
 */
const STORE_LOCALES = [
  ['fr', 'fr-FR'],
  ['en', 'en-US'],
  ['de', 'de-DE'],
  ['es', 'es-ES'],
  ['it', 'it'],
  ['nl', 'nl-NL'],
  ['pt', 'pt-PT'],
  ['pl', 'pl'],
  ['sv', 'sv'],
  ['da', 'da'],
  ['fi', 'fi'],
  ['cs', 'cs'],
  ['sk', 'sk'],
  ['sl', 'sl'],
  ['hr', 'hr'],
  ['hu', 'hu'],
  ['ro', 'ro'],
  ['el', 'el'],
];

/**
 * Formats de capture.
 *
 * Apple n'exige plus qu'une taille par famille d'appareils : l'iPhone 6,9\" —
 * les écrans plus petits sont dérivés automatiquement — et l'iPad 13\"
 * UNIQUEMENT si l'application est livrée pour iPad. La v1 vise l'iPhone seul
 * (`TARGETED_DEVICE_FAMILY = 1` dans Xcode), donc `iphone` par défaut.
 */
const DEVICES = {
  // 1320 × 2868 = 440 × 956 points à 3× (iPhone 16 Pro Max et suivants)
  iphone: { width: 440, height: 956, scale: 3, label: 'iPhone 6,9\" (1320×2868)', dir: '' },
  // 2064 × 2752 = 688 × 917 points à 3× (iPad Pro 13\")
  ipad: { width: 688, height: 917, scale: 3, label: 'iPad 13\" (2064×2752)', dir: 'ipad-' },
};
const SHOT = DEVICES[process.env.DEVICE ?? 'iphone'] ?? DEVICES.iphone;

const only = process.env.LOCALES?.split(',').map((s) => s.trim());
const locales = only ? STORE_LOCALES.filter(([l]) => only.includes(l)) : STORE_LOCALES;

// ───────────────────────────────────────────────────────── encodeur PNG (RGB)

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

let CRC_TABLE = null;
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}

/**
 * PNG de type couleur 2 (RGB, 8 bits) : aucun canal alpha, ce qu'Apple exige
 * pour l'icône. Chaque ligne est préfixée du filtre 0 (aucun).
 */
function encodeRgbPng(rgba, width, height) {
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = y * (stride + 1) + 1 + x * 3;
      raw[dst] = rgba[src];
      raw[dst + 1] = rgba[src + 1];
      raw[dst + 2] = rgba[src + 2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // profondeur
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─────────────────────────────────────────────────────────────── icône 1024

/** Dessine l'icône dans la page et renvoie ses pixels bruts. */
function drawIcon() {
  const S = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');

  // Fond : tapis vert, éclairé en haut à gauche comme une table de jeu
  const bg = ctx.createLinearGradient(0, 0, S, S);
  bg.addColorStop(0, '#2a6b47');
  bg.addColorStop(0.55, '#1d4a31');
  bg.addColorStop(1, '#0d2b1c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, S, S);
  const halo = ctx.createRadialGradient(S * 0.34, S * 0.26, 20, S * 0.34, S * 0.26, S * 0.85);
  halo.addColorStop(0, 'rgba(120,200,155,0.28)');
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, S, S);

  const card = (cx, cy, angle, w, h, drawPip) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 46;
    ctx.shadowOffsetY = 22;
    ctx.fillStyle = '#fdfbf6';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 46);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(26,23,18,0.10)';
    ctx.lineWidth = 3;
    ctx.stroke();
    drawPip(ctx);
    ctx.restore();
  };

  const heart = (c) => {
    c.fillStyle = '#b8323a';
    c.font = 'bold 236px Georgia, serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('♥', 0, 12);
  };
  const spade = (c) => {
    c.fillStyle = '#1a1712';
    c.font = 'bold 236px Georgia, serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('♠', 0, 12);
  };

  // Les deux cartes sont franchement écartées : à la taille d'une icône sur
  // l'écran d'accueil, un simple chevauchement se lit comme une seule carte.
  // Aucun liseré en bordure — iOS arrondit l'icône et le rognerait aux angles.
  card(S * 0.355, S * 0.5, -0.27, 342, 494, heart);
  card(S * 0.635, S * 0.53, 0.17, 342, 494, spade);

  return Array.from(ctx.getImageData(0, 0, S, S).data);
}

/**
 * Écran de lancement, 2732×2732.
 *
 * Capacitor en tire toutes les déclinaisons (portrait, paysage, chaque
 * densité) en recadrant depuis le CENTRE : tout ce qui compte doit donc tenir
 * dans le carré central, avec une large marge de sécurité. D'où un logo
 * volontairement petit sur un fond qui se suffit à lui-même.
 */
function drawSplash(dark) {
  const S = 2732;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');

  const bg = ctx.createRadialGradient(S / 2, S * 0.42, 40, S / 2, S * 0.42, S * 0.8);
  if (dark) {
    bg.addColorStop(0, '#123022');
    bg.addColorStop(1, '#050f0a');
  } else {
    bg.addColorStop(0, '#1d4a31');
    bg.addColorStop(1, '#0a1b13');
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, S, S);

  const card = (cx, cy, angle, w, h, glyph, ink) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    // Pas de flou gaussien : sur 7,5 millions de pixels et sans accélération
    // matérielle, il se compte en minutes. Une ombre pleine, décalée, suffit
    // amplement pour un écran qui s'affiche une demi-seconde.
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.roundRect(-w / 2 + 8, -h / 2 + 14, w, h, 34);
    ctx.fill();
    ctx.fillStyle = '#fdfbf6';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 34);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.font = `bold ${Math.round(h * 0.46)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyph, 0, h * 0.03);
    ctx.restore();
  };

  const w = 246;
  const h = 356;
  card(S / 2 - 96, S * 0.44, -0.27, w, h, '♥', '#b8323a');
  card(S / 2 + 96, S * 0.46, 0.17, w, h, '♠', '#1a1712');

  ctx.fillStyle = dark ? 'rgba(233,201,133,0.92)' : '#e9c985';
  ctx.font = 'bold 132px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Rikiki', S / 2, S * 0.58);

  // 2732², c'est 7,5 millions de pixels : les rapatrier un à un dans un tableau
  // JavaScript sature la passerelle avec le navigateur (trente millions de
  // valeurs sérialisées en JSON). On laisse Chromium encoder le PNG et on ne
  // transporte qu'une chaîne — trois cents millisecondes au lieu de minutes.
  return canvas.toDataURL('image/png');
}

// ─────────────────────────────────────────────────────────────── captures

/**
 * Un « téléphone » = un contexte à lui seul. Deux pages du même contexte
 * partagent le stockage local, donc la session : le second joueur serait déjà
 * connecté sous l'identité du premier et ne verrait jamais l'écran de profil.
 */
async function newPhone(browser, appLocale, storeLocale) {
  const context = await browser.newContext({
    viewport: { width: SHOT.width, height: SHOT.height },
    deviceScaleFactor: SHOT.scale,
    isMobile: true,
    hasTouch: true,
    locale: storeLocale,
    ignoreHTTPSErrors: true,
  });
  const page = await withLocale(context, appLocale);
  return { context, page };
}

async function withLocale(context, locale) {
  const page = await context.newPage();
  // La langue est lue au démarrage : on la pose avant le premier rendu.
  await page.addInitScript((loc) => {
    try {
      localStorage.setItem('rikiki-locale', loc);
    } catch {
      /* stockage indisponible */
    }
  }, locale);
  return page;
}

async function createProfile(page, pseudo, avatarIndex) {
  await page.waitForURL('**/profile', { timeout: 20000 });
  await page.fill('#pseudo', pseudo);
  // Deux joueurs avec le même avatar donnent une capture confuse.
  await page.click(`[aria-label="Avatar ${avatarIndex}"]`);
  await page.click('[data-testid="profile-submit"]');
}

/** Laisse les animations se terminer avant de photographier. */
async function settle(page, ms = 900) {
  await page.waitForTimeout(ms);
}

async function waitForAny(pages, selector, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const page of pages) {
      if ((await page.locator(selector).count()) > 0) return page;
    }
    await pages[0].waitForTimeout(200);
  }
  return null;
}

/**
 * Fait avancer la partie jusqu'à une manche assez fournie pour être montrée.
 *
 * La première manche ne distribue qu'une carte : l'écran est presque vide, ce
 * qui ne donne aucune idée du jeu sur une fiche App Store. On joue donc
 * automatiquement — annonce, carte légale, récapitulatif — jusqu'à une main
 * d'au moins `minCards` cartes.
 */
async function playUntilHandOf(pages, minCards, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const page of pages) {
      const handSize = await page.locator('[data-testid^="hand-"]:not([data-testid="hand-fan"])').count();
      const bidding = (await page.locator('[data-testid="bid-picker"]').count()) > 0;
      if (bidding && handSize >= minCards) return page;

      // Récapitulatif de fin de manche : on referme pour enchaîner
      const recapButton = page.locator('[data-testid="round-recap"] button').first();
      if ((await recapButton.count()) > 0) {
        await recapButton.click().catch(() => {});
        continue;
      }
      if (bidding) {
        const bid = page.locator('button[data-testid^="bid-"]:not([disabled])').first();
        if ((await bid.count()) > 0) await bid.click().catch(() => {});
        continue;
      }
      const card = page.locator('[data-legal="true"]').first();
      if ((await card.count()) > 0) await card.click().catch(() => {});
    }
    await pages[0].waitForTimeout(150);
  }
  return null;
}

/**
 * Joue jusqu'à ce qu'au moins une carte soit posée au centre.
 *
 * Une table vide ne montre rien du jeu. On termine les annonces, puis on
 * laisse tomber une carte : la capture la plus parlante est celle d'un joueur
 * qui a encore sa main pleine pendant que le pli se remplit.
 */
async function playUntilTrickInProgress(pages, minCards, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const page of pages) {
      const played = Number(
        (await page
          .locator('[data-testid="trick-area"]')
          .first()
          .getAttribute('data-trick-cards')
          .catch(() => '0')) ?? '0',
      );
      if (played >= minCards) return page;

      const bid = page.locator('button[data-testid^="bid-"]:not([disabled])').first();
      if ((await bid.count()) > 0) {
        await bid.click().catch(() => {});
        continue;
      }
      // C'est à nous : on pose une carte pour amorcer le pli, sauf s'il est
      // déjà assez garni sur cette page.
      const card = page.locator('[data-legal="true"]').first();
      if ((await card.count()) > 0 && played < minCards) await card.click().catch(() => {});
    }
    await pages[0].waitForTimeout(200);
  }
  return null;
}

async function shoot(page, locale, name) {
  const dir = `${OUT}/screenshots/${SHOT.dir}${locale}`;
  mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: `${dir}/${name}.jpg`, type: 'jpeg', quality: 92 });
}

async function captureLocale(browser, appLocale, storeLocale) {
  const hostPhone = await newPhone(browser, appLocale, storeLocale);
  const guestPhone = await newPhone(browser, appLocale, storeLocale);
  const host = hostPhone.page;
  const guest = guestPhone.page;

  await host.goto(`${BASE}/`);
  await createProfile(host, 'Nicolas', 3);
  await host.waitForSelector('[data-testid="create-game"]:not([disabled])', { timeout: 20000 });
  await settle(host);
  await shoot(host, appLocale, '1-accueil');

  await host.click('[data-testid="create-game"]');
  await host.waitForSelector('[data-testid="room-code"]', { timeout: 20000 });
  const code = (await host.textContent('[data-testid="room-code"]')).trim();

  await guest.goto(`${BASE}/j/${code}`);
  await createProfile(guest, 'Marie', 9);
  await guest.waitForSelector('[data-testid="room-code"]', { timeout: 20000 });

  await host.click('[data-testid="add-bot"]');
  await host.waitForFunction(
    () => document.querySelectorAll('[data-testid^="lobby-player-"]').length >= 3,
    { timeout: 15000 },
  );
  await settle(host);
  await shoot(host, appLocale, '2-salon');

  // Les réglages : durée, rythme, barème. C'est là que se voient les deux
  // arguments de vente qu'aucune capture de table ne peut montrer — jouer
  // chacun à son rythme, et compter les points comme chez soi.
  if ((await host.locator('[data-testid="open-settings"]').count()) > 0) {
    await host.click('[data-testid="open-settings"]');
    await host.waitForSelector('[data-testid="settings-sheet"]', { timeout: 10000 });
    await settle(host);
    await shoot(host, appLocale, '3-reglages');
    await host.click('[data-testid="settings-close"]');
    await host.waitForSelector('[data-testid="settings-sheet"]', { state: 'detached', timeout: 10000 });
  }

  await host.click('[data-testid="start-game"]');
  await host.waitForSelector('[data-testid="hand-fan"]', { timeout: 20000 });

  // Manche à 5 cartes : la main est fournie, l'éventail et le tri par couleur
  // se lisent, et l'écran d'annonce montre enfin quelque chose.
  const bidder = await playUntilHandOf([host, guest], 5, 120000);
  const table = bidder ?? (await waitForAny([host, guest], '[data-testid="hand-fan"]', 20000)) ?? host;
  if (bidder) {
    await settle(bidder);
    await shoot(bidder, appLocale, '4-annonce');
    // On annonce, puis on laisse deux cartes tomber pour photographier un pli
    const bid = bidder.locator('button[data-testid^="bid-"]:not([disabled])').nth(1);
    if ((await bid.count()) > 0) await bid.click().catch(() => {});
  }

  // Deux cartes au centre : on voit le pli se construire, et le joueur
  // photographié a encore une main garnie.
  const playing = await playUntilTrickInProgress([host, guest], 2, 60000);
  const tableShot = playing ?? table;
  await settle(tableShot, 600);
  await shoot(tableShot, appLocale, '5-partie');

  if ((await tableShot.locator('[data-testid="open-scores"]').count()) > 0) {
    await tableShot.click('[data-testid="open-scores"]');
    await tableShot.waitForSelector('[data-testid="score-drawer"]', { timeout: 10000 });
    await settle(tableShot);
    await shoot(tableShot, appLocale, '6-scores');
  }

  await hostPhone.context.close();
  await guestPhone.context.close();
}

// ─────────────────────────────────────────────────────────────────── exécution

const browser = await chromium.launch(existsSync(EXEC) ? { executablePath: EXEC } : {});

mkdirSync(OUT, { recursive: true });
mkdirSync(IOS_ASSETS, { recursive: true });

const artPage = await browser.newPage();
await artPage.goto(`${BASE}/`);

const iconPixels = await artPage.evaluate(drawIcon);
const iconPng = encodeRgbPng(Uint8Array.from(iconPixels), 1024, 1024);
// La même image sert deux fois : la fiche du store, et la source dont
// `@capacitor/assets` tire le jeu d'icônes du projet Xcode. Deux dessins
// différents finiraient par diverger — un motif de rejet gratuit.
writeFileSync(`${OUT}/icon-1024.png`, iconPng);
writeFileSync(`${IOS_ASSETS}/icon-only.png`, iconPng);
console.log(`✓ icône  ${OUT}/icon-1024.png + ${IOS_ASSETS}/icon-only.png (1024×1024, RGB sans alpha)`);

for (const [name, dark] of [
  ['splash.png', false],
  ['splash-dark.png', true],
]) {
  const dataUrl = await artPage.evaluate(drawSplash, dark);
  writeFileSync(`${IOS_ASSETS}/${name}`, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(`✓ lancement  ${IOS_ASSETS}/${name} (2732×2732)`);
}
await artPage.close();

if (process.env.SKIP_SHOTS) {
  await browser.close();
  console.log('\nIcône et écrans de lancement seulement (SKIP_SHOTS).');
  process.exit(0);
}

console.log(`\nCaptures — ${SHOT.label}`);
/**
 * Une langue peut échouer sur un simple dépassement de délai : dix-huit
 * parties jouées à la file dans le même navigateur, et la dernière attend un
 * robot qui traîne. Une fiche à laquelle il manque des captures serait publiée
 * bancale — on réessaie donc, plutôt que de se contenter d'un avertissement.
 */
const ATTEMPTS = 3;
const failed = [];
for (const [appLocale, storeLocale] of locales) {
  let done = false;
  for (let attempt = 1; attempt <= ATTEMPTS && !done; attempt++) {
    try {
      await captureLocale(browser, appLocale, storeLocale);
      const dir = `${OUT}/screenshots/${SHOT.dir}${appLocale}`;
      const count = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.jpg')).length : 0;
      if (count >= 6) {
        console.log(`✓ ${appLocale.padEnd(3)} ${count} captures`);
        done = true;
      } else {
        console.log(`… ${appLocale.padEnd(3)} ${count}/6, nouvel essai (${attempt}/${ATTEMPTS})`);
      }
    } catch (e) {
      console.log(`… ${appLocale.padEnd(3)} ${e.message.split('\n')[0]} (${attempt}/${ATTEMPTS})`);
    }
  }
  if (!done) failed.push(appLocale);
}
if (failed.length) {
  console.log(`\n✗ captures incomplètes : ${failed.join(', ')}`);
  process.exitCode = 1;
}

await browser.close();
console.log(`\nTerminé — ${OUT}/`);
