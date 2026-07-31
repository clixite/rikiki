import type { ReactNode } from 'react';

/**
 * Avatars Rikiki — pictogrammes géométriques dessinés en SVG.
 *
 * Parti pris : vocabulaire Bauhaus / affiche sérigraphiée — disques, arcs,
 * triangles, bandes. Aucun visage, aucun emoji, aucune image externe : tout est
 * du SVG inline, donc net à n'importe quelle taille et sans requête réseau.
 *
 * Contraintes de lisibilité : chaque motif doit rester identifiable à 24 px
 * (barre des adversaires) comme à 80 px (aperçu du profil). D'où des formes
 * larges, deux ou trois aplats maximum, et un contraste fond/forme systématique.
 *
 * La palette provient exclusivement du design system (`styles/index.css`) : on
 * référence les variables CSS, avec une valeur de repli au cas où la feuille de
 * style ne serait pas chargée (rendu hors application, aperçu statique…).
 */
const C = {
  ink: 'var(--color-ink, #1a1712)',
  feltDeep: 'var(--color-felt-950, #0a1b13)',
  feltNight: 'var(--color-felt-900, #10291c)',
  feltDark: 'var(--color-felt-700, #1d4a31)',
  feltMid: 'var(--color-felt-600, #275b3d)',
  felt: 'var(--color-felt-500, #35734f)',
  feltLight: 'var(--color-felt-400, #4a8f6a)',
  brassPale: 'var(--color-brass-200, #f4e4b8)',
  brassLight: 'var(--color-brass-300, #e8cd8a)',
  brass: 'var(--color-brass-400, #d9b25c)',
  brassDeep: 'var(--color-brass-500, #c1953d)',
  brassDark: 'var(--color-brass-600, #9d762c)',
  paper: 'var(--color-paper-50, #fdfbf6)',
  paperWarm: 'var(--color-paper-100, #f7f2e7)',
  paperShade: 'var(--color-paper-300, #ddd4c0)',
  red: 'var(--color-suit-red, #b8323a)',
  black: 'var(--color-suit-black, #22201c)',
  success: 'var(--color-success, #4ba36f)',
  danger: 'var(--color-danger, #d4614f)',
} as const;

/**
 * Identifiants stockés en base. Courts et stables : ne jamais renuméroter,
 * la valeur est persistée dans `users.avatar` (max 8 caractères côté serveur).
 */
export const AVATAR_IDS = [
  'a1',
  'a2',
  'a3',
  'a4',
  'a5',
  'a6',
  'a7',
  'a8',
  'a9',
  'a10',
  'a11',
  'a12',
  'a13',
  'a14',
  'a15',
  'a16',
] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

/** Avatar attribué par défaut à un nouveau compte. */
export const DEFAULT_AVATAR_ID: AvatarId = AVATAR_IDS[0];

/**
 * Une œuvre = une couleur de fond pleine + quelques formes par-dessus.
 * Le repère est un carré 100×100, arrondi au rendu par un `clip-path`, ce qui
 * autorise les formes à déborder franchement des bords (elles seront rognées).
 */
interface AvatarArt {
  /** Aplat de fond, occupe toute la vignette. */
  bg: string;
  /** Formes dessinées par-dessus, dans l'ordre de superposition. */
  shapes: ReactNode;
}

