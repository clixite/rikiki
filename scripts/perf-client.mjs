/**
 * Performance côté téléphone.
 *
 * `server/test/performance.test.ts` mesure le serveur : il tient largement.
 * Mais c'est le téléphone qui rame — et une table à huit joueurs anime huit
 * sièges, un pli, un éventail de cartes et des ressorts un peu partout. Ce
 * script joue une vraie partie dans un vrai Chromium et mesure ce que le
 * joueur ressent : le temps d'ouverture, la réactivité au toucher, les à-coups
 * pendant les animations, et la mémoire au fil des plis.
 *
 * Hors intégration continue, comme `table-audit.mjs` : une partie complète à
 * huit prend plusieurs minutes.
 *
 * Usage :
 *   node scripts/perf-client.mjs
 *   OPP=3 node scripts/perf-client.mjs        # table à 4
 *   BASE_URL=https://rikiki.example.com node scripts/perf-client.mjs
 */
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3111';
const EXEC = ['/opt/pw-browsers/chromium', process.env.CHROMIUM_PATH].find((p) => p && existsSync(p));
/** Sept adversaires : la table pleine, le pire cas d'animation. */
const OPP = Number(process.env.OPP ?? 7);
/** Nombre de plis observés avant de conclure sur la mémoire. */
const TRICKS = Number(process.env.TRICKS ?? 12);

/*
 * Seuils.
 *
 * Ils portent sur un ordinateur de bureau bridé à 4× (`CPU.setThrottlingRate`),
 * ce qui approche un téléphone d'entrée de gamme. Ils sont larges à dessein :
 * ce script sert à repérer une VRAIE régression — un rendu qui part en boucle,
 * une fuite de mémoire, une animation qui bloque le fil principal — pas à
 * départager deux millisecondes.
 */
const LIMITS = {
  /** Ouverture : premier rendu utile. Au-delà, on croit l'application cassée. */
  firstPaintMs: 4000,
  /** Interactivité : du clic sur une carte à sa disparition de la main. */
  tapToPaintMs: 400,
  /** Blocage cumulé du fil principal pendant une manche entière. */
  blockingMs: 3000,
  /** Plus longue tâche unique : au-delà, le doigt sent le à-coup. */
  longestTaskMs: 400,
  /** Croissance du tas sur `TRICKS` plis : une fuite se voit tout de suite. */
  heapGrowthMb: 24,
};

const results = [];
const problems = [];

function record(label, value, unit, limit) {
  const ok = limit === null || value <= limit;
  results.push({ label, value, unit, limit, ok });
  const shown = `${Math.round(value * 10) / 10} ${unit}`;
  const target = limit === null ? '' : ` (seuil ${limit} ${unit})`;
  console.log(`  ${ok ? '✓' : '✗'} ${label} : ${shown}${target}`);
  if (!ok) problems.push(`${label} : ${shown}, seuil ${limit} ${unit}`);
}

const browser = await chromium.launch(EXEC ? { executablePath: EXEC } : {});
const ctx = await browser.newContext({
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  locale: 'fr-FR',
  ignoreHTTPSErrors: true,
});
const page = await ctx.newPage();

/*
 * Observateur de tâches longues, installé AVANT tout script de la page : une
 * tâche de plus de 50 ms bloque le fil principal, donc le toucher. C'est la
 * mesure qui dit si les animations tiennent, là où un simple chronomètre ne
 * verrait qu'un total.
 */
await page.addInitScript(() => {
  window.__tasks = [];
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__tasks.push(e.duration);
    }).observe({ entryTypes: ['longtask'] });
  } catch {
    /* navigateur sans longtask : les autres mesures restent valables */
  }
  try {
    localStorage.setItem('rikiki-lang', 'fr');
  } catch {
    /* stockage indisponible */
  }
});

// Un téléphone d'entrée de gamme, pas une station de travail.
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

console.log(`▸ Ouverture de l’application (CPU bridé 4×)`);
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#pseudo, [data-testid="create-game"]', { timeout: 30000 });
const nav = await page.evaluate(() => {
  const [e] = performance.getEntriesByType('navigation');
  const fcp = performance.getEntriesByName('first-contentful-paint')[0];
  return {
    fcp: fcp?.startTime ?? e?.domContentLoadedEventEnd ?? 0,
    transferKb:
      performance
        .getEntriesByType('resource')
        .reduce((sum, r) => sum + (r.transferSize || 0), 0) / 1024,
  };
});
record('ouverture jusqu’au premier rendu', nav.fcp, 'ms', LIMITS.firstPaintMs);
record('poids téléchargé au démarrage', nav.transferKb, 'Ko', null);

