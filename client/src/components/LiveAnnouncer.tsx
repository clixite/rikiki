import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store/game';
import { useT } from '../i18n';

/**
 * Annonces vocales du déroulé de partie.
 *
 * Tout ce qui se passe sur la table est purement visuel : qui joue, qui
 * remporte le pli, quelle carte tombe. Une personne qui navigue au lecteur
 * d'écran ne perçoit rien de tout cela. Cette région annonce les événements
 * au fil de l'eau, sans rien afficher.
 *
 * `polite` et non `assertive` : les annonces s'insèrent entre les phrases du
 * lecteur au lieu de couper la parole à chaque carte jouée.
 */
export default function LiveAnnouncer() {
  const t = useT();
  const view = useGame((s) => s.view);
  const [message, setMessage] = useState('');
  const lastRef = useRef<string>('');

  useEffect(() => {
    if (!view?.round) return;
    const round = view.round;
    const me = view.players.find((p) => p.id === view.you);
    const current = view.players.find((p) => p.seat === round.currentSeat);

    let next = '';
    if (view.phase === 'round-scoring') {
      const bid = round.bids[view.you];
      const tricks = round.tricksWon[view.you] ?? 0;
      next = bid !== null && bid === tricks ? t.contractKept : t.contractMissed;
    } else if (round.lastTrick && round.currentTrick.plays.length === 0) {
      const winner = view.players.find((p) => p.id === round.lastTrick!.winnerId);
      next = winner ? t.trickWonBy(winner.pseudo) : '';
    } else if (current && me && current.id === me.id) {
      next = view.phase === 'bidding' ? t.yourBid : t.yourTurn;
    } else if (current) {
      next = t.turnOf(current.pseudo);
    }

    // On n'annonce que les vrais changements, sinon le lecteur se répète
    if (next && next !== lastRef.current) {
      lastRef.current = next;
      setMessage(next);
    }
  }, [view, t]);

  return (
    <p aria-live="polite" aria-atomic="true" className="sr-only" data-testid="live-announcer">
      {message}
    </p>
  );
}
