/**
 * Tests d'ergonomie automatisés (Playwright).
 *
 * Ils vérifient des INVARIANTS d'interface que des tests unitaires ne peuvent
 * pas attraper : ce qui est réellement visible, cliquable et lisible sur un
 * téléphone. Chaque règle correspond à un défaut d'usage constaté ou évitable.
 *
 * Usage :
 *   node scripts/ux-tests.mjs                    # contre http://localhost:3111
 *   BASE_URL=https://… node scripts/ux-tests.mjs
 */
import { chromium, devices } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3111';
const SHOTS = process.env.SHOTS_DIR ?? null;
const EXEC = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';

/** Appareils couverts : du plus petit écran courant au grand format. */
const PROFILES = [
  { name: 'iPhone SE (petit)', viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true },
  { name: 'iPhone 14 Pro', viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true },
  { name: 'Pixel 7', ...devices['Pixel 7'] },
];

/** Cible tactile minimale recommandée (WCAG 2.5.5 / HIG Apple). */
const MIN_TOUCH = 44;

let passed = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const launchOpts = { executablePath: EXEC };
if (process.env.HTTPS_PROXY && BASE.startsWith('https://')) {
  launchOpts.proxy = { server: process.env.HTTPS_PROXY };
}
const browser = await chromium.launch(launchOpts);

async function newPhone(profile, label) {
  const ctx = await browser.newContext({ ...profile, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return { page, ctx, errors, label };
}

/** Laisse les animations d'entrée se terminer avant de capturer. */
async function settle(page, ms = 900) {
  await page.waitForTimeout(ms);
}

async function createProfile(page, pseudo) {
  await page.waitForURL('**/profile', { timeout: 15000 });
  await page.fill('#pseudo', pseudo);
  await page.click('[data-testid="profile-submit"]');
}

/** Aucune partie de la page ne doit déborder horizontalement. */
async function noHorizontalOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth <= doc.clientWidth + 1;
  });
}

