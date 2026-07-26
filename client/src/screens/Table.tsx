import { useState } from 'react';
import type { GameView } from '@rikiki/shared';
import BidPicker from '../components/BidPicker';
import CardFace from '../components/CardFace';
import HandFan from '../components/HandFan';
import OpponentsBar from '../components/OpponentsBar';
import RoundRecap from '../components/RoundRecap';
import ScoreDrawer from '../components/ScoreDrawer';
import TrickArea from '../components/TrickArea';
import { fr } from '../i18n/fr';
import { placeBid, playCard } from '../socket';
import { useGame } from '../store/game';

interface Props {
  view: GameView;
}

export default function Table({ view }: Props) {
  const frozenTrick = useGame((s) => s.frozenTrick);
  const [scoresOpen, setScoresOpen] = useState(false);
  const round = view.round!;
  const me = view.players.find((p) => p.id === view.you)!;
  const currentPlayer = view.players.find((p) => p.seat === round.currentSeat);
  const myTurn = currentPlayer?.id === view.you;
  const showBidPicker = view.phase === 'bidding' && round.legalBids !== null && !frozenTrick;
  const showRecap = view.phase === 'round-scoring' && !frozenTrick;
  const myBid = round.bids[view.you];
  const myTricks = round.tricksWon[view.you] ?? 0;

  const onPlay = async (cardId: string) => {
    const res = await playCard(cardId);
    if (!res.ok) useGame.getState().showToast(res.error.message);
  };

  const onBid = async (bid: number) => {
    const res = await placeBid(bid);
    if (!res.ok) useGame.getState().showToast(res.error.message);
  };

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col py-3">
      {/* Bandeau de manche */}
      <div className="flex items-center justify-between gap-2 px-4 pb-2">
        <div className="text-xs text-white/80">
          <span className="font-semibold">
            {fr.round} {round.roundIndex + 1}/{view.roundsSequence.length}
          </span>
          <span className="text-white/50"> · {fr.cards(round.cardsCount)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/80">
          <span>{fr.trump} :</span>
          {round.trumpCard ? <CardFace card={round.trumpCard} size="sm" /> : <span>{fr.noTrump}</span>}
        </div>
        <button
          type="button"
          onClick={() => setScoresOpen(true)}
          className="rounded-full bg-black/25 px-3 py-1.5 text-xs font-medium active:scale-95"
        >
          🏆 {fr.scoreboard}
        </button>
      </div>

      <OpponentsBar view={view} />

      {/* Centre de table */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2">
        <TrickArea view={view} frozenTrick={frozenTrick} />
        <p className="px-4 text-center text-sm font-medium text-gold-300">
          {frozenTrick
            ? ''
            : myTurn
              ? view.phase === 'playing'
                ? fr.yourTurn
                : ''
              : currentPlayer
                ? fr.turnOf(currentPlayer.pseudo)
                : ''}
        </p>
      </div>

      {/* Ma zone */}
      <div className="pb-2">
        <div className="mb-2 flex items-center justify-center gap-2 text-sm">
          <span className="text-xl">{me.avatar}</span>
          <span className="font-medium">{me.pseudo}</span>
          {round.dealerSeat === me.seat && <span title="Donneur">🃏</span>}
          <span className="rounded-full bg-black/25 px-2 py-0.5 text-xs text-gold-300">
            {fr.tricks} : {myBid === null ? '—' : `${myTricks}/${myBid}`}
          </span>
          <span className="text-xs text-white/50">
            {fr.total} : {me.totalScore}
          </span>
        </div>
        <HandFan
          hand={round.myHand}
          legalCardIds={view.phase === 'playing' && !frozenTrick ? round.legalCardIds : null}
          onPlay={onPlay}
        />
      </div>

      {showBidPicker && (
        <div className="fixed inset-x-0 bottom-0 z-20">
          <div className="mx-auto max-w-md">
            <BidPicker cardsCount={round.cardsCount} legalBids={round.legalBids!} onBid={onBid} />
          </div>
        </div>
      )}
      {showRecap && <RoundRecap view={view} />}
      <ScoreDrawer view={view} open={scoresOpen} onClose={() => setScoresOpen(false)} />
    </div>
  );
}
