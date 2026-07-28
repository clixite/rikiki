import Avatar, { isAvatarId } from './Avatar';
import { isPhotoDataUrl } from '../photo';
import { isHidden } from '../moderation';

interface Props {
  /** Identifiant du joueur : sert à respecter un masquage décidé localement. */
  playerId?: string;
  /** Identifiant d'avatar dessiné, ou emoji hérité des anciens comptes. */
  avatar: string;
  /** Photo de profil (data URL) : elle prend le pas sur l'avatar dessiné. */
  photo?: string | null;
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
export default function PlayerAvatar({ playerId, avatar, photo, size = 24, className = '' }: Props) {
  // Un joueur masqué retrouve son avatar dessiné : on ne laisse pas une image
  // signalée réapparaître à la partie suivante.
  const masked = playerId !== undefined && isHidden(playerId);
  if (!masked && isPhotoDataUrl(photo)) {
    return (
      <img
        src={photo}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
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