/** Toutes les cibles interactives visibles font-elles au moins MIN_TOUCH px ? */
async function smallTouchTargets(page, min) {
  return page.evaluate((minSize) => {
    const bad = [];
    for (const el of document.querySelectorAll('button, a[href], input, [role="button"]')) {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (r.width === 0 || r.height === 0) continue;
      if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') continue;
      // Les cartes à jouer sont volontairement étroites (éventail) mais hautes :
      // on les exclut, leur hauteur garantit une prise en main confortable.
      if (el.closest('[data-testid="hand-fan"]')) continue;
      if (r.height < minSize - 0.5 || r.width < 24) {
        bad.push(`${el.tagName}.${el.className?.toString().slice(0, 30)} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }
    return bad;
  }, min);
}

/** Un élément est-il entièrement dans le viewport (non rogné) ? */
async function isFullyVisible(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    return {
      found: true,
      visible: r.width > 0 && r.height > 0,
      insideViewport: r.top >= -1 && r.bottom <= window.innerHeight + 1 && r.left >= -1 && r.right <= window.innerWidth + 1,
      rect: { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) },
      viewportH: window.innerHeight,
    };
  }, selector);
}

/**
 * Attend qu'un sélecteur apparaisse sur l'UNE des pages fournies et renvoie
 * cette page. Nécessaire dès qu'il y a des robots : ils jouent entre les
 * humains, on ne sait donc pas d'avance qui sera sollicité en premier.
 */
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

/** Deux éléments se chevauchent-ils visuellement ? */
async function overlaps(page, selA, selB) {
  return page.evaluate(
    ([a, b]) => {
      const ea = document.querySelector(a);
      const eb = document.querySelector(b);
      if (!ea || !eb) return { found: false };
      const ra = ea.getBoundingClientRect();
      const rb = eb.getBoundingClientRect();
      const overlap = !(ra.right <= rb.left || ra.left >= rb.right || ra.bottom <= rb.top || ra.top >= rb.bottom);
      return { found: true, overlap, ra: { top: Math.round(ra.top), bottom: Math.round(ra.bottom) }, rb: { top: Math.round(rb.top), bottom: Math.round(rb.bottom) } };
    },
    [selA, selB],
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Parcours complet sur chaque profil d'appareil
// ─────────────────────────────────────────────────────────────────────────────
for (const profile of PROFILES) {
  console.log(`\n▸ ${profile.name}`);

  const host = await newPhone(profile, 'hôte');
  const p2 = await newPhone(profile, 'joueur 2');

  // ---- Accueil / création de profil
  await host.page.goto(`${BASE}/`);
  await createProfile(host.page, 'Alice');
  await host.page.waitForSelector('[data-testid="create-game"]:not([disabled])', { timeout: 15000 });

  check('accueil sans débordement horizontal', await noHorizontalOverflow(host.page));
  const homeSmall = await smallTouchTargets(host.page, MIN_TOUCH);
  check('accueil : cibles tactiles ≥ 44px', homeSmall.length === 0, homeSmall.join(' | '));
  check('accueil : bouton son présent', (await host.page.locator('[data-testid="sound-toggle"]').count()) > 0);
  if (SHOTS) { await settle(host.page); await host.page.screenshot({ path: `${SHOTS}/${profile.name.replace(/\W+/g, '-')}-01-home.png` }); }

  // ---- Salon
  await host.page.click('[data-testid="create-game"]');
  await host.page.waitForSelector('[data-testid="room-code"]', { timeout: 15000 });
  const code = (await host.page.textContent('[data-testid="room-code"]')).trim();
  check('code de partie à 4 lettres', /^[A-Z]{4}$/.test(code), code);
  check('salon sans débordement horizontal', await noHorizontalOverflow(host.page));
  check('salon : bouton son présent', (await host.page.locator('[data-testid="sound-toggle"]').count()) > 0);

  // Ajout d'un joueur automatique (fonctionnalité « compléter la table »)
  const addBotVisible = (await host.page.locator('[data-testid="add-bot"]').count()) > 0;
  check('salon : proposition d’ajouter un robot', addBotVisible);

  // Un humain rejoint via le lien d'invitation
  await p2.page.goto(`${BASE}/j/${code}`);
  await createProfile(p2.page, 'Bob');
  await p2.page.waitForSelector('[data-testid="room-code"]', { timeout: 15000 });

  // À 2 joueurs, la partie ne doit pas pouvoir démarrer
  const startDisabledAt2 = await host.page.locator('[data-testid="start-game"]').isDisabled();
  check('salon : démarrage bloqué à 2 joueurs', startDisabledAt2);

  // On complète avec un robot → 3 joueurs
  if (addBotVisible) {
    await host.page.click('[data-testid="add-bot"]');
    await host.page.waitForFunction(
      () => document.querySelectorAll('[data-testid^="lobby-player-"]').length >= 3,
      { timeout: 10000 },
    );
    const startEnabled = await host.page.locator('[data-testid="start-game"]').isEnabled();
    check('salon : démarrage possible après ajout d’un robot', startEnabled);
  }
  if (SHOTS) { await settle(host.page); await host.page.screenshot({ path: `${SHOTS}/${profile.name.replace(/\W+/g, '-')}-02-lobby.png` }); }

  // ---- Lancement de la partie
  await host.page.click('[data-testid="start-game"]');
  await host.page.waitForSelector('[data-testid="hand-fan"]', { timeout: 15000 });

  // ═══ LE test central : voir ses cartes pendant qu'on annonce son contrat ═══
  // Les robots annoncent entre les humains : on attend qu'une des pages
  // humaines affiche réellement le sélecteur d'annonce.
  const bidderPage = await waitForAny([host.page, p2.page], '[data-testid="bid-picker"]', 25000);

  if (bidderPage) {
    const handInfo = await isFullyVisible(bidderPage, '[data-testid="hand-fan"]');
    check('ANNONCE : la main reste visible', handInfo.found && handInfo.visible, JSON.stringify(handInfo));
    check(
      'ANNONCE : la main est entièrement dans l’écran',
      handInfo.insideViewport,
      JSON.stringify(handInfo),
    );

    const clash = await overlaps(bidderPage, '[data-testid="bid-picker"]', '[data-testid="hand-fan"]');
    check(
      'ANNONCE : le sélecteur ne recouvre pas la main',
      clash.found && !clash.overlap,
      JSON.stringify(clash),
    );

    const cardsVisible = await bidderPage.evaluate(() => {
      const cards = [...document.querySelectorAll('[data-testid^="hand-"]')].filter(
        (el) => el.getAttribute('data-testid') !== 'hand-fan',
      );
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      return cards.map((c) => {
        const r = c.getBoundingClientRect();
        return { inside: r.top >= 0 && r.bottom <= vh + 1 && r.left >= -1 && r.right <= vw + 1, w: Math.round(r.width) };
      });
    });
    check(
      'ANNONCE : toutes les cartes sont dans l’écran',
      cardsVisible.length > 0 && cardsVisible.every((c) => c.inside),
      JSON.stringify(cardsVisible),
    );
    check('ANNONCE : pas de débordement horizontal', await noHorizontalOverflow(bidderPage));

    const bidSmall = await smallTouchTargets(bidderPage, MIN_TOUCH);
    check('ANNONCE : cibles tactiles ≥ 44px', bidSmall.length === 0, bidSmall.join(' | '));
    check(
      'ANNONCE : bouton son toujours accessible',
      (await bidderPage.locator('[data-testid="sound-toggle"]').count()) > 0,
    );
    if (SHOTS) { await settle(bidderPage); await bidderPage.screenshot({ path: `${SHOTS}/${profile.name.replace(/\W+/g, '-')}-03-bidding.png` }); }
  } else {
    check('ANNONCE : sélecteur d’annonce trouvé', false, 'aucun bid-picker affiché');
  }

  // ---- Terminer les annonces (humains + robots) jusqu'au jeu des plis
  for (let i = 0; i < 40; i++) {
    const playing =
      (await host.page.locator('[data-legal="true"]').count()) > 0 ||
      (await p2.page.locator('[data-legal="true"]').count()) > 0;
    if (playing) break;
    let acted = false;
    for (const { page } of [host, p2]) {
      const btn = page.locator('button[data-testid^="bid-"]:not([disabled])').first();
      if ((await btn.count()) > 0) {
        await btn.click();
        acted = true;
        await page.waitForTimeout(250);
      }
    }
    if (!acted) await host.page.waitForTimeout(400);
  }

  // Vérifs pendant le jeu des plis
  const playPage = await waitForAny([host.page, p2.page], '[data-legal="true"]', 20000);
  if (playPage) {
    check('JEU : main visible', (await isFullyVisible(playPage, '[data-testid="hand-fan"]')).insideViewport);
    check('JEU : zone de pli visible', (await isFullyVisible(playPage, '[data-testid="trick-area"]')).visible);
    check('JEU : pas de débordement horizontal', await noHorizontalOverflow(playPage));
    check('JEU : indication du tour affichée', (await playPage.locator('[data-testid="turn-status"]').count()) > 0);
    check('JEU : contrat personnel affiché', (await playPage.locator('[data-testid="my-contract"]').count()) > 0);
    const playSmall = await smallTouchTargets(playPage, MIN_TOUCH);
    check('JEU : cibles tactiles ≥ 44px', playSmall.length === 0, playSmall.join(' | '));
    if (SHOTS) { await settle(playPage); await playPage.screenshot({ path: `${SHOTS}/${profile.name.replace(/\W+/g, '-')}-04-playing.png` }); }

    // Tiroir des scores accessible en cours de partie
    await playPage.click('[data-testid="open-scores"]');
    await playPage.waitForSelector('[data-testid="score-drawer"]', { timeout: 5000 });
    check('JEU : tiroir des scores s’ouvre', true);
    check('JEU : tiroir sans débordement', await noHorizontalOverflow(playPage));
    if (SHOTS) { await settle(playPage); await playPage.screenshot({ path: `${SHOTS}/${profile.name.replace(/\W+/g, '-')}-05-scores.png` }); }
    await playPage.keyboard.press('Escape').catch(() => null);
    await playPage.locator('[data-testid="score-drawer"]').click({ position: { x: 5, y: 5 } }).catch(() => null);
  } else {
    check('JEU : phase de jeu atteinte', false, 'aucune carte jouable détectée');
  }

  // ---- Aucune erreur JavaScript sur tout le parcours
  const allErrors = [...host.errors, ...p2.errors].filter(
    (e) => !/favicon|manifest|Failed to load resource/i.test(e),
  );
  check('aucune erreur JavaScript', allErrors.length === 0, allErrors.slice(0, 3).join(' | '));

  await host.ctx.close();
  await p2.ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// Vérifications transverses (une seule fois)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▸ Accessibilité et préférences système');
{
  // Mouvement réduit : l'interface doit rester utilisable
  const ctx = await browser.newContext({
    ...PROFILES[1],
    reducedMotion: 'reduce',
    ignoreHTTPSErrors: true,
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`);
  await createProfile(page, 'Zoe');
  await page.waitForSelector('[data-testid="create-game"]:not([disabled])', { timeout: 15000 });
  check('mouvement réduit : accueil fonctionnel', await noHorizontalOverflow(page));
  await ctx.close();
}

{
  // Le réglage du son doit persister d'une session à l'autre
  const ctx = await browser.newContext({ ...PROFILES[1], ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`);
  await createProfile(page, 'Momo');
  await page.waitForSelector('[data-testid="sound-toggle"]', { timeout: 15000 });
  await page.click('[data-testid="sound-toggle"]');
  const mutedAfterClick = await page.locator('[data-testid="sound-toggle"]').getAttribute('aria-pressed');
  await page.reload();
  await page.waitForSelector('[data-testid="sound-toggle"]', { timeout: 15000 });
  const mutedAfterReload = await page.locator('[data-testid="sound-toggle"]').getAttribute('aria-pressed');
  check('son : le réglage persiste après rechargement', mutedAfterClick === mutedAfterReload, `${mutedAfterClick} → ${mutedAfterReload}`);
  await ctx.close();
}

{
  // Manifest PWA et titre de page
  const ctx = await browser.newContext({ ...PROFILES[1], ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const res = await page.goto(`${BASE}/`);
  check('page servie en 200', res?.status() === 200, String(res?.status()));
  const title = await page.title();
  check('titre de page renseigné', title.length > 3, title);
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href').catch(() => null);
  check('manifest PWA déclaré', Boolean(manifestHref), String(manifestHref));
  const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content').catch(() => null);
  check('couleur de thème déclarée', Boolean(themeColor), String(themeColor));
  await ctx.close();
}

await browser.close();

console.log(`\n${'─'.repeat(60)}`);
console.log(`${passed} vérifications réussies, ${failures.length} échec(s)`);
if (failures.length > 0) {
  console.log('\nÉchecs :');
  failures.forEach((f) => console.log(`  ✗ ${f}`));
  process.exit(1);
}
console.log('✅ Tous les tests d’ergonomie passent');
