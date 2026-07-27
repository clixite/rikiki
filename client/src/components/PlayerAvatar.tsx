import Avatar, { isAvatarId } from './Avatar';

interface Props {
  /** Identifiant d'avatar dessiné, ou emoji hérité des anciens comptes. */
  avatar: string;
  size?: number;
  className?: string;
}

/**
 * Affichage de l'avatar d'un joueur, où qu'il apparaisse.
 *
 * Point d'entrée unique : les comptes créés avant la refonte stockent un
 * emoji, les nouveaux un identifiant d'avatar dessiné. On accepte les deux
 * sans que le reste de l'interface ait à s'en soucier.
 */
export default function PlayerAvatar({ avatar, size = 24, className = '' }: Props) {
  if (isAvatarId(avatar)) {
    return <Avatar id={avatar} size={size} className={className} />;
  }
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center leading-none ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.86 }}
    >
      {avatar}
    </span>
  );
}
