import { describe, expect, it } from 'vitest';
import {
  CARD_RATIO,
  INDEX_H,
  INDEX_W,
  STATUS_H,
  WINNER_GROWTH,
  feltLayout,
  type FeltLayout,
  type Point,
} from '../src/components/tableLayout';

/**
 * Géométrie du tapis.
 *
 * Ces règles ont toutes une histoire : à huit joueurs sur un iPhone SE, la
 * table affichait trois adversaires à moitié hors écran, un cartouche d'atout
 * posé sur deux d'entre eux, et un pli replié sur trois rangées par-dessus
 * tout le monde. Rien de cela n'apparaissait dans un test — d'où celui-ci, qui
 * balaie toutes les tailles de tapis plausibles.
 */

interface Box {
  l: number;
  t: number;
  r: number;
  b: number;
}

const box = (c: Point, w: number, h: number): Box => ({
  l: c.x - w / 2,
  t: c.y - h / 2,
  r: c.x + w / 2,
  b: c.y + h / 2,
});

const overlaps = (a: Box, b: Box): boolean => !(a.r <= b.l || a.l >= b.r || a.b <= b.t || a.t >= b.b);

const overlapArea = (a: Box, b: Box): number =>
  Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));

const seatBoxes = (l: FeltLayout): Box[] => l.seats.map((s) => box(s, l.seatW, l.seatH));

/** Toutes les cartes posées, avec leur plan d'empilement. */
function trickBoxes(l: FeltLayout): { box: Box; z: number }[] {
  const cards = l.slots.map((s, i) => ({ box: box(s, l.trickCardW, l.trickCardH), z: i }));
  // La mienne, jetée par le bas, passe devant toutes les autres.
  cards.push({ box: box(l.mySlot, l.trickCardW, l.trickCardH), z: 1000 });
  return cards;
}

/**
 * Les mêmes, mais chacune supposée remporter le pli : la carte gagnante est
 * agrandie, et c'est elle qui débordait de l'écran depuis un siège d'extrémité.
 */
function winnerBoxes(l: FeltLayout): Box[] {
  const w = l.trickCardW * (1 + WINNER_GROWTH);
  const h = l.trickCardH * (1 + WINNER_GROWTH);
  return [...l.slots, l.mySlot].map((s) => box(s, w, h));
}

/**
 * Tailles de feutre réellement rencontrées : du plus petit Android portrait
 * (360 × 640, dont il reste ~300 de tapis une fois l'en-tête, la barre
 * d'annonce et la main retirés) au grand iPhone.
 */
const WIDTHS = [320, 344, 360, 375, 390, 412, 430, 480];
const HEIGHTS = [300, 340, 380, 420, 480, 540, 620];
const TABLES = [1, 2, 3, 4, 5, 6, 7];

interface Case {
  layout: FeltLayout;
  width: number;
  height: number;
  ctx: string;
}

const CASES: Case[] = [];
for (const n of TABLES) {
  for (const width of WIDTHS) {
    for (const height of HEIGHTS) {
      CASES.push({ layout: feltLayout(n, width, height), width, height, ctx: `${n + 1} joueurs · ${width}×${height}` });
    }
  }
}

/** Signale le premier cas fautif avec son contexte, plutôt qu'un `false` nu. */
function expectNone(offenders: string[]): void {
  expect(offenders.slice(0, 5)).toEqual([]);
}