console.log(`\n▸ Partie à ${OPP + 1} joueurs`);
await page.fill('#pseudo', 'Alexandrine');
await page.click('[data-testid="profile-submit"]');
await page.waitForSelector('[data-testid="create-game"]:not([disabled])', { timeout: 30000 });
await page.click('[data-testid="create-game"]');
await page.waitForSelector('[data-testid="room-code"]', { timeout: 30000 });
for (let i = 0; i < OPP; i++) {
  await page.click('[data-testid="add-bot"]');
  await page.waitForTimeout(120);
}
await page.click('[data-testid="start-game"]');
await page.waitForSelector('[data-testid="hand-fan"]', { timeout: 30000 });

const heapNow = () => page.evaluate(() => performance.memory?.usedJSHeapSize ?? 0);
const cardsInHand = () =>
  page.evaluate(
    () =>
      [...document.querySelectorAll('[data-testid^="hand-"]')].filter(
        (e) => e.dataset.testid !== 'hand-fan',
      ).length,
  );

// Remise à zéro des compteurs : ce qui précède est de l'installation, pas du jeu.
await page.evaluate(() => {
  window.__tasks.length = 0;
});
const heapStart = await heapNow();

let taps = 0;
let tapTotal = 0;
let tapWorst = 0;
let tricksSeen = 0;
const deadline = Date.now() + 600000;

while (tricksSeen < TRICKS && Date.now() < deadline) {
  const recap = await page.$('[data-testid="next-round"]');
  if (recap) {
    await recap.click().catch(() => undefined);
    await page.waitForTimeout(300);
    continue;
  }

  const bidBtn = await page.$('[data-testid^="bid-"]:not([data-testid="bid-picker"])');
  if (bidBtn) {
    await bidBtn.click().catch(() => undefined);
    await page.waitForTimeout(200);
    continue;
  }

  const legal = await page.$$('[data-testid^="hand-"][data-legal="true"]');
  if (legal.length) {
    /*
     * Réactivité au toucher : le jeu pose la carte SANS attendre le serveur
     * (coup optimiste). On mesure donc bien le rendu local, pas le réseau —
     * c'est exactement ce que le doigt ressent.
     */
    const before = await cardsInHand();
    const t0 = Date.now();
    await legal[0].click({ force: true }).catch(() => undefined);
    for (let k = 0; k < 80; k++) {
      if ((await cardsInHand()) < before) break;
      await page.waitForTimeout(10);
    }
    const dt = Date.now() - t0;
    taps++;
    tapTotal += dt;
    tapWorst = Math.max(tapWorst, dt);
    tricksSeen++;
    continue;
  }

  await page.waitForTimeout(150);
}

const tasks = await page.evaluate(() => window.__tasks.slice());
const heapEnd = await heapNow();

console.log('');
record('délai moyen du toucher à l’affichage', taps ? tapTotal / taps : 0, 'ms', LIMITS.tapToPaintMs);
record('pire délai du toucher à l’affichage', tapWorst, 'ms', LIMITS.tapToPaintMs * 2);
// Le « blocage » ne compte que ce qui dépasse 50 ms : en deçà, le fil
// principal reprend la main assez vite pour que rien ne se voie.
const blocking = tasks.reduce((sum, d) => sum + Math.max(0, d - 50), 0);
record('blocage cumulé du fil principal', blocking, 'ms', LIMITS.blockingMs);
record('plus longue tâche unique', tasks.length ? Math.max(...tasks) : 0, 'ms', LIMITS.longestTaskMs);
record('tâches de plus de 50 ms', tasks.length, 'tâches', null);

if (heapStart > 0) {
  record('croissance du tas', (heapEnd - heapStart) / 1024 / 1024, 'Mo', LIMITS.heapGrowthMb);
} else {
  console.log('  · mémoire non mesurable (performance.memory absent)');
}
record('cartes jouées pendant la mesure', taps, 'cartes', null);

await ctx.close();
await browser.close();

console.log('\n' + '─'.repeat(60));
if (problems.length === 0) {
  console.log('✅ Performance conforme sur téléphone simulé');
} else {
  console.log(`${problems.length} dépassement(s) :`);
  for (const p of problems) console.log(`  · ${p}`);
  process.exitCode = 1;
}
