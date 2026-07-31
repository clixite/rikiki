import { useEffect, useRef } from 'react';

interface Props {
  /** Déclenche une salve à chaque incrément. */
  trigger: number;
  /** Salve courte (fin de manche) ou nourrie (victoire finale). */
  intensity?: 'light' | 'full';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  color: string;
  life: number;
}

/** Palette du jeu : laiton, papier, et les deux couleurs des cartes. */
const COLORS = ['#d9b25c', '#e8cd8a', '#fdfbf6', '#b8323a', '#4ba36f'];

/**
 * Confettis en canvas, sans dépendance ni image.
 *
 * Volontairement bref (moins de deux secondes) : la fête doit ponctuer le
 * jeu, pas retarder la manche suivante. Respecte `prefers-reduced-motion`.
 */
export default function Confetti({ trigger, intensity = 'full' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (trigger === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const count = intensity === 'full' ? 90 : 36;
    const particles: Particle[] = Array.from({ length: count }, () => {
      // Deux gerbes latérales : plus vivant qu'une pluie uniforme
      const fromLeft = Math.random() < 0.5;
      return {
        x: fromLeft ? width * 0.12 : width * 0.88,
        y: height * 0.62,
        vx: (fromLeft ? 1 : -1) * (2 + Math.random() * 4.5),
        vy: -(6 + Math.random() * 6),
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
        w: 5 + Math.random() * 5,
        h: 8 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1,
      };
    });

    const GRAVITY = 0.28;
    const DRAG = 0.992;
    let elapsed = 0;

    const render = () => {
      elapsed += 1;
      ctx.clearRect(0, 0, width, height);
      let alive = false;

      for (const p of particles) {
        p.vy += GRAVITY;
        p.vx *= DRAG;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        // Disparition progressive sur la fin de course
        p.life = Math.max(0, 1 - elapsed / (intensity === 'full' ? 110 : 75));
        if (p.life > 0 && p.y < height + 40) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }

      if (alive) {
        frameRef.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    frameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameRef.current);
  }, [trigger, intensity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="confetti"
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />
  );
}
