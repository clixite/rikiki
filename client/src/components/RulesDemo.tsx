import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, m as motion } from 'motion/react';
import { cardFromId } from '@rikiki/shared';
import CardFace from './CardFace';
import { useT } from '../i18n';

/**
 * La partie en une minute, jouée sous les yeux du débutant.
 *
 * Un jeu de plis ne s'explique pas bien par écrit : « suivre la couleur
 * demandée » ne veut rien dire tant qu'on n'a pas VU une carte tomber et une
 * autre la couper. Cinq scènes animées suffisent là où six paragraphes
 * échouent.
 *
 * Pourquoi une animation plutôt qu'une vidéo : elle se traduit dans les
 * vingt-quatre langues sans doublage ni ré-encodage (seules les légendes
 * changent), elle pèse quelques kilo-octets au lieu de dizaines de méga-octets
 * par langue, elle reste nette sur tous les écrans, elle fonctionne hors ligne
 * comme le reste de la PWA, et elle se lit sans son — ce qui compte pour un jeu
 * qu'on ouvre dans le train. Les cartes affichées sont les VRAIES cartes du
 * jeu : ce qu'on apprend ici se retrouve tel quel à la table.
 */

/** Durée d'une scène. Assez pour lire la légende, assez court pour ne pas lasser. */
const SCENE_MS = 4600;
const SCENES = 5;

