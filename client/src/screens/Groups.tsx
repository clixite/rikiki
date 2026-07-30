import { useEffect, useState } from 'react';
import { m as motion } from 'motion/react';
import { Navigate } from 'react-router-dom';
import { useNav } from '../nav';
import type { Group } from '@rikiki/shared';
import { createGroup, fetchGroups, joinGroupByCode, readCachedGroups } from '../api';
import SoundToggle from '../components/SoundToggle';
import { useT } from '../i18n';

import { useGame } from '../store/game';
import { useSession } from '../store/session';

/** Onglet actif du panneau d'action en bas d'écran. */
type Panel = 'none' | 'create' | 'join';

export default function Groups() {
  const t = useT();
  const { user } = useSession();
  const navigate = useNav();
  // Comme pour l'historique : le cache local s'affiche tout de suite, le
  // réseau vient rafraîchir derrière.
  const [groups, setGroups] = useState<Group[] | null>(() => (user ? readCachedGroups(user.id) : null));
  const [loading, setLoading] = useState(groups === null);
  const [panel, setPanel] = useState<Panel>('none');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    if (!user) return;
    fetchGroups(user.id)
      .then(setGroups)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [user?.id]);

  if (!user) return <Navigate to="/profile" replace />;

  const onCreate = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 30) {
      setError(t.groupNameTooShort);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { group } = await createGroup(trimmed);
      useGame.getState().showToast(t.groupCreated(group.name));
      setName('');
      setPanel('none');
      refresh();
      navigate(`/groups/${group.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errorTitle);
    } finally {
      setBusy(false);
    }
  };

  const onJoin = async () => {
    if (code.length !== 6) return;
    setBusy(true);
    setError('');
    try {
      const { group } = await joinGroupByCode(code);
      useGame.getState().showToast(t.groupJoined(group.name));
      setCode('');
      setPanel('none');
      refresh();
      navigate(`/groups/${group.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errorTitle);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label={t.backHome}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-felt-900/45 text-lg ring-1 ring-white/8 transition active:scale-90"
        >
          ←
        </button>
        <SoundToggle />
      </div>

      <h1 className="font-display mt-2 text-center text-2xl font-bold text-brass-300">{t.groupsTitle}</h1>
      <p className="mx-auto mt-1 max-w-[18rem] text-center text-xs leading-snug text-paper-50/55">
        {t.groupsSubtitle}
      </p>

      <div className="rk-scroll mt-4 min-h-0 flex-1 overflow-y-auto">
        {loading && !groups ? (
          <p className="py-8 text-center text-sm text-paper-50/55">{t.loading}</p>
        ) : !groups || groups.length === 0 ? (
          <p data-testid="groups-empty" className="py-8 text-center text-sm text-paper-50/55">
            {t.noGroups}
          </p>
        ) : (
          <ul className="space-y-2" data-testid="groups-list">
            {groups.map((g, i) => (
              <motion.li
                key={g.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <button
                  type="button"
                  data-testid="group-item"
                  onClick={() => navigate(`/groups/${g.id}`)}
                  className="flex w-full min-h-11 items-center gap-3 rounded-xl bg-felt-900/45 p-3 text-left ring-1 ring-white/6 transition active:scale-[0.98]"
                >
                  <span className="text-2xl leading-none" aria-hidden="true">
                    🃏
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{g.name}</span>
                    <span className="block text-[11px] text-paper-50/55">
                      {t.groupMembers(g.membersCount)} · {t.groupGames(g.gamesCount)}
                    </span>
                  </span>
                  <span className="font-mono text-xs tracking-widest text-brass-300/70">{g.code}</span>
                  <span className="text-paper-50/35">›</span>
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      {/* Panneau d'action : création ou adhésion par code */}
      <div className="mt-3 space-y-2.5">
        {panel === 'create' && (
          <div className="rounded-2xl bg-felt-900/45 p-3 ring-1 ring-white/8">
            <label htmlFor="group-name" className="mb-1.5 block text-xs text-paper-50/55">
              {t.groupNameLabel}
            </label>
            <input
              id="group-name"
              data-testid="group-name-input"
              autoFocus
              value={name}
              maxLength={30}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder={t.groupNamePlaceholder}
              className="h-11 w-full rounded-xl bg-black/25 px-3 text-sm outline-none ring-1 ring-white/10 placeholder:text-paper-50/55 focus:ring-brass-400"
            />
            <button
              type="button"
              data-testid="group-create-submit"
              onClick={onCreate}
              disabled={busy}
              className="mt-2.5 h-11 w-full rounded-xl bg-linear-to-b from-brass-300 to-brass-500 text-sm font-bold text-felt-950 transition active:scale-[0.98] disabled:opacity-40"
            >
              {t.createGroupCta}
            </button>
          </div>
        )}

        {panel === 'join' && (
          <div className="rounded-2xl bg-felt-900/45 p-3 ring-1 ring-white/8">
            <label htmlFor="group-code" className="mb-1.5 block text-xs text-paper-50/55">
              {t.groupCodeLabel}
            </label>
            <input
              id="group-code"
              data-testid="group-code-input"
              autoFocus
              value={code}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6));
                setError('');
              }}
              placeholder={t.groupCodePlaceholder}
              className="h-11 w-full rounded-xl bg-black/25 px-3 text-center font-mono text-lg tracking-[0.4em] outline-none ring-1 ring-white/10 placeholder:tracking-[0.4em] placeholder:text-paper-50/55 focus:ring-brass-400"
            />
            <p className="mt-1 text-center text-[10px] text-paper-50/55">{t.groupCodeHint}</p>
            <button
              type="button"
              data-testid="group-join-submit"
              onClick={onJoin}
              disabled={busy || code.length !== 6}
              className="mt-2 h-11 w-full rounded-xl bg-linear-to-b from-brass-300 to-brass-500 text-sm font-bold text-felt-950 transition active:scale-[0.98] disabled:opacity-40"
            >
              {t.joinGroupCta}
            </button>
          </div>
        )}

        {error && <p className="text-center text-xs text-danger">{error}</p>}

        <div className="flex gap-2.5">
          <button
            type="button"
            data-testid="group-create-toggle"
            onClick={() => {
              setPanel(panel === 'create' ? 'none' : 'create');
              setError('');
            }}
            className={`h-12 flex-1 rounded-2xl text-sm font-semibold ring-1 transition active:scale-[0.98] ${
              panel === 'create' ? 'bg-brass-400/20 ring-brass-400/40' : 'bg-white/8 ring-white/10'
            }`}
          >
            {t.createGroup}
          </button>
          <button
            type="button"
            data-testid="group-join-toggle"
            onClick={() => {
              setPanel(panel === 'join' ? 'none' : 'join');
              setError('');
            }}
            className={`h-12 flex-1 rounded-2xl text-sm font-semibold ring-1 transition active:scale-[0.98] ${
              panel === 'join' ? 'bg-brass-400/20 ring-brass-400/40' : 'bg-white/8 ring-white/10'
            }`}
          >
            {t.joinGroup}
          </button>
        </div>
      </div>
    </div>
  );
}
