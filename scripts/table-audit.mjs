/**
 * Audit géométrique de la table, sur le rendu réel.
 *
 * Le test unitaire `client/test/tableLayout.test.ts` vérifie le MODÈLE de mise
 * en page pour toutes les tailles de tapis. Ce script vérifie que le rendu s'y
 * conforme : il monte une vraie table avec des robots, joue jusqu'à une manche
 * fournie, puis mesure les boîtes du DOM.
 *
 * Il n'est pas dans l'intégration continue — une partie complète à huit prend
 * plusieurs minutes. On le lance à la main quand on touche au tapis.
 *
 * Usage :
 *   node scripts/table-audit.mjs                  # 8 joueurs, 6 cartes
 *   OPP=4 MIN_CARDS=8 node scripts/table-audit.mjs
 *   DEVICES=se node scripts/table-audit.mjs       # un seul format d'écran
 */
import { existsSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3111';
const SHOTS = process.env.SHOTS_DIR ?? null;
const EXEC = ['/opt/pw-browsers/chromium', process.env.CHROMIUM_PATH].find((p) => p && existsSync(p));

/** Nombre d'adversaires (7 = table pleine) et taille de manche visée. */
const OPP = Number(process.env.OPP ?? 7);
const MIN_CARDS = Number(process.env.MIN_CARDS ?? 6);

const ALL_DEVICES = [
  { name: 'small', width: 360, height: 640, scale: 2 },
  { name: 'se', width: 375, height: 667, scale: 2 },
  { name: 'pro', width: 393, height: 852, scale: 3 },
];
const DEVICES = process.env.DEVICES
  ? ALL_DEVICES.filter((d) => process.env.DEVICES.split(',').includes(d.name))
  : ALL_DEVICES;

if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch(EXEC ? { executablePath: EXEC } : {});
const problems = [];

function report(label, detail) {
  problems.push(`${label} — ${detail}`);
  console.log(`  ✗ ${label} — ${detail}`);
}

/**
 * Relevé exécuté dans la page : positions réelles des sièges, des cartes du
 * pli et de la main. Tout est en pixels CSS, dans le repère du viewport.
 */
const measure = () => {
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom) };
  };
  const hit = (a, b) => !(a.r <= b.l || a.l >= b.r || a.b <= b.t || a.t >= b.b);
  const area = (a, b) =>
    Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
  const qa = (s) => [...document.querySelectorAll(s)];

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const outside = (b) => b.l < -0.5 || b.t < -0.5 || b.r > vw + 0.5 || b.b > vh + 0.5;

  const seats = qa('[data-testid^="opponent-"]').map((el) => ({ id: el.dataset.testid, box: box(el) }));
  const trick = qa('[data-testid^="trick-card-"]').map((el) => ({
    id: el.dataset.testid,
    box: box(el),
    z: Number(el.style.zIndex || 0),
  }));
  const hand = qa('[data-testid^="hand-"]')
    .filter((e) => e.dataset.testid !== 'hand-fan')
    .map((el) => ({ id: el.dataset.testid, box: box(el) }));
  const trumpEl = document.querySelector('[data-testid="trump-badge"]');
  const trump = trumpEl ? box(trumpEl) : null;

  return {
    vw,
    vh,
    counts: { seats: seats.length, trick: trick.length, hand: hand.length },
    docOverflow: document.documentElement.scrollWidth - vw,
    seatsOut: seats.filter((s) => outside(s.box)).map((s) => s.id),
    trickOut: trick.filter((c) => outside(c.box)).map((c) => c.id),
    handOut: hand.filter((c) => outside(c.box)).map((c) => c.id),
    seatOnSeat: seats.filter((a, i) => seats.some((b, j) => j > i && hit(a.box, b.box))).map((s) => s.id),
    seatOnTrick: seats.filter((s) => trick.some((c) => hit(s.box, c.box))).map((s) => s.id),
    seatOnTrump: trump ? seats.filter((s) => hit(s.box, trump)).map((s) => s.id) : [],
    // Une carte posée peut être recouverte — c'est normal sur une vraie table —
    // pourvu que son index (rang et enseigne, coin haut-gauche) reste lisible.
    indexHidden: trick
      .filter((a) => {
        const w = a.box.r - a.box.l;
        const h = a.box.b - a.box.t;
        const index = { l: a.box.l, t: a.box.t, r: a.box.l + w * 0.42, b: a.box.t + h * 0.34 };
        const own = (index.r - index.l) * (index.b - index.t);
        return trick.some((b) => b !== a && b.z > a.z && area(index, b.box) / own > 0.15);
      })
      .map((c) => c.id),
    truncated: qa('.truncate')
      .filter((el) => el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0)
      .map((el) => `${el.textContent?.trim().slice(0, 24)} (${el.clientWidth}<${el.scrollWidth})`),
  };
};

