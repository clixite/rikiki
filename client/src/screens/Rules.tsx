import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cardFromId } from '@rikiki/shared';
import CardFace from '../components/CardFace';
import SoundToggle from '../components/SoundToggle';
import { fr } from '../i18n/fr';

/** Une section de règle : un titre, un texte, et parfois une illustration. */
function Section({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl bg-felt-900/45 p-4 ring-1 ring-white/6"
    >
      <div className="mb-2 flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brass-400/20 text-xs font-bold text-brass-300">
          {step}
        </span>
        <h2 className="text-base font-semibold text-paper-50">{title}</h2>
      </div>
      <div className="space-y-2 text-sm leading-relaxed text-paper-50/70">{children}</div>
    </motion.section>
  );
}

export default function Rules() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          data-testid="rules-back"
          onClick={() => navigate(-1)}
          aria-label={fr.backHome}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-felt-900/45 text-lg ring-1 ring-white/8 transition active:scale-90"
        >
          ←
        </button>
        <SoundToggle />
      </div>

      <h1 className="font-display mb-1 mt-2 text-center text-3xl font-bold text-brass-300">
        {fr.rulesTitle}
      </h1>
      <p className="mb-4 text-center text-sm text-paper-50/50">{fr.rulesSubtitle}</p>

      <div className="rk-scroll min-h-0 flex-1 space-y-3 overflow-y-auto pb-4">
        <Section step="1" title={fr.rulesGoalTitle}>
          <p>{fr.rulesGoalText}</p>
        </Section>

        <Section step="2" title={fr.rulesDealTitle}>
          <p>{fr.rulesDealText}</p>
          <div className="flex items-center gap-2 rounded-xl bg-felt-950/40 p-2.5">
            <div className="flex gap-1">
              {['S14', 'H12', 'D7'].map((id) => (
                <CardFace key={id} card={cardFromId(id)} size="sm" />
              ))}
            </div>
            <p className="flex-1 text-xs leading-snug text-paper-50/60">{fr.rulesTrumpText}</p>
            <CardFace card={cardFromId('H9')} size="sm" />
          </div>
        </Section>

        <Section step="3" title={fr.rulesBidTitle}>
          <p>{fr.rulesBidText}</p>
          <div className="rounded-xl bg-brass-400/10 p-2.5 ring-1 ring-brass-400/20">
            <p className="text-xs font-semibold text-brass-300">⛓ {fr.rulesHookTitle}</p>
            <p className="mt-1 text-xs leading-snug text-paper-50/65">{fr.rulesHookText}</p>
          </div>
        </Section>

        <Section step="4" title={fr.rulesPlayTitle}>
          <p>{fr.rulesPlayText}</p>
          <ul className="ml-4 list-disc space-y-1 text-sm">
            <li>{fr.rulesFollowSuit}</li>
            <li>{fr.rulesNoSuit}</li>
            <li>{fr.rulesWinTrick}</li>
          </ul>
        </Section>

        <Section step="5" title={fr.rulesScoreTitle}>
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl bg-success/10 p-2.5 ring-1 ring-success/20">
              <p className="text-xs font-semibold text-success">{fr.rulesScoreOk}</p>
              <p className="mt-1 whitespace-nowrap text-[15px] font-bold tabular-nums text-success">
                10 + 2 × plis
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-paper-50/55">{fr.rulesScoreOkExample}</p>
            </div>
            <div className="flex-1 rounded-xl bg-danger/10 p-2.5 ring-1 ring-danger/20">
              <p className="text-xs font-semibold text-danger">{fr.rulesScoreKo}</p>
              <p className="mt-1 whitespace-nowrap text-[15px] font-bold tabular-nums text-danger">
                −2 × écart
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-paper-50/55">{fr.rulesScoreKoExample}</p>
            </div>
          </div>
          <p className="pt-1 text-xs text-paper-50/55">{fr.rulesScoreZero}</p>
        </Section>

        <Section step="6" title={fr.rulesEndTitle}>
          <p>{fr.rulesEndText}</p>
        </Section>

        <p className="px-2 pt-1 text-center text-xs leading-snug text-paper-50/40">{fr.rulesTip}</p>
      </div>

      <button
        type="button"
        onClick={() => navigate('/')}
        className="w-full rounded-2xl bg-linear-to-b from-brass-300 to-brass-500 py-3.5 text-base font-bold text-felt-950 transition active:scale-[0.98]"
        style={{ boxShadow: '0 4px 16px -4px rgb(0 0 0 / 0.5)' }}
      >
        {fr.rulesGotIt}
      </button>
    </div>
  );
}
