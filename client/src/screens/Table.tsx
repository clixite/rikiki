import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { GameView } from '@rikiki/shared';
import { cardId } from '@rikiki/shared';
import BidPicker from '../components/BidPicker';
import BidsSummary from '../components/BidsSummary';
import LeaveGameButton from '../components/LeaveGameButton';
import EmoteBar, { EMOTE_GLYPH } from '../components/EmoteBar';
import { useSecondsLeft } from '../components/TurnCountdown';
import HandFan from '../components/HandFan';
import PlayerSeats from '../components/PlayerSeats';
import RoundRecap from '../components/RoundRecap';
import ScoreDrawer from '../components/ScoreDrawer';
import SoundToggle from '../components/SoundToggle';
import TrickArea from '../components/TrickArea';
import TrumpBadge from '../components/TrumpBadge';
import PlayerAvatar from '../components/PlayerAvatar';
import { vibrate } from '../haptics';
import { useT } from '../i18n';

import { placeBid, playCard } from '../socket';
import { useGame } from '../store/game';
import { applyOptimistic } from '../store/optimistic';

interface Props {
  view: GameView;
}

/**
 * Table de jeu, pensée pour le portrait mobile.
 *
 * Règle de mise en page : la main du joueur reste TOUJOURS visible et
 * n'est jamais recouverte — ni pendant les annonces, ni pendant le jeu.
 * Chaque zone occupe sa propre ligne d'une colonne flex, sans superposition.
 */