function check(tag, phase, m) {
  const p = `${tag} ${phase}`;
  const rules = [
    ['débordement horizontal', m.docOverflow > 0 ? `${m.docOverflow}px` : ''],
    ['sièges hors écran', m.seatsOut.join(', ')],
    ['cartes du pli hors écran', m.trickOut.join(', ')],
    ['cartes de la main hors écran', m.handOut.join(', ')],
    ['sièges qui se chevauchent', m.seatOnSeat.join(', ')],
    ['le pli recouvre un siège', m.seatOnTrick.join(', ')],
    ['l’atout masque un joueur', m.seatOnTrump.join(', ')],
    ['index de carte masqué', m.indexHidden.join(', ')],
    ['texte tronqué', m.truncated.join(' | ')],
  ];
  for (const [label, detail] of rules) if (detail) report(p, `${label} : ${detail}`);
  console.log(`  · ${p} : ${m.vw}×${m.vh} · ${m.counts.seats} sièges, ${m.counts.trick} au pli, ${m.counts.hand} en main`);
}

async function audit(dev) {
  const tag = `${OPP + 1}j/${dev.name}`;
  const ctx = await browser.newContext({
    viewport: { width: dev.width, height: dev.height },
    deviceScaleFactor: dev.scale,
    isMobile: true,
    hasTouch: true,
    locale: 'fr-FR',
    ignoreHTTPSErrors: true,
  });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('rikiki-lang', 'fr');
    } catch {
      /* stockage indisponible : la langue par défaut fera l'affaire */
    }
  });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/`);
  await page.waitForURL('**/profile', { timeout: 20000 });
  // Un pseudo long : c'est lui qui révèle les troncatures.
  await page.fill('#pseudo', 'Alexandrine');
  await page.click('[data-testid="profile-submit"]');
  await page.waitForSelector('[data-testid="create-game"]:not([disabled])', { timeout: 20000 });
  await page.click('[data-testid="create-game"]');
  await page.waitForSelector('[data-testid="room-code"]', { timeout: 20000 });
  for (let i = 0; i < OPP; i++) {
    await page.click('[data-testid="add-bot"]');
    await page.waitForTimeout(150);
  }
  await page.click('[data-testid="start-game"]');
  await page.waitForSelector('[data-testid="hand-fan"]', { timeout: 20000 });

  const shoot = async (name) => {
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/table-${OPP + 1}j-${dev.name}-${name}.png` });
  };

  const seen = new Set();
  const deadline = Date.now() + 300000;
  while (Date.now() < deadline) {
    const cards = await page.evaluate(
      () => [...document.querySelectorAll('[data-testid^="hand-"]')].filter((e) => e.dataset.testid !== 'hand-fan').length,
    );
    const bidding = await page.$('[data-testid="bid-picker"]');
    const recap = await page.$('[data-testid="next-round"]');

    if (bidding) {
      if (cards >= MIN_CARDS && !seen.has('bid')) {
        seen.add('bid');
        await page.waitForTimeout(800);
        check(tag, 'ANNONCE', await page.evaluate(measure));
        await shoot('bid');
      }
      const btns = await page.$$('[data-testid^="bid-"]:not([data-testid="bid-picker"])');
      if (btns[0]) await btns[0].click().catch(() => undefined);
    } else if (recap) {
      await recap.click().catch(() => undefined);
    } else {
      const legal = await page.$$('[data-testid^="hand-"][data-legal="true"]');
      if (legal.length) {
        if (cards >= MIN_CARDS && !seen.has('play')) {
          seen.add('play');
          await page.waitForTimeout(800);
          check(tag, 'JEU', await page.evaluate(measure));
          await shoot('play');

          // Pire cas : le pli complet. C'est là que les cartes se marchent
          // dessus si la géométrie est fausse.
          await legal[0].click().catch(() => undefined);
          let posed = 0;
          for (let k = 0; k < 60; k++) {
            const c = await page.evaluate(() =>
              Number(document.querySelector('[data-testid="trick-area"]')?.dataset.trickCards ?? 0),
            );
            if (c >= OPP) {
              posed = c;
              break;
            }
            if (c < posed) break;
            posed = Math.max(posed, c);
            await page.waitForTimeout(150);
          }
          await page.waitForTimeout(400);
          check(tag, `PLI(${posed})`, await page.evaluate(measure));
          await shoot('trick');
          await ctx.close();
          return;
        }
        await legal[0].click().catch(() => undefined);
      }
    }
    await page.waitForTimeout(200);
  }
  await ctx.close();
}

for (const dev of DEVICES) {
  await audit(dev).catch((e) => report(`${OPP + 1}j/${dev.name}`, e.message));
}
await browser.close();

console.log('\n' + '─'.repeat(60));
if (problems.length === 0) {
  console.log('✅ Aucun défaut de géométrie sur le rendu réel');
} else {
  console.log(`${problems.length} problème(s)`);
  process.exitCode = 1;
}
