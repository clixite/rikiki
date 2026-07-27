import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { createGuestAccount, requestMagicLink, updateProfile } from '../api';
import SoundToggle from '../components/SoundToggle';
import { unlockAudio } from '../audio';
import { fr } from '../i18n/fr';
import { connectSocket, updateProfileOnSocket } from '../socket';
import { useSession } from '../store/session';

export const AVATARS = [
  '🦊', '🐼', '🐸', '🦁', '🐙', '🦄', '🐝', '🐺',
  '🦉', '🐢', '🐬', '🦩', '🐯', '🐨', '🐷', '🦜',
];

export default function Profile() {
  const { user, setSession, setUser } = useSession();
  const navigate = useNavigate();
  const [pseudo, setPseudo] = useState(user?.pseudo ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? AVATARS[0]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    unlockAudio();
    const trimmed = pseudo.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      setError('Ton pseudo doit faire entre 2 et 20 caractères.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (user) {
        const { user: updated } = await updateProfile(trimmed, avatar);
        setUser(updated);
        await updateProfileOnSocket(trimmed, avatar);
        navigate(-1);
      } else {
        const { token, user: created } = await createGuestAccount(trimmed, avatar);
        setSession(token, created);
        connectSocket(token);
        const pending = sessionStorage.getItem('rikiki-pending-code');
        if (pending) {
          sessionStorage.removeItem('rikiki-pending-code');
          navigate(`/j/${pending}`, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
      <div className="flex items-center justify-between">
        {user ? (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-felt-900/45 text-lg ring-1 ring-white/8 transition active:scale-90"
            aria-label={fr.backHome}
          >
            ←
          </button>
        ) : (
          <div className="h-11 w-11" />
        )}
        <SoundToggle />
      </div>

      <div className="rk-scroll min-h-0 flex-1 overflow-y-auto pt-2">
        <h1 className="font-display text-center text-3xl font-bold text-brass-300">
          {user ? fr.editProfile : fr.appName}
        </h1>
        {!user && <p className="mb-6 mt-1 text-center text-sm text-paper-50/55">{fr.tagline}</p>}

        {/* Aperçu en direct */}
        <motion.div
          key={avatar}
          initial={{ scale: 0.85 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className="mx-auto my-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-felt-900/50 text-5xl ring-1 ring-white/10"
          aria-hidden="true"
        >
          {avatar}
        </motion.div>

        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-paper-50/55" htmlFor="pseudo">
          {fr.yourPseudo}
        </label>
        <input
          id="pseudo"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          maxLength={20}
          autoComplete="nickname"
          enterKeyHint="done"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="w-full rounded-xl bg-felt-900/50 px-4 py-3.5 text-lg outline-none ring-1 ring-white/10 transition placeholder:text-paper-50/25 focus:ring-2 focus:ring-brass-400"
          placeholder="Marie, Karim, Léa…"
        />

        <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-paper-50/55">{fr.pickAvatar}</p>
        <div className="grid grid-cols-8 gap-1.5">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAvatar(a)}
              aria-label={a}
              aria-pressed={avatar === a}
              className={`aspect-square rounded-xl text-2xl transition ${
                avatar === a
                  ? 'bg-brass-400/25 ring-2 ring-brass-400'
                  : 'bg-felt-900/40 ring-1 ring-white/6 active:scale-90'
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        {error && <p className="mt-3 text-center text-sm text-danger">{error}</p>}

        {user && <AccountSection isGuest={user.isGuest} email={user.email} />}
      </div>

      <button
        type="button"
        data-testid="profile-submit"
        onClick={submit}
        disabled={busy}
        className="mt-4 w-full rounded-2xl bg-linear-to-b from-brass-300 to-brass-500 py-4 text-lg font-bold text-felt-950 transition active:scale-[0.98] disabled:opacity-40"
        style={{ boxShadow: '0 4px 20px -6px rgb(0 0 0 / 0.6)' }}
      >
        {user ? fr.save : fr.letsGo}
      </button>
    </div>
  );
}

/**
 * Sauvegarde de la progression par lien magique.
 * Volontairement court : un champ, un bouton, aucun mot de passe.
 */
function AccountSection({ isGuest, email }: { isGuest: boolean; email: string | null }) {
  const [emailInput, setEmailInput] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!isGuest && email) {
    return (
      <div className="mt-6 flex items-center gap-2 rounded-xl bg-success/10 px-3.5 py-3 ring-1 ring-success/20">
        <span aria-hidden="true">✓</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-success">{fr.accountSaved}</p>
          <p className="truncate text-xs text-paper-50/50">{email}</p>
        </div>
      </div>
    );
  }

  const send = async () => {
    if (!/^\S+@\S+\.\S+$/.test(emailInput.trim())) {
      setMessage('Adresse e-mail invalide.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await requestMagicLink(emailInput.trim());
      setSent(true);
      setMessage(fr.magicLinkSent);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl bg-felt-900/40 p-3.5 ring-1 ring-white/6">
      <p className="text-sm font-medium text-paper-50/90">{fr.saveAccount}</p>
      <p className="mb-2.5 mt-0.5 text-xs leading-snug text-paper-50/45">{fr.saveAccountHint}</p>
      {!sent && (
        <div className="flex gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder={fr.emailPlaceholder}
            autoComplete="email"
            inputMode="email"
            className="min-w-0 flex-1 rounded-lg bg-felt-950/50 px-3 py-2.5 text-sm outline-none ring-1 ring-white/10 transition placeholder:text-paper-50/25 focus:ring-2 focus:ring-brass-400"
          />
          <button
            type="button"
            onClick={send}
            disabled={busy}
            className="shrink-0 rounded-lg bg-white/10 px-3.5 py-2.5 text-sm font-semibold transition active:scale-95 disabled:opacity-40"
          >
            {fr.sendMagicLink}
          </button>
        </div>
      )}
      {message && (
        <p className={`mt-2 text-xs ${sent ? 'text-success' : 'text-danger'}`}>{message}</p>
      )}
    </div>
  );
}