describe('géométrie du tapis', () => {
  it('garde chaque siège entièrement dans le tapis', () => {
    expectNone(
      CASES.flatMap(({ layout, width, height, ctx }) =>
        seatBoxes(layout)
          .filter((b) => b.l < -0.5 || b.t < -0.5 || b.r > width + 0.5 || b.b > height + 0.5)
          .map((b) => `${ctx} → siège ${JSON.stringify(b)}`),
      ),
    );
  });

  it('ne laisse jamais deux sièges se chevaucher', () => {
    expectNone(
      CASES.flatMap(({ layout, ctx }) => {
        const boxes = seatBoxes(layout);
        const bad: string[] = [];
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) {
            if (overlaps(boxes[i], boxes[j])) bad.push(`${ctx} → sièges ${i} et ${j}`);
          }
        }
        return bad;
      }),
    );
  });

  it('garde chaque carte du pli entièrement dans le tapis', () => {
    expectNone(
      CASES.flatMap(({ layout, width, height, ctx }) =>
        trickBoxes(layout)
          .filter(({ box: b }) => b.l < -0.5 || b.t < -0.5 || b.r > width + 0.5 || b.b > height + 0.5)
          .map(({ box: b }) => `${ctx} → carte ${JSON.stringify(b)}`),
      ),
    );
  });

  it('ne fait jamais chevaucher une carte du pli et un siège', () => {
    expectNone(
      CASES.flatMap(({ layout, ctx }) => {
        const seats = seatBoxes(layout);
        return trickBoxes(layout).flatMap(({ box: card }) =>
          seats.filter((s) => overlaps(card, s)).map((_, i) => `${ctx} → carte sur le siège ${i}`),
        );
      }),
    );
  });

  it('garde dans le tapis la carte du pli remporté, agrandissement compris', () => {
    expectNone(
      CASES.flatMap(({ layout, width, height, ctx }) =>
        winnerBoxes(layout)
          .filter((b) => b.l < -0.5 || b.t < -0.5 || b.r > width + 0.5 || b.b > height + 0.5)
          .map((b) => `${ctx} → gagnante ${JSON.stringify(b)}`),
      ),
    );
  });

  it('laisse lisible l’index de chaque carte posée', () => {
    expectNone(
      CASES.flatMap(({ layout, ctx }) => {
        const cards = trickBoxes(layout);
        return cards
          .filter((card) => {
            const index: Box = {
              l: card.box.l,
              t: card.box.t,
              r: card.box.l + layout.trickCardW * INDEX_W,
              b: card.box.t + layout.trickCardH * INDEX_H,
            };
            const area = (index.r - index.l) * (index.b - index.t);
            const covered = cards
              .filter((o) => o.z > card.z)
              .reduce((sum, o) => sum + overlapArea(index, o.box), 0);
            return covered / area > 0.02;
          })
          .map((c) => `${ctx} → index masqué (plan ${c.z})`);
      }),
    );
  });

  it('pose chaque carte exactement à l’aplomb de son propriétaire', () => {
    expectNone(
      CASES.flatMap(({ layout, ctx }) =>
        layout.slots
          .map((slot, i) => ({ i, dx: Math.abs(slot.x - layout.seats[i].x) }))
          // C'est tout l'intérêt de la disposition : la position dit qui a
          // joué. Le moindre décalage brouille cette lecture.
          .filter(({ dx }) => dx > 0.01)
          .map(({ i, dx }) => `${ctx} → carte ${i} décalée de ${dx.toFixed(1)}px`),
      ),
    );
  });

  it('garde une carte lisible, jamais réduite en timbre-poste', () => {
    expectNone(
      CASES.filter(({ layout }) => layout.trickCardW < 38 || Math.abs(layout.trickCardH / layout.trickCardW - CARD_RATIO) > 1e-9).map(
        ({ ctx, layout }) => `${ctx} → carte ${Math.round(layout.trickCardW)}px`,
      ),
    );
  });

  it('laisse libre la bande d’état et le bouton des réactions', () => {
    expectNone(
      CASES.filter(({ layout, height }) => layout.mySlot.y + layout.trickCardH / 2 > height - STATUS_H + 0.5).map(
        ({ ctx, layout, height }) =>
          `${ctx} → le pli descend à ${Math.round(layout.mySlot.y + layout.trickCardH / 2)} sur ${height}`,
      ),
    );
  });

  it('place le premier adversaire à ma gauche et le dernier à ma droite', () => {
    for (const n of TABLES) {
      const xs = feltLayout(n, 390, 400).seats.map((s) => s.x);
      // L'ordre du tour se lit de gauche à droite, sans exception.
      expect(xs).toEqual([...xs].sort((a, b) => a - b));
    }
  });

  it('ne renvoie que des nombres finis, même sur un tapis dégénéré', () => {
    for (const n of [0, 1, 7]) {
      for (const [w, h] of [
        [0, 0],
        [1, 1],
        [320, 40],
      ]) {
        const layout = feltLayout(n, w, h);
        for (const p of [...layout.seats, ...layout.slots, layout.mySlot, layout.centre]) {
          expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
        }
        expect(Number.isFinite(layout.trickCardW) && layout.trickCardW > 0).toBe(true);
      }
    }
  });
});