const ART: Record<AvatarId, AvatarArt> = {
  /* Le croissant — un disque laiton évidé par un second disque de la couleur du
     fond, plus un point isolé qui joue l'étoile. */
  a1: {
    bg: C.ink,
    shapes: (
      <>
        <circle cx="50" cy="50" r="36" fill={C.brass} />
        <circle cx="68" cy="36" r="29" fill={C.ink} />
        <circle cx="22" cy="78" r="9" fill={C.paper} />
      </>
    ),
  },
  /* L'arche — pilier à sommet hémisphérique percé d'un oculus. */
  a2: {
    bg: C.brass,
    shapes: (
      <>
        <path d="M18 100 L18 46 A32 32 0 0 1 82 46 L82 100 Z" fill={C.feltNight} />
        <circle cx="50" cy="66" r="12" fill={C.paper} />
      </>
    ),
  },
  /* Le triangle — masse claire sur rouge, pastille laiton en son centre. */
  a3: {
    bg: C.red,
    shapes: (
      <>
        <path d="M50 18 L88 84 L12 84 Z" fill={C.paperWarm} />
        <circle cx="50" cy="64" r="12" fill={C.brassLight} />
      </>
    ),
  },
  /* La croix — deux bandes orthogonales pleine largeur, rouge par-dessus noir. */
  a4: {
    bg: C.paperWarm,
    shapes: (
      <>
        <rect x="38" y="0" width="24" height="100" fill={C.black} />
        <rect x="0" y="38" width="100" height="24" fill={C.red} />
      </>
    ),
  },
  /* L'arc — demi-couronne épaisse posée sur un point. */
  a5: {
    bg: C.feltDeep,
    shapes: (
      <>
        <path d="M16 78 A34 34 0 0 1 84 78" fill="none" stroke={C.brassLight} strokeWidth="20" />
        <circle cx="50" cy="79" r="12" fill={C.paper} />
      </>
    ),
  },
  /* Le damier — trois quadrants occupés, dont un arrondi en quart de disque. */
  a6: {
    bg: C.black,
    shapes: (
      <>
        <rect x="10" y="10" width="38" height="38" fill={C.success} />
        <rect x="52" y="52" width="38" height="38" fill={C.success} />
        <path d="M52 48 L90 48 A38 38 0 0 0 52 10 Z" fill={C.brassLight} />
      </>
    ),
  },
  /* La diagonale — la vignette coupée en deux, contrepoint circulaire sombre. */
  a7: {
    bg: C.brassPale,
    shapes: (
      <>
        <path d="M0 0 L100 0 L0 100 Z" fill={C.red} />
        <circle cx="70" cy="70" r="21" fill={C.feltDark} />
      </>
    ),
  },
  /* Les barres — trois bandes de longueurs décroissantes, rythme d'affiche. */
  a8: {
    bg: C.danger,
    shapes: (
      <>
        <rect x="14" y="20" width="72" height="16" rx="2" fill={C.paper} />
        <rect x="14" y="42" width="54" height="16" rx="2" fill={C.paper} />
        <rect x="14" y="64" width="36" height="16" rx="2" fill={C.feltNight} />
      </>
    ),
  },
  /* La cible — anneau épais traversé par une aiguille laiton. */
  a9: {
    bg: C.feltDeep,
    shapes: (
      <>
        <rect x="41" y="0" width="18" height="100" fill={C.brass} />
        <circle cx="50" cy="50" r="28" fill="none" stroke={C.paper} strokeWidth="16" />
      </>
    ),
  },
  /* Le losange — carré sur pointe, cœur laiton. */
  a10: {
    bg: C.ink,
    shapes: (
      <>
        <path d="M50 8 L90 50 L50 92 L10 50 Z" fill={C.danger} />
        <circle cx="50" cy="50" r="14" fill={C.brassLight} />
      </>
    ),
  },
  /* La capsule — deux demi-disques séparés par une fente claire. */
  a11: {
    bg: C.paperShade,
    shapes: (
      <>
        <path d="M16 46 A34 34 0 0 1 84 46 Z" fill={C.feltDark} />
        <path d="M16 54 A34 34 0 0 0 84 54 Z" fill={C.red} />
      </>
    ),
  },
  /* L'escalier — trois marches montantes, point sombre dans le vide. */
  a12: {
    bg: C.brassDark,
    shapes: (
      <>
        <path d="M14 86 L14 52 L48 52 L48 18 L86 18 L86 86 Z" fill={C.paperWarm} />
        <circle cx="30" cy="32" r="12" fill={C.feltNight} />
      </>
    ),
  },
  /* Le chevron — un V large posé sur son socle. */
  a13: {
    bg: C.brassLight,
    shapes: (
      <>
        <path d="M16 26 L50 60 L84 26" fill="none" stroke={C.feltDeep} strokeWidth="18" />
        <rect x="16" y="76" width="68" height="14" rx="2" fill={C.red} />
      </>
    ),
  },
  /* Le quart de disque — grande masse d'angle, satellite clair opposé. */
  a14: {
    bg: C.red,
    shapes: (
      <>
        <path d="M6 6 L78 6 A72 72 0 0 1 6 78 Z" fill={C.brassLight} />
        <circle cx="76" cy="76" r="15" fill={C.paper} />
      </>
    ),
  },
  /* Le sablier — deux triangles pointe contre pointe, pivot clair. */
  a15: {
    bg: C.brassDeep,
    shapes: (
      <>
        <path d="M16 12 L84 12 L50 50 Z" fill={C.feltDeep} />
        <path d="M16 88 L84 88 L50 50 Z" fill={C.feltDeep} />
        <circle cx="50" cy="50" r="10" fill={C.paper} />
      </>
    ),
  },
  /* Le point et la barre — composition typographique minimale. */
  a16: {
    bg: C.paper,
    shapes: (
      <>
        <circle cx="50" cy="40" r="27" fill={C.brassDeep} />
        <rect x="12" y="76" width="76" height="16" rx="2" fill={C.black} />
      </>
    ),
  },
};

