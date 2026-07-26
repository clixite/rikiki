import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGuestAccount, requestMagicLink, updateProfile } from '../api';
import { fr } from '../i18n/fr';
import { connectSocket, updateProfileOnSocket } from '../socket';
import { useSession } from '../store/session';

export const AVATARS = ['🦊', '🐼', '🐸', '🦁', '🐙', '🦄', '🐝', '🐺', '🦉', '🐢', '🐬', '🦩', '🐯', '🐨', '🐷', '🦜'];

export default function Profile() {
  const { user, setSession, setUser } = useSession();
  const navigate = useNavigate();
  const [pseudo, setPseudo] = useState(user?.pseudo ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? AVATARS[0]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
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
    <div className="mx-auto flex h-dvh max-w-md flex-col justify-center px-6">
      <h1 className="mb-1 text-center text-3xl font-bold">
        {user ? fr.editProfile : `${fr.appName} 🃏`}
      </h1>
      {!user && <p className="mb-6 text-center text-sm text-white/70">{fr.tagline}</p>}

      <label className="mb-1 mt-4 text-sm font-medium text-white/80" htmlFor="pseudo">
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
        className="rounded-xl border border-white/20 bg-black/25 px-4 py-3 text-lg outline-none focus:border-gold-400"
        placeholder="Marie, Karim, Léa…"
      />

      <p className="mb-2 mt-5 text-sm font-medium text-white/80">{fr.pickAvatar}</p>
      <div className="grid grid-cols-8 gap-1.5">
        {AVATARS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAvatar(a)}
            className={`rounded-xl py-1.5 text-2xl transition ${
              avatar === a ? 'bg-gold-400/30 ring-2 ring-gold-400' : 'bg-black/20 active:scale-90'
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-center text-sm text-red-300">{error}</p>}

      <button
        type="button"
        data-testid="profile-submit"
        onClick={submit}
        disabled={busy}
        className="mt-6 w-full rounded-2xl bg-gold-400 py-4 text-lg font-bold text-felt-900 shadow-lg active:scale-95 disabled:opacity-50"
      >
        {user ? fr.save : fr.letsGo}
      </button>
      {user && <EmailSection isGuest={user.isGuest} email={user.email} />}
      {user && (
        <button type="button" onClick={() => navigate(-1)} className="mt-3 py-2 text-sm text-white/60">
          ← {fr.backHome}
        </button>
      )}
    </div>
  );
}

function EmailSection({ isGuest, email }: { isGuest: boolean; email: string | null }) {
  const [emailInput, setEmailInput] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isGuest && email) {
    return <p className="mt-5 text-center text-xs text-white/50">✅ Profil sauvegardé — {email}</p>;
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
      setMessage(fr.magicLinkSent);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl bg-black/20 p-3">
      <p className="mb-2 text-sm font-medium text-white/80">📬 {fr.saveByEmail}</p>
      <div className="flex gap-2">
        <input
          type="email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder={fr.emailPlaceholder}
          autoComplete="email"
          inputMode="email"
          className="min-w-0 flex-1 rounded-lg border border-white/20 bg-black/25 px-3 py-2 text-sm outline-none focus:border-gold-400"
        />
        <button
          type="button"
          onClick={send}
          disabled={busy}
          className="shrink-0 rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold active:scale-95 disabled:opacity-50"
        >
          {fr.sendMagicLink}
        </button>
      </div>
      {message && <p className="mt-2 text-xs text-white/70">{message}</p>}
    </div>
  );
}