export default function RulesDemo() {
  const t = useT();
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [finished, setFinished] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const go = useCallback((next: number) => {
    setScene(((next % SCENES) + SCENES) % SCENES);
    setFinished(false);
  }, []);

  /*
   * L'enchaînement automatique s'arrête à la dernière scène plutôt que de
   * boucler : une démonstration qui repart sans fin donne l'impression qu'on
   * a raté quelque chose, et empêche de lire tranquillement la fin.
   */
  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => {
      if (scene === SCENES - 1) {
        setPlaying(false);
        setFinished(true);
      } else {
        setScene((s) => s + 1);
      }
    }, SCENE_MS);
    return () => clearTimeout(id);
  }, [scene, playing]);

  /*
   * On ne joue pas une animation que personne ne regarde : hors écran, elle ne
   * ferait que consommer de la batterie et défiler sans témoin. Le compteur
   * repart donc quand la démonstration entre dans le champ.
   */
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) setPlaying(false);
      },
      { threshold: 0.35 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const captions = [t.demoDeal, t.demoBid, t.demoFollow, t.demoTrump, t.demoScore];

  return (
    <section
      ref={stageRef}
      data-testid="rules-demo"
      data-scene={scene}
      className="rounded-2xl bg-felt-900/45 p-4 ring-1 ring-white/6"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-paper-50">{t.demoTitle}</h2>
        <button
          type="button"
          data-testid="demo-toggle"
          onClick={() => {
            if (finished) go(0);
            setPlaying((p) => (finished ? true : !p));
          }}
          aria-label={playing ? t.demoPause : finished ? t.demoReplay : t.demoPlay}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brass-400/15 text-base text-brass-300 ring-1 ring-brass-400/25 transition active:scale-90"
        >
          <span aria-hidden="true">{playing ? '❚❚' : finished ? '↺' : '▶'}</span>
        </button>
      </div>

      {/* Hauteur fixe : sans elle, chaque scène ferait sauter tout ce qui suit
          dans la page, et on relirait le paragraphe précédent à chaque fois. */}
      <div className="relative h-40 overflow-hidden rounded-xl bg-felt-950/40">
        <AnimatePresence mode="wait">
          <motion.div
            key={scene}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center px-3"
          >
            {scene === 0 && <SceneDeal />}
            {scene === 1 && <SceneBid />}
            {scene === 2 && <SceneFollow />}
            {scene === 3 && <SceneTrump />}
            {scene === 4 && <SceneScore />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* La légende occupe deux lignes en permanence : une légende courte
          suivie d'une longue ferait respirer le bloc à chaque scène. */}
      <p
        className="mt-2.5 flex h-10 items-center justify-center text-center text-sm leading-snug text-paper-50/75"
        aria-live="polite"
        data-testid="demo-caption"
      >
        {captions[scene]}
      </p>

      <div className="mt-1 flex items-center justify-center gap-3">
        <StepButton onClick={() => go(scene - 1)} label={t.demoPrev} glyph="‹" testId="demo-prev" />

        {/* Repères de progression, et rien de plus : cinq pastilles cliquables
            feraient cinq cibles de huit pixels, impossibles à viser au pouce.
            Les deux flèches, elles, tiennent la taille réglementaire. */}
        <div className="flex gap-1.5" aria-hidden="true">
          {Array.from({ length: SCENES }, (_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full transition ${
                i === scene ? 'bg-brass-300' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
        <span className="sr-only">{`${scene + 1}/${SCENES}`}</span>

        <StepButton onClick={() => go(scene + 1)} label={t.demoNext} glyph="›" testId="demo-next" />
      </div>
    </section>
  );
}

function StepButton({
  onClick,
  label,
  glyph,
  testId,
}: {
  onClick: () => void;
  label: string;
  glyph: string;
  testId: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full text-lg text-paper-50/50 transition active:scale-90"
    >
      <span aria-hidden="true">{glyph}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Les cinq scènes                                                      */
/* ------------------------------------------------------------------ */

const spring = { type: 'spring' as const, stiffness: 260, damping: 24 };

/** 1. La donne, puis la carte retournée qui désigne l'atout. */
function SceneDeal() {
  const t = useT();
  const hand = ['S14', 'H12', 'D7', 'C9'];
  return (
    <div className="flex w-full items-center justify-center gap-4">
      <div className="flex">
        {hand.map((id, i) => (
          <motion.div
            key={id}
            initial={{ y: -70, opacity: 0, rotate: -12 }}
            animate={{ y: 0, opacity: 1, rotate: (i - 1.5) * 5 }}
            transition={{ ...spring, delay: i * 0.12 }}
            style={{ marginLeft: i === 0 ? 0 : -14 }}
          >
            <CardFace card={cardFromId(id)} width={44} size="sm" />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.4, opacity: 0, rotateY: 90 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{ ...spring, delay: 0.7 }}
        className="flex flex-col items-center gap-1"
      >
        <div className="rounded-lg p-0.5 ring-2 ring-brass-300">
          <CardFace card={cardFromId('H9')} width={44} size="sm" trump />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-brass-300">
          {t.trump}
        </span>
      </motion.div>
    </div>
  );
}

/** 2. Chacun annonce son contrat, le donneur en dernier — et sous contrainte. */
function SceneBid() {
  const t = useT();
  const bids = [
    { who: 'A', bid: 2 },
    { who: 'B', bid: 1 },
    { who: 'C', bid: 0 },
  ];
  return (
    <div className="flex w-full flex-col items-center gap-2.5">
      <div className="flex gap-3">
        {bids.map((b, i) => (
          <motion.div
            key={b.who}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...spring, delay: 0.25 + i * 0.45 }}
            className="flex flex-col items-center gap-1"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-felt-800 text-xs font-bold text-paper-50/70 ring-1 ring-white/10">
              {b.who}
            </span>
            <span className="rounded-full bg-brass-400/15 px-2 py-0.5 text-sm font-bold tabular-nums text-brass-300">
              {b.bid}
            </span>
          </motion.div>
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.7 }}
        className="rounded-lg bg-felt-800/70 px-2.5 py-1 text-[11px] text-paper-50/60"
      >
        ⛓️ {t.rulesHookTitle}
      </motion.p>
    </div>
  );
}

/** 3. La couleur demandée : on la suit si on l'a. */
function SceneFollow() {
  return (
    <div className="flex w-full items-center justify-center gap-2">
      <PlayedCard id="H13" delay={0.1} tag="1" />
      <PlayedCard id="H5" delay={0.7} />
      <PlayedCard id="H10" delay={1.3} />
      {/* La carte barrée dit la règle mieux qu'une phrase : on VOIT que le
          pique n'a pas le droit de tomber tant qu'on a du cœur. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.9 }}
        className="relative ml-1"
      >
        <div className="opacity-35">
          <CardFace card={cardFromId('S3')} width={44} size="sm" />
        </div>
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center text-2xl text-danger"
        >
          ✕
        </span>
      </motion.div>
    </div>
  );
}

/** 4. Un atout, même petit, l'emporte sur la couleur demandée. */
function SceneTrump() {
  return (
    <div className="flex w-full items-center justify-center gap-3">
      <PlayedCard id="H14" delay={0.1} />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-lg text-paper-50/40"
        aria-hidden="true"
      >
        ‹
      </motion.span>
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 1.1 }}
        className="rounded-lg p-0.5 ring-2 ring-brass-300"
      >
        <CardFace card={cardFromId('S2')} width={48} size="sm" trump />
      </motion.div>
    </div>
  );
}

/** 5. Le décompte : tenir son contrat rapporte, le manquer coûte. */
function SceneScore() {
  const t = useT();
  return (
    <div className="flex w-full items-stretch justify-center gap-2.5">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.2 }}
        className="flex w-28 flex-col items-center gap-1 rounded-xl bg-success/10 p-2.5 ring-1 ring-success/25"
      >
        <span className="text-[11px] font-semibold text-success">{t.rulesScoreOk}</span>
        <span className="text-xs tabular-nums text-paper-50/60">2 / 2</span>
        <span className="text-xl font-bold tabular-nums text-success">+14</span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.7 }}
        className="flex w-28 flex-col items-center gap-1 rounded-xl bg-danger/10 p-2.5 ring-1 ring-danger/25"
      >
        <span className="text-[11px] font-semibold text-danger">{t.rulesScoreKo}</span>
        <span className="text-xs tabular-nums text-paper-50/60">3 / 1</span>
        <span className="text-xl font-bold tabular-nums text-danger">−4</span>
      </motion.div>
    </div>
  );
}

/** Une carte qui tombe sur le tapis, avec le repère d'entame si c'est la première. */
function PlayedCard({ id, delay, tag }: { id: string; delay: number; tag?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...spring, delay }}
      className={`relative rounded-lg ${tag ? 'p-0.5 ring-2 ring-felt-400' : ''}`}
    >
      <CardFace card={cardFromId(id)} width={44} size="sm" />
    </motion.div>
  );
}
