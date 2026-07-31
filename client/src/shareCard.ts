import type { GameView } from '@rikiki/shared';
import { t } from './i18n';

/**
 * Carte de résultat partageable.
 *
 * Une partie qui se termine sans trace ne donne pas envie d'en relancer une.
 * Un visuel envoyé dans la conversation du groupe, lui, appelle la revanche —
 * c'est le ressort de rétention le plus simple qui soit.
 *
 * Tout est dessiné en canvas : aucune police ni image à charger, donc aucun
 * risque de rendu incomplet au moment de la capture.
 */

const SIZE = 1080;
const FELT_DARK = '#0a1b13';
const FELT = '#163a27';
const BRASS = '#d9b25c';
const BRASS_LIGHT = '#e8cd8a';
const PAPER = '#fdfbf6';
const SUCCESS = '#4ba36f';

/** Teinte d'avatar déterministe, pour que chaque joueur garde la sienne. */
const AVATAR_COLORS = ['#c1953d', '#4ba36f', '#b8323a', '#1565c0', '#9d762c', '#2e7d32'];

function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function drawShareCard(view: GameView): HTMLCanvasElement {
  const m = t();
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  // Fond : tapis avec halo, comme dans le jeu
  ctx.fillStyle = FELT;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const halo = ctx.createRadialGradient(SIZE / 2, SIZE * 0.32, 40, SIZE / 2, SIZE * 0.32, SIZE * 0.75);
  halo.addColorStop(0, 'rgba(53,115,79,0.85)');
  halo.addColorStop(1, FELT_DARK);
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Deux cartes croisées en filigrane
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.translate(SIZE / 2, 168);
  for (const [angle, dx] of [
    [-0.22, -46],
    [0.16, 26],
  ] as const) {
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = PAPER;
    roundRect(ctx, dx - 52, -76, 104, 152, 14);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Titre
  ctx.textAlign = 'center';
  ctx.fillStyle = BRASS_LIGHT;
  ctx.font = 'bold 92px Georgia, "Times New Roman", serif';
  ctx.fillText('Rikiki', SIZE / 2, 210);

  ctx.fillStyle = 'rgba(253,251,246,0.55)';
  ctx.font = '600 30px system-ui, sans-serif';
  ctx.fillText(m.gameOver.toUpperCase(), SIZE / 2, 262);

  // Classement
  const ranked = [...view.players].sort((a, b) => b.totalScore - a.totalScore);
  const rows = ranked.slice(0, 8);
  // Lignes plus hautes quand il y a peu de joueurs : le classement occupe
  // toujours la même zone, sans laisser de vide au milieu de l'image.
  const zoneTop = 320;
  const zoneBottom = 880;
  const rowH = Math.min(112, Math.max(76, (zoneBottom - zoneTop) / rows.length));
  const blockH = rowH * rows.length;
  const top = zoneTop + (zoneBottom - zoneTop - blockH) / 2;
  const cardW = SIZE - 200;
  const left = 100;

  rows.forEach((p, i) => {
    const y = top + i * rowH;
    const winner = i === 0;

    ctx.fillStyle = winner ? 'rgba(217,178,92,0.16)' : 'rgba(10,27,19,0.42)';
    roundRect(ctx, left, y, cardW, rowH - 14, 22);
    ctx.fill();
    if (winner) {
      ctx.strokeStyle = 'rgba(217,178,92,0.45)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Rang
    ctx.textAlign = 'center';
    ctx.fillStyle = winner ? BRASS : 'rgba(253,251,246,0.4)';
    ctx.font = `bold ${winner ? 40 : 30}px system-ui, sans-serif`;
    ctx.fillText(winner ? '★' : String(i + 1), left + 46, y + 52);

    // Pastille du joueur avec son initiale
    const cx = left + 116;
    const cy = y + rowH / 2 - 7;
    ctx.beginPath();
    ctx.arc(cx, cy, 27, 0, Math.PI * 2);
    ctx.fillStyle = colorFor(p.id);
    ctx.fill();
    ctx.fillStyle = PAPER;
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((p.pseudo[0] ?? '?').toUpperCase(), cx, cy + 11);

    // Pseudo
    ctx.textAlign = 'left';
    ctx.fillStyle = PAPER;
    ctx.font = `${winner ? 'bold ' : '600 '}38px system-ui, sans-serif`;
    const name = p.pseudo.length > 14 ? `${p.pseudo.slice(0, 13)}…` : p.pseudo;
    ctx.fillText(name, cx + 44, cy + 13);

    // Score
    ctx.textAlign = 'right';
    ctx.fillStyle = winner ? BRASS_LIGHT : 'rgba(253,251,246,0.75)';
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.fillText(String(p.totalScore), left + cardW - 40, cy + 15);
  });

  // Pied : durée de la partie, puis l'adresse pour rejouer
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(253,251,246,0.5)';
  ctx.font = '500 30px system-ui, sans-serif';
  ctx.fillText(m.formatRounds(view.roundsSequence.length), SIZE / 2, 946);

  // Filet de séparation discret
  ctx.strokeStyle = 'rgba(253,251,246,0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(SIZE / 2 - 120, 984);
  ctx.lineTo(SIZE / 2 + 120, 984);
  ctx.stroke();

  ctx.fillStyle = SUCCESS;
  ctx.font = '600 34px system-ui, sans-serif';
  ctx.fillText(window.location.host, SIZE / 2, 1034);

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

/**
 * Partage le résultat : image via le partage natif quand c'est possible,
 * sinon texte seul, sinon téléchargement. On dégrade sans jamais échouer
 * silencieusement.
 */
export async function shareResult(view: GameView): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const m = t();
  const ranked = [...view.players].sort((a, b) => b.totalScore - a.totalScore);
  const text = [
    m.shareTitle,
    ...ranked.map((p, i) => `${i + 1}. ${p.pseudo} — ${p.totalScore}`),
    '',
    `${window.location.origin}`,
  ].join('\n');

  const canvas = drawShareCard(view);
  const blob = await canvasToBlob(canvas);

  if (blob) {
    const file = new File([blob], 'rikiki.png', { type: 'image/png' });
    // canShare({files}) est le seul test fiable : la présence de share() ne
    // garantit pas la prise en charge des fichiers.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text });
        return 'shared';
      } catch (e) {
        if ((e as Error).name === 'AbortError') return 'cancelled';
      }
    }
  }

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled';
    }
  }

  // Dernier recours : on enregistre l'image, le joueur l'envoie lui-même
  if (blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rikiki.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return 'downloaded';
  }
  return 'cancelled';
}

// Exposé pour l'inspection visuelle automatisée du rendu canvas.
// Réservé au développement : rien n'est attaché au `window` en production.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__rikikiShareCard = drawShareCard;
}
