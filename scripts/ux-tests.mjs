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
import { existsSync } from 'node:fs';
import { chromium, devices } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3111';
const SHOTS = process.env.SHOTS_DIR ?? null;

/**
 * Chromium préinstallé (image de conteneur) ou celui que Playwright télécharge
 * lui-même (intégration continue, poste de développement). On ne force le
 * chemin que s'il existe : sinon Playwright choisit le sien.
 */
function chromiumPath() {
  const explicit = process.env.CHROMIUM_PATH;
  if (explicit) return explicit;
  return existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
}

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

const launchOpts = {};
const exec = chromiumPath();
if (exec) launchOpts.executablePath = exec;
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

  // ---- Barème de score : l'hôte choisit, la table entière doit le voir
  const scoringVisible = (await host.page.locator('[data-testid="scoring-picker"]').count()) > 0;
  check('salon : choix du barème de score', scoringVisible);
  if (scoringVisible) {
    const defaultScoring = await host.page.getAttribute('[data-testid="scoring-picker"]', 'data-scoring');
    check('salon : barème classique par défaut', defaultScoring === 'classic', String(defaultScoring));

    const scoringBox = await host.page.locator('[data-testid="scoring-classic"]').boundingBox();
    check(
      'salon : cible du barème ≥ 44px',
      (scoringBox?.height ?? 0) >= MIN_TOUCH - 0.5,
      JSON.stringify(scoringBox),
    );

    // Un invité ne choisit pas le barème, mais il doit pouvoir le lire
    check(
      'salon : l’invité ne modifie pas le barème',
      (await p2.page.locator('[data-testid="scoring-gentle"]').count()) === 0,
    );

    await host.page.click('[data-testid="scoring-gentle"]');
    await p2.page.waitForSelector('[data-testid="scoring-picker"][data-scoring="gentle"]', { timeout: 10000 })
      .then(() => check('salon : barème diffusé à toute la table', true))
      .catch(async () => {
        const seen = await p2.page.getAttribute('[data-testid="scoring-picker"]', 'data-scoring');
        check('salon : barème diffusé à toute la table', false, String(seen));
      });

    const rule = (await p2.page.textContent('[data-testid="scoring-description"]')) ?? '';
    check('salon : la règle du barème est écrite en toutes lettres', rule.trim().length > 20, rule.trim());

    // On revient au barème classique pour la suite du parcours
    await host.page.click('[data-testid="scoring-classic"]');
    await host.page.waitForSelector('[data-testid="scoring-picker"][data-scoring="classic"]', { timeout: 10000 });
  }

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

    // Marge de respiration sous la main : des cartes collées au bord de
    // l'écran sont désagréables à saisir et paraissent rognées.
    const bottomGap = await bidderPage.evaluate(() => {
      const el = document.querySelector('[data-testid="hand-fan"]');
      if (!el) return -1;
      return Math.round(window.innerHeight - el.getBoundingClientRect().bottom);
    });
    check('ANNONCE : marge sous la main ≥ 8px', bottomGap >= 8, `${bottomGap}px`);

    // Les cartes ne doivent recouvrir aucune information au-dessus d'elles
    const clashContract = await overlaps(bidderPage, '[data-testid="hand-fan"]', '[data-testid="my-contract"]');
    check(
      'ANNONCE : la main ne recouvre pas la ligne du joueur',
      clashContract.found && !clashContract.overlap,
      JSON.stringify(clashContract),
    );

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
    const playClash = await overlaps(playPage, '[data-testid="hand-fan"]', '[data-testid="my-contract"]');
    check(
      'JEU : la main ne recouvre pas la ligne du joueur',
      playClash.found && !playClash.overlap,
      JSON.stringify(playClash),
    );
    const playSmall = await smallTouchTargets(playPage, MIN_TOUCH);
    check('JEU : cibles tactiles ≥ 44px', playSmall.length === 0, playSmall.join(' | '));
    if (SHOTS) { await settle(playPage); await playPage.screenshot({ path: `${SHOTS}/${profile.name.replace(/\W+/g, '-')}-04-playing.png` }); }

    // Tiroir des scores accessible en cours de partie
    await playPage.click('[data-testid="open-scores"]');
    await playPage.waitForSelector('[data-testid="score-drawer"]', { timeout: 5000 });
    check('JEU : tiroir des scores s’ouvre', true);
    check('JEU : tiroir sans débordement', await noHorizontalOverflow(playPage));
    if (SHOTS) { await settle(playPage); await playPage.screenshot({ path: `${SHOTS}/${profile.name.replace(/\W+/g, '-')}-05-scores.png` }); }

    // L'historique doit rester consultable sans quitter la partie : sortir de
    // la table pour aller voir ses résultats, personne ne le fait.
    await playPage.click('[data-testid="drawer-tab-history"]');
    await playPage.waitForTimeout(700);
    check(
      'JEU : historique consultable depuis le tiroir',
      (await playPage.locator('[data-testid="score-drawer"]').count()) > 0,
    );
    check('JEU : tiroir historique sans débordement', await noHorizontalOverflow(playPage));

    await playPage.keyboard.press('Escape').catch(() => null);
    await playPage.locator('[data-testid="score-drawer"]').click({ position: { x: 5, y: 5 } }).catch(() => null);
    await playPage.waitForTimeout(400);

    // Les joueurs sont disposés autour du tapis, pas alignés en haut de l'écran
    const seatCount = await playPage.locator('[data-testid="player-seats"] [data-testid^="opponent-"]').count();
    check('JEU : adversaires placés autour de la table', seatCount === 2, String(seatCount));

    // Savoir que c'est à soi ne doit demander aucun effort de lecture
    check(
      'JEU : bandeau « à toi de jouer » présent',
      (await playPage.locator('[data-testid="my-turn-banner"]').count()) > 0,
    );

    // Quitter en cours de partie : indispensable, et jamais sans confirmation
    check('JEU : bouton pour quitter la partie', (await playPage.locator('[data-testid="leave-game"]').count()) > 0);
    await playPage.click('[data-testid="leave-game"]');
    await playPage.waitForSelector('[data-testid="leave-game-confirm"]', { timeout: 5000 });
    check('JEU : sortie confirmée avant d’agir', true);
    await playPage.click('[data-testid="leave-confirm"]', { position: { x: 5, y: 5 } });
    // L'animation de sortie garde l'élément quelques instants : on attend son
    // retrait réel plutôt qu'un délai fixe, qui varie avec la charge machine.
    const leaveClosed = await playPage
      .waitForSelector('[data-testid="leave-game-confirm"]', { state: 'detached', timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    check('JEU : sortie annulable', leaveClosed);

    // L'atout doit se lire d'un coup d'œil : enseigne annoncée, pas devinée
    const trumpSuit = await playPage.locator('[data-testid="trump-badge"]').getAttribute('data-trump');
    check('JEU : enseigne d’atout annoncée', ['S', 'H', 'D', 'C', 'none'].includes(trumpSuit ?? ''), String(trumpSuit));
    const trumpBox = await playPage.locator('[data-testid="trump-badge"]').boundingBox();
    check('JEU : atout suffisamment grand', (trumpBox?.height ?? 0) >= 80, JSON.stringify(trumpBox));

    // Réactions : palette accessible, cibles confortables, envoi sans casse
    await playPage.click('[data-testid="open-emotes"]');
    await playPage.waitForSelector('[data-testid="emote-palette"]', { timeout: 5000 });
    // La palette entre en ressort : mesurer trop tôt lirait une taille réduite
    await playPage.waitForTimeout(500);
    check('JEU : palette de réactions accessible', true);
    const emoteBox = await playPage.locator('[data-testid="emote-clap"]').boundingBox();
    check(
      'JEU : réactions à cible confortable',
      (emoteBox?.height ?? 0) >= MIN_TOUCH - 0.5 && (emoteBox?.width ?? 0) >= MIN_TOUCH - 0.5,
      JSON.stringify(emoteBox),
    );
    await playPage.click('[data-testid="emote-clap"]');
    await playPage.waitForTimeout(600);
    check('JEU : réaction envoyée sans débordement', await noHorizontalOverflow(playPage));
    await playPage.click('[data-testid="open-emotes"]');
    await playPage.waitForTimeout(300);
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
  // Suppression de compte : exigée par l'App Store dès qu'un compte peut être
  // créé (règle 5.1.1(v)). Elle doit rester accessible depuis l'application,
  // sans passer par un e-mail au support, et vider la session sur l'appareil.
  const ctx = await browser.newContext({ ...PROFILES[0], ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`);
  await createProfile(page, 'Suppr');
  await page.waitForSelector('[data-testid="open-profile"]', { timeout: 15000 });
  await page.click('[data-testid="open-profile"]');
  await page.waitForSelector('[data-testid="delete-account"]', { timeout: 10000 });
  check('compte : suppression accessible depuis le profil', true);

  const delBox = await page.locator('[data-testid="delete-account"]').boundingBox();
  check('compte : cible de suppression ≥ 44px', (delBox?.height ?? 0) >= MIN_TOUCH - 0.5, JSON.stringify(delBox));

  // Photo de profil : proposée, et masquable pour qui n'en veut pas
  check('compte : prise de photo proposée', (await page.locator('[data-testid="take-photo"]').count()) > 0);
  const photoBox = await page.locator('[data-testid="take-photo"]').boundingBox();
  check('compte : cible photo ≥ 44px', (photoBox?.height ?? 0) >= MIN_TOUCH - 0.5, JSON.stringify(photoBox));

  const privacyHref = await page.locator('a[href="/privacy.html"]').first().getAttribute('href');
  check('compte : lien vers la politique de confidentialité', privacyHref === '/privacy.html');

  // Rien ne doit partir sans confirmation explicite
  await page.click('[data-testid="delete-account"]');
  await page.waitForSelector('[data-testid="delete-account-confirm"]', { timeout: 5000 });
  check('compte : confirmation demandée avant suppression', true);

  // On attend la réponse du serveur : la page est déjà sur /profile, guetter un
  // changement d'URL se résoudrait immédiatement, avant même l'appel réseau.
  const deleted = page.waitForResponse(
    (r) => r.url().endsWith('/api/me') && r.request().method() === 'DELETE',
    { timeout: 15000 },
  );
  await page.click('[data-testid="delete-account-confirm"]');
  const delRes = await deleted.catch(() => null);
  check('compte : suppression acceptée par le serveur', delRes?.status() === 200, String(delRes?.status()));

  const cleared = await page
    .waitForFunction(
      () => {
        try {
          const raw = localStorage.getItem('rikiki-session');
          return !raw || !JSON.parse(raw)?.state?.token;
        } catch {
          return true;
        }
      },
      { timeout: 10000 },
    )
    .then(() => true)
    .catch(() => false);
  check('compte : session effacée de l’appareil après suppression', cleared);

  const privacy = await page.request.get(`${BASE}/privacy.html`);
  check('confidentialité : page servie en 200', privacy.status() === 200, String(privacy.status()));
  const privacyBody = await privacy.text();
  check(
    'confidentialité : mentionne la suppression du compte',
    /Supprimer mon compte/.test(privacyBody) && /Delete my account/.test(privacyBody),
  );

  await ctx.close();
}

{
  // Écran de règles : accessible et lisible d'un bout à l'autre
  const ctx = await browser.newContext({ ...PROFILES[0], ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`);
  await createProfile(page, 'Lea');
  await page.waitForSelector('[data-testid="open-rules"]', { timeout: 15000 });
  await page.click('[data-testid="open-rules"]');
  await page.waitForSelector('[data-testid="rules-back"]', { timeout: 10000 });
  check('règles : écran accessible depuis l’accueil', true);
  check('règles : pas de débordement horizontal', await noHorizontalOverflow(page));
  const rulesSmall = await smallTouchTargets(page, MIN_TOUCH);
  check('règles : cibles tactiles ≥ 44px', rulesSmall.length === 0, rulesSmall.join(' | '));
  // Le contenu doit être défilable jusqu'au bout, sans texte coupé
  const scrolled = await page.evaluate(() => {
    const el = document.querySelector('.rk-scroll');
    if (!el) return false;
    el.scrollTop = el.scrollHeight;
    return el.scrollTop > 0;
  });
  check('règles : contenu défilable jusqu’au bout', scrolled);
  if (SHOTS) { await settle(page); await page.screenshot({ path: `${SHOTS}/rules.png`, fullPage: false }); }
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
