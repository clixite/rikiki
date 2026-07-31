/**
 * Les pictogrammes du jeu.
 *
 * Les boutons portaient des emoji système : 🔊 🏆 📖. Pratique à écrire, mais
 * chaque plateforme dessine les siens — un trophée bombé et multicolore sur
 * iOS, plat et orangé sur Android, encore autre chose sur un navigateur de
 * bureau. Impossible de garantir quoi que ce soit visuellement, et le contraste
 * avec les avatars, eux entièrement dessinés, sautait aux yeux : on voyait une
 * application codée plutôt qu'un jeu dessiné.
 *
 * Ce jeu-ci est tracé à la main, sur une grille de 24, au trait de 1,75 — le
 * même trait partout, en `currentColor`, donc il prend la teinte de son bouton
 * et suit le mode daltonien comme le reste. Quelques centaines d'octets par
 * icône, aucune requête, aucun rendu qui varie d'un téléphone à l'autre.
 *
 * Les emoji restent là où ils sont du CONTENU et non de l'interface : les
 * médailles du podium, les réactions envoyées à la table, le robot de la
 * ligne « ajouter un joueur automatique ». Là, leur exubérance est un atout.
 */

export type IconName =
  | 'back'
  | 'cards'
  | 'check'
  | 'chevronDown'
  | 'close'
  | 'copy'
  | 'globe'
  | 'help'
  | 'history'
  | 'message'
  | 'pause'
  | 'photo'
  | 'rules'
  | 'settings'
  | 'share'
  | 'smile'
  | 'sound'
  | 'soundOff'
  | 'spread'
  | 'trophy'
  | 'users';

/**
 * Tracés. Chacun est pensé pour rester lisible à 20 px : pas plus de trois
 * ou quatre traits par symbole, et aucun détail sous deux pixels — ce qui se
 * distingue sur une maquette disparaît sur un téléphone au soleil.
 */
const PATHS: Record<IconName, string> = {
  back: 'M15 5 8 12l7 7',
  cards:
    'M10.4 7.4 6.2 9a1.7 1.7 0 0 0-1 2.2l2.9 7.4a1.7 1.7 0 0 0 2.2 1l2.5-1M11.6 4.5h5.9a1.7 1.7 0 0 1 1.7 1.7v10.1a1.7 1.7 0 0 1-1.7 1.7h-5.9a1.7 1.7 0 0 1-1.7-1.7V6.2a1.7 1.7 0 0 1 1.7-1.7Z',
  check: 'M5 12.6 9.6 17 19 7',
  chevronDown: 'M6.5 9.75 12 15.25l5.5-5.5',
  close: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  copy: 'M9 9V6.6A1.6 1.6 0 0 1 10.6 5h6.8A1.6 1.6 0 0 1 19 6.6v6.8a1.6 1.6 0 0 1-1.6 1.6H15M6.6 9h6.8A1.6 1.6 0 0 1 15 10.6v6.8A1.6 1.6 0 0 1 13.4 19H6.6A1.6 1.6 0 0 1 5 17.4v-6.8A1.6 1.6 0 0 1 6.6 9Z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.4 9.5h17.2M3.4 14.5h17.2M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.6 9.6a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2-2.4 3.6M12 17.4h.01',
  history: 'M12 21a9 9 0 1 0-8.9-10.4M12 7.6V12l3 1.9M3 4.6v4h4',
  message:
    'M20 12.6c0 3.6-3.6 6.5-8 6.5a9.6 9.6 0 0 1-2.6-.35L5 20.5l1-3.2A6.2 6.2 0 0 1 4 12.6c0-3.6 3.6-6.5 8-6.5s8 2.9 8 6.5Z',
  pause: 'M9.5 5.5v13M14.5 5.5v13',
  photo:
    'M4.5 8.8h2.9l1.4-2.3h6.4l1.4 2.3h2.9a1 1 0 0 1 1 1v8.2a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V9.8a1 1 0 0 1 1-1ZM12 16.6a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z',
  rules:
    'M12 7c-1.6-1.4-3.8-2.2-6.2-2.2H4.4v12.6h1.4c2.4 0 4.6.8 6.2 2.2M12 7c1.6-1.4 3.8-2.2 6.2-2.2h1.4v12.6h-1.4c-2.4 0-4.6.8-6.2 2.2M12 7v12.6',
  settings: 'M4.5 8.5h8M16.5 8.5h3M4.5 15.5h3M11.5 15.5h8M14.5 8.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM5.5 15.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z',
  share: 'M12 15.2V4.2M12 4.2 8.6 7.6M12 4.2l3.4 3.4M5 12.6v5.8a1.6 1.6 0 0 0 1.6 1.6h10.8a1.6 1.6 0 0 0 1.6-1.6v-5.8',
  smile: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8.6 14.4a4.4 4.4 0 0 0 6.8 0M9.2 9.8h.01M14.8 9.8h.01',
  sound: 'M4.5 9.6v4.8h3l4.2 3.6V6L7.5 9.6h-3ZM15 9.4a4 4 0 0 1 0 5.2M17.6 6.9a7.6 7.6 0 0 1 0 10.2',
  soundOff: 'M4.5 9.6v4.8h3l4.2 3.6V6L7.5 9.6h-3ZM15.4 9.8l4.4 4.4M19.8 9.8l-4.4 4.4',
  spread: 'M4 12h16M8.4 7.6 4 12l4.4 4.4M15.6 7.6 20 12l-4.4 4.4',
  trophy:
    'M7.2 4.5h9.6v4.6a4.8 4.8 0 0 1-9.6 0V4.5ZM7.2 6.2H4.4v1.2a3 3 0 0 0 2.8 3M16.8 6.2h2.8v1.2a3 3 0 0 1-2.8 3M12 13.9v2.9M8.9 19.5h6.2l-.6-2.7H9.5l-.6 2.7Z',
  users:
    'M9.2 11.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8ZM3.2 19.4c0-2.9 2.7-5.2 6-5.2s6 2.3 6 5.2M15.6 5.4a3.4 3.4 0 0 1 0 6M20.8 19.4c0-1.9-.9-3.5-2.4-4.4',
};

interface Props {
  name: IconName;
  /** Côté du carré, en pixels. 20 pour un bouton rond de 44. */
  size?: number;
  className?: string;
}

export default function Icon({ name, size = 20, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      // Purement décoratif : chaque bouton porte déjà son `aria-label`, et un
      // pictogramme annoncé en plus ne ferait que doubler la lecture vocale.
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