export default function Table({ view: serverView }: Props) {
  const t = useT();
  const frozenTrick = useGame((s) => s.frozenTrick);
  const optimistic = useGame((s) => s.optimistic);
  // Le coup local s'affiche sans attendre la réponse du serveur
  const view = applyOptimistic(serverView, optimistic);
  const [scoresOpen, setScoresOpen] = useState(false);
  const round = view.round!;
  const me = view.players.find((p) => p.id === view.you)!;
  const currentPlayer = view.players.find((p) => p.seat === round.currentSeat);
  const myTurn = currentPlayer?.id === view.you;

  const bidding = view.phase === 'bidding';
  const showBidPicker = bidding && round.legalBids !== null && !frozenTrick;
  const showRecap = view.phase === 'round-scoring' && !frozenTrick;
  const myBid = round.bids[view.you];
  const myTricks = round.tricksWon[view.you] ?? 0;
  const bidsSoFar = Object.values(round.bids).reduce<number>((sum, b) => sum + (b ?? 0), 0);
  const contractDone = myBid !== null && myTricks === myBid;
  const contractBusted = myBid !== null && myTricks > myBid;
  const trickBusy = round.currentTrick.plays.length > 0 || frozenTrick !== null;

  const onPlay = async (id: string) => {
    const card = round.myHand.find((c) => cardId(c) === id);
    if (!card) return;
    vibrate('tap');
    useGame.getState().playOptimistic(card);
    const res = await playCard(id);
    if (!res.ok) {
      // Coup refusé : on rend la carte à la main et on explique
      useGame.getState().rollbackOptimistic();
      useGame.getState().showToast(res.error.message);
    }
  };

  const onBid = async (bid: number) => {
    vibrate('tap');
    useGame.getState().bidOptimistic(bid);
    const res = await placeBid(bid);
    if (!res.ok) {
      useGame.getState().rollbackOptimistic();
      useGame.getState().showToast(res.error.message);
    }
  };

  const statusText = frozenTrick
    ? t.trickWonBy(view.players.find((p) => p.id === frozenTrick.winnerId)?.pseudo ?? '')
    : myTurn
      ? view.phase === 'playing'
        ? t.yourTurn
        : ''
      : currentPlayer
        ? t.turnOf(currentPlayer.pseudo)
        : '';

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* ---- En-tête : manche, son, scores ---- */}
      <header className="flex shrink-0 items-center gap-2 px-3 pb-1 pt-2">
        <LeaveGameButton />

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-paper-50/50">
            {t.round} {round.roundIndex + 1}/{view.roundsSequence.length}
          </p>
          <p className="truncate text-sm font-medium text-paper-50">{t.cards(round.cardsCount)}</p>
        </div>

        <SoundToggle />

        <button
          type="button"
          data-testid="open-scores"
          onClick={() => setScoresOpen(true)}
          aria-label={t.scoreboard}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-felt-900/55 text-lg ring-1 ring-white/10 transition active:scale-90"
        >
          <span aria-hidden="true">🏆</span>
        </button>
      </header>

      {/* ---- Récapitulatif des annonces : lisible en permanence ---- */}
      <div className="shrink-0 pb-1">
        <BidsSummary view={view} />
      </div>

      {/*
        ---- Tapis ----
        Les joueurs sont posés en couche absolue autour du feutre, le pli
        occupe le centre, l'atout tient le coin gauche : le regard n'a plus à
        chercher qui joue ni quelle est la couleur maîtresse.
      */}
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center">
        {/* Ancrage visuel : suggère la zone de dépose au centre de la table */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgb(255 255 255 / 0.05) 0%, transparent 68%)',
            boxShadow: 'inset 0 0 70px -20px rgb(0 0 0 / 0.5)',
          }}
        />

        <PlayerSeats view={view} />

        {/* L'atout se consulte du coin de l'œil : il quitte le centre, que le
            pli réclame, et reste ancré au même endroit toute la manche. */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2">
          <TrumpBadge trumpCard={round.trumpCard} />
        </div>

        <TrickArea view={view} frozenTrick={frozenTrick} />

        <MyEmotes />

        <motion.p
          key={statusText}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative mt-2 h-6 px-4 text-center text-base font-semibold ${
            myTurn && !frozenTrick ? 'text-brass-300' : 'text-paper-50/60'
          }`}
          data-testid="turn-status"
          aria-live="polite"
        >
          {statusText}
        </motion.p>

        {/* Les réactions vivent dans le tapis, jamais par-dessus la main :
            un bouton posé sur les cartes se déclenche en voulant jouer. */}
        <EmoteBar />
      </div>

      {/* ---- Annonce : au-dessus de la main, jamais par-dessus ---- */}
      {showBidPicker && (
        <div className="shrink-0 pb-2">
          <BidPicker
            cardsCount={round.cardsCount}
            legalBids={round.legalBids!}
            bidsSoFar={bidsSoFar}
            onBid={onBid}
          />
        </div>
      )}

      {/* ---- Ma zone : contrat + main ---- */}
      <div className="shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {/* « C'est à moi » doit se voir sans lire : une barre pleine largeur
            au-dessus de la main, dans la couleur d'accent du jeu. */}
        <MyTurnBanner
          active={myTurn && !frozenTrick && view.phase === 'playing'}
          label={t.yourTurn}
          deadline={myTurn ? view.turnDeadline : null}
        />

        <div className="mb-2 flex items-center justify-center gap-2 px-3">
          <PlayerAvatar avatar={me.avatar} photo={me.photo} size={30} />
          <span className="max-w-24 truncate text-[15px] font-semibold text-paper-50">{me.pseudo}</span>
          {round.dealerSeat === me.seat && (
            <span className="rounded-full bg-brass-400 px-1.5 text-[10px] font-bold text-felt-950" title={t.dealer}>
              D
            </span>
          )}
          <span
            data-testid="my-contract"
            className={`rounded-full px-2.5 py-1 text-[14px] font-bold tabular-nums ${
              myBid === null
                ? 'bg-white/8 text-paper-50/55'
                : contractBusted
                  ? 'bg-danger/20 text-danger'
                  : contractDone
                    ? 'bg-success/20 text-success'
                    : 'bg-brass-400/15 text-brass-300'
            }`}
          >
            {myBid === null ? t.noBidYet : t.tricksOfContract(myTricks, myBid)}
          </span>
          <span className="text-[13px] tabular-nums text-paper-50/45">
            {t.total} {me.totalScore}
          </span>
        </div>

        <HandFan
          hand={round.myHand}
          legalCardIds={view.phase === 'playing' && !frozenTrick ? round.legalCardIds : null}
          onPlay={onPlay}
          compact={showBidPicker}
          trumpSuit={round.trumpCard?.suit ?? null}
          dealKey={round.roundIndex}
        />
      </div>

      {showRecap && <RoundRecap view={view} />}
      <ScoreDrawer view={view} open={scoresOpen} onClose={() => setScoresOpen(false)} />
    </div>
  );
}

/**
 * Mes propres réactions, au centre du tapis.
 *
 * Celles des autres s'affichent au-dessus de leur siège ; moi je n'ai pas de
 * siège, ma place est en bas de l'écran. Les faire apparaître au centre évite
 * de recouvrir la main tout en confirmant l'envoi.
 */
function MyEmotes() {
  // Le sélecteur doit renvoyer une référence stable : filtrer à l'intérieur
  // fabriquerait un tableau neuf à chaque lecture, et zustand rerendrait sans
  // fin. On prend les valeurs telles quelles, on filtre au rendu.
  const emotes = useGame((s) => s.emotes);
  const you = useGame((s) => s.view?.you);
  const mine = you ? emotes.filter((e) => e.playerId === you) : [];

  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 flex justify-center gap-1">
      <AnimatePresence>
        {mine.map((e) => (
          <motion.span
            key={e.id}
            initial={{ opacity: 0, scale: 0.4, y: 30 }}
            animate={{ opacity: 1, scale: 1.2, y: -10 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ type: 'spring', stiffness: 420, damping: 20 }}
            className="text-4xl drop-shadow-lg"
            aria-hidden="true"
          >
            {EMOTE_GLYPH[e.emote]}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Bandeau « à toi de jouer ».
 *
 * Le texte d'état au centre du tapis ne suffisait pas : on regarde ses cartes,
 * pas la table. Une barre pleine largeur collée à la main, juste au-dessus des
 * cartes, tombe dans le champ de vision au bon endroit. Elle occupe sa place
 * même éteinte, sinon la main sauterait de quelques pixels à chaque tour.
 */
function MyTurnBanner({
  active,
  label,
  deadline,
}: {
  active: boolean;
  label: string;
  deadline: number | null | undefined;
}) {
  const left = useSecondsLeft(deadline);
  // Le décompte n'apparaît que sur la fin : afficher les secondes en
  // permanence transforme une partie entre amis en épreuve chronométrée.
  const showCount = active && left !== null && left <= 10;
  return (
    <div className="mb-1.5 h-9 px-3" data-testid="my-turn-banner" data-active={active ? 'true' : 'false'}>
      <motion.div
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : 6 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="flex h-9 items-center justify-center rounded-xl bg-linear-to-b from-brass-300 to-brass-500 text-[15px] font-bold uppercase tracking-wide text-felt-950"
        style={{ boxShadow: active ? '0 4px 18px -6px rgb(217 178 92 / 0.7)' : 'none' }}
        aria-hidden={!active}
      >
        {label}
        {showCount && <span className="ml-2 tabular-nums opacity-70">{left}</span>}
      </motion.div>
    </div>
  );
}
