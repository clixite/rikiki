import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import type { GroupDetail as GroupDetailData, GroupStanding } from '@rikiki/shared';
import { deleteGroup, fetchGroupDetail, leaveGroup, readCachedGroupDetail } from '../api';
import SoundToggle from '../components/SoundToggle';
import { unlockAudio } from '../audio';
import { useT } from '../i18n';

import { createRoom, setRoomGroup } from '../socket';
import { useGame } from '../store/game';
import { useSession } from '../store/session';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Ordre d'affichage du podium : 2ᵉ, 1ᵉʳ, 3ᵉ — le vainqueur au centre. */
const PODIUM_ORDER = [1, 0, 2];
const PODIUM_MEDALS = ['🥇', '🥈', '🥉'];
const PODIUM_HEIGHTS = ['h-20', 'h-16', 'h-12'];

function Podium({ standings }: { standings: GroupStanding[] }) {
  const top = standings.slice(0, 3);
  return (
    <div className="mt-3 flex items-end justify-center gap-2" data-testid="group-podium">
      {PODIUM_ORDER.filter((i) => top[i]).map((i) => {
        const s = top[i];
        return (
          <motion.div
            key={s.userId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, type: 'spring', stiffness: 240, damping: 22 }}
            className="flex w-[5.5rem] flex-col items-center"
          >
            <span className="text-2xl leading-none" aria-hidden="true">
              {s.avatar}
            </span>
            <span className="mt-1 max-w-full truncate text-[11px] font-medium">{s.pseudo}</span>
            <div
              className={`mt-1.5 flex w-full flex-col items-center justify-center rounded-t-xl ring-1 ring-white/8 ${PODIUM_HEIGHTS[i]} ${
                i === 0 ? 'bg-brass-400/25' : 'bg-felt-900/55'
              }`}
            >
              <span aria-hidden="true" className="text-base leading-none">
                {PODIUM_MEDALS[i]}
              </span>
              <span className="mt-0.5 text-sm font-bold tabular-nums text-brass-300">{s.totalPoints}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function GroupDetail() {
  const t = useT();
  const { id = '' } = useParams();
  const { user } = useSession();
  const navigate = useNavigate();
  const [data, setData] = useState<GroupDetailData | null>(() => readCachedGroupDetail(id));
  const [loading, setLoading] = useState(data === null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    fetchGroupDetail(id)
      .then(setData)
      .catch((e: unknown) => {
        // Groupe supprimé, ou dont on ne fait plus partie : retour à la liste
        useGame.getState().showToast(e instanceof Error ? e.message : t.groupNotFound);
        navigate('/groups', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [user?.id, id]);

  if (!user) return <Navigate to="/profile" replace />;

  const isOwner = data?.group.ownerId === user.id;

  /** Crée une partie et la rattache aussitôt au groupe, puis ouvre le salon. */
  const onPlay = async () => {
    if (!data) return;
    unlockAudio();
    setBusy(true);
    const res = await createRoom();
    if (!res.ok) {
      setBusy(false);
      useGame.getState().showToast(res.error.message);
      return;
    }
    const attached = await setRoomGroup(data.group.id);
    setBusy(false);
    if (attached.ok) useGame.getState().showToast(t.groupAttached(data.group.name));
    navigate('/game');
  };

  const onCopyCode = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.group.code);
      useGame.getState().showToast(t.groupCodeCopied);
    } catch {
      // presse-papier indisponible : le code reste lisible à l'écran
    }
  };

  const onLeave = async () => {
    if (!data || !confirm(t.groupLeaveConfirm)) return;
    setBusy(true);
    try {
      await leaveGroup(data.group.id);
      navigate('/groups', { replace: true });
    } catch (e) {
      useGame.getState().showToast(e instanceof Error ? e.message : t.errorTitle);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!data || !confirm(t.groupDeleteConfirm)) return;
    setBusy(true);
    try {
      await deleteGroup(data.group.id);
      navigate('/groups', { replace: true });
    } catch (e) {
      useGame.getState().showToast(e instanceof Error ? e.message : t.errorTitle);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/groups')}
          aria-label={t.groups}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-felt-900/45 text-lg ring-1 ring-white/8 transition active:scale-90"
        >
          ←
        </button>
        <SoundToggle />
      </div>

      {loading && !data ? (
        <p className="py-8 text-center text-sm text-paper-50/45">{t.loading}</p>
      ) : !data ? (
        <p className="py-8 text-center text-sm text-paper-50/45">{t.groupNotFound}</p>
      ) : (
        <>
          <h1
            data-testid="group-name"
            className="font-display mt-2 text-center text-2xl font-bold text-brass-300"
          >
            {data.group.name}
          </h1>
          <p className="mt-0.5 text-center text-xs text-paper-50/45">
            {t.groupMembers(data.group.membersCount)} · {t.groupGames(data.group.gamesCount)}
          </p>

          {/* Code de partage : la porte d'entrée du groupe */}
          <button
            type="button"
            data-testid="group-share-code"
            onClick={onCopyCode}
            title={t.copyGroupCode}
            className="mx-auto mt-2.5 flex h-11 items-center gap-2 rounded-full bg-felt-900/45 px-4 ring-1 ring-white/8 transition active:scale-95"
          >
            <span className="text-[10px] uppercase tracking-wide text-paper-50/40">{t.groupCode}</span>
            <span className="font-mono text-base font-bold tracking-[0.25em] text-brass-300">
              {data.group.code}
            </span>
            <span aria-hidden="true" className="text-sm text-paper-50/35">
              ⧉
            </span>
          </button>

          <div className="rk-scroll mt-3 min-h-0 flex-1 overflow-y-auto">
            {data.group.gamesCount === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-paper-50/45">{t.groupNoGames}</p>
                <p className="mx-auto mt-1 max-w-[16rem] text-xs text-paper-50/30">{t.groupNoGamesHint}</p>
              </div>
            ) : (
              <Podium standings={data.standings} />
            )}

            {/* Classement cumulé complet */}
            <h2 className="mt-4 text-xs font-semibold uppercase tracking-wide text-paper-50/45">
              {t.groupRanking}
            </h2>
            <table className="mt-1.5 w-full text-sm" data-testid="group-standings">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-paper-50/35">
                  <th className="w-6 py-1 text-left font-medium">{t.groupRankHeader}</th>
                  <th className="py-1 text-left font-medium">{t.groupPlayerHeader}</th>
                  <th className="w-10 py-1 text-right font-medium">{t.groupPointsHeader}</th>
                  <th className="w-8 py-1 text-right font-medium">{t.groupPlayedHeader}</th>
                  <th className="w-8 py-1 text-right font-medium">{t.groupWonHeader}</th>
                </tr>
              </thead>
              <tbody>
                {data.standings.map((s, i) => (
                  <tr
                    key={s.userId}
                    data-testid="group-standing-row"
                    className={`border-t border-white/6 ${s.userId === user.id ? 'text-brass-200' : ''}`}
                  >
                    <td className="py-2 tabular-nums text-paper-50/40">{i + 1}</td>
                    <td className="py-2">
                      <span className="flex items-center gap-1.5">
                        <span aria-hidden="true">{s.avatar}</span>
                        <span className="max-w-28 truncate">{s.pseudo}</span>
                        {s.userId === data.group.ownerId && (
                          <span className="text-[9px] uppercase tracking-wide text-paper-50/30">
                            {t.groupOwner}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-2 text-right font-bold tabular-nums text-brass-300">{s.totalPoints}</td>
                    <td className="py-2 text-right tabular-nums text-paper-50/45">{s.gamesPlayed}</td>
                    <td className="py-2 text-right tabular-nums text-paper-50/45">{s.gamesWon}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Dernières parties du groupe */}
            {data.recentGames.length > 0 && (
              <>
                <h2 className="mt-5 text-xs font-semibold uppercase tracking-wide text-paper-50/45">
                  {t.groupRecentGames}
                </h2>
                <ul className="mt-1.5 space-y-2" data-testid="group-recent-games">
                  {data.recentGames.map((g) => (
                    <li
                      key={`${g.code}-${g.playedAt}`}
                      className="rounded-xl bg-felt-900/45 p-3 ring-1 ring-white/6"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-paper-50/45">{formatDate(g.playedAt)}</span>
                        <span className="flex-1" />
                        <span className="font-mono text-[11px] tracking-widest text-paper-50/30">{g.code}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                        {g.results.map((r) => (
                          <span
                            key={r.userId}
                            className={`flex items-center gap-1 text-[11px] ${
                              r.won ? 'text-success' : 'text-paper-50/55'
                            }`}
                            title={`${r.pseudo} · ${r.score}`}
                          >
                            <span aria-hidden="true">{r.avatar}</span>
                            <span className="max-w-16 truncate">{r.pseudo}</span>
                            <span className="tabular-nums text-paper-50/35">{r.score}</span>
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Quitter / supprimer : le créateur ne peut que supprimer */}
            <div className="mt-6 pb-2">
              {isOwner ? (
                <>
                  <button
                    type="button"
                    data-testid="group-delete"
                    onClick={onDelete}
                    disabled={busy}
                    className="h-11 w-full rounded-xl text-xs font-semibold text-danger ring-1 ring-danger/25 transition active:scale-[0.98] disabled:opacity-40"
                  >
                    {t.groupDelete}
                  </button>
                  <p className="mt-1.5 text-center text-[10px] text-paper-50/30">{t.groupOwnerCannotLeave}</p>
                </>
              ) : (
                <button
                  type="button"
                  data-testid="group-leave"
                  onClick={onLeave}
                  disabled={busy}
                  className="h-11 w-full rounded-xl text-xs font-semibold text-paper-50/45 ring-1 ring-white/10 transition active:scale-[0.98] disabled:opacity-40"
                >
                  {t.groupLeave}
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            data-testid="group-play"
            onClick={onPlay}
            disabled={busy}
            className="mt-2.5 w-full rounded-2xl bg-linear-to-b from-brass-300 to-brass-500 py-4 text-base font-bold text-felt-950 transition active:scale-[0.98] disabled:opacity-40"
            style={{ boxShadow: '0 4px 20px -6px rgb(0 0 0 / 0.6)' }}
          >
            {t.groupPlay}
          </button>
        </>
      )}
    </div>
  );
}