/** Tailles nommées : 24 px pour la barre des adversaires, 80 px pour l'aperçu. */
const SIZES = { sm: 24, md: 40, lg: 80 } as const;

export type AvatarSize = number | keyof typeof SIZES;

/** Rayon des coins, en pourcentage du côté : suit l'arrondi des cartes du jeu. */
const CORNER = '24%';

/** `true` si la valeur correspond à un avatar dessiné connu. */
export function isAvatarId(value: string): value is AvatarId {
  return (AVATAR_IDS as readonly string[]).includes(value);
}

interface Props {
  /**
   * Identifiant d'avatar (`AVATAR_IDS`). Rétrocompatibilité : les comptes créés
   * avant cette version stockent un emoji (« 🦊 ») ; toute valeur inconnue est
   * donc rendue telle quelle, dans un conteneur de même forme et de même taille.
   */
  id: string;
  size?: AvatarSize;
  className?: string;
}

/**
 * Vignette d'avatar. Purement décorative : le nom du joueur, affiché à côté,
 * porte déjà l'information — d'où `aria-hidden` et l'absence de `role="img"`.
 */
export default function Avatar({ id, size = 'md', className = '' }: Props) {
  const px = typeof size === 'number' ? size : SIZES[size];
  const art = isAvatarId(id) ? ART[id] : null;

  // Ancien avatar emoji : même gabarit, même arrondi, pas de rendu cassé.
  if (!art) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 select-none items-center justify-center bg-felt-900/50 leading-none ring-1 ring-white/10 ${className}`}
        style={{
          width: px,
          height: px,
          borderRadius: CORNER,
          fontSize: Math.round(px * 0.58),
        }}
      >
        {id}
      </span>
    );
  }

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 100 100"
      width={px}
      height={px}
      className={`block shrink-0 ${className}`}
      // Rogne l'ensemble aux coins arrondis : les formes peuvent déborder.
      style={{ clipPath: `inset(0 round ${CORNER})` }}
    >
      <rect width="100" height="100" fill={art.bg} />
      {art.shapes}
      {/* Liseré intérieur : détache la vignette du tapis, comme un jeton posé. */}
      <rect
        x="1"
        y="1"
        width="98"
        height="98"
        rx="22"
        fill="none"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="2"
      />
    </svg>
  );
}
