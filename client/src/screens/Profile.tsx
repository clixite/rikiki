import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNav } from '../nav';
import { createGuestAccount, requestMagicLink, updateProfile } from '../api';
import Avatar, { AVATAR_IDS, DEFAULT_AVATAR_ID } from '../components/Avatar';
import AccessibilitySection from '../components/AccessibilitySection';
import LocalePicker from '../components/LocalePicker';
import SoundToggle from '../components/SoundToggle';
import { unlockAudio } from '../audio';
import { useT } from '../i18n';

import { disablePush, enablePush, readPushState, type PushAvailability } from '../push';
import { connectSocket, updateProfileOnSocket } from '../socket';
import { useSession } from '../store/session';

export default function Profile() {
  const t = useT();
  const { user, setSession, setUser } = useSession();
  const navigate = useNav();
  const [pseudo, setPseudo] = useState(user?.pseudo ?? '');
  // Un compte existant peut encore porter un ancien avatar emoji : on le garde
  // tel quel tant que le joueur n'en choisit pas un nouveau (cf. <Avatar />).
  const [avatar, setAvatar] = useState(user?.avatar ?? DEFAULT_AVATAR_ID);
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
            aria-label={t.backHome}
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
          {user ? t.editProfile : t.appName}
        </h1>
        {!user && <p className="mb-6 mt-1 text-center text-sm text-paper-50/55">{t.tagline}</p>}

        {/* Aperçu en direct */}
        <motion.div
          key={avatar}
          initial={{ scale: 0.85 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className="mx-auto my-5 h-20 w-20"
          aria-hidden="true"
        >
          <Avatar id={avatar} size={80} />
        </motion.div>

        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-paper-50/55" htmlFor="pseudo">
          {t.yourPseudo}
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

        <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-paper-50/55">{t.pickAvatar}</p>
        {/* Quatre colonnes : la vignette dessinée mérite d'être vue, et la cible
            tactile reste largement au-dessus des 44 px même sur petit écran. */}
        <div className="grid grid-cols-4 gap-2.5">
          {AVATAR_IDS.map((id, i) => (
            <button
              key={id}
              type="button"
              onClick={() => setAvatar(id)}
              aria-label={`Avatar ${i + 1}`}
              aria-pressed={avatar === id}
              className={`flex aspect-square min-h-11 min-w-11 items-center justify-center rounded-2xl p-2 transition ${
                avatar === id
                  ? 'bg-brass-400/25 ring-2 ring-brass-400'
                  : 'bg-felt-900/40 ring-1 ring-white/6 active:scale-90'
              }`}
            >
              <Avatar id={id} size={64} className="h-full w-full" />
            </button>
          ))}
        </div>

        {error && <p className="mt-3 text-center text-sm text-danger">{error}</p>}

        <LocalePicker className="mt-6" />
        <AccessibilitySection className="mt-3" />

        {user && <NotificationsSection />}
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
        {user ? t.save : t.letsGo}
      </button>
    </div>
  );
}

/**
 * Interrupteur des notifications « c'est ton tour ».
 * La permission n'est demandée qu'ici, sur clic explicite du joueur, et l'état
 * affiché est toujours l'état réel de l'abonnement du navigateur.
 */
function NotificationsSection() {
  const t = useT();
  const [availability, setAvailability] = useState<PushAvailability | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let alive = true;
    readPushState().then((state) => {
      if (!alive) return;
      setAvailability(state.availability);
      setEnabled(state.enabled);
    });
    return () => {
      alive = false;
    };
  }, []);

  const toggle = async () => {
    setBusy(true);
    setMessage('');
    try {
      if (enabled) {
        await disablePush();
      } else {
        await enablePush();
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t.notificationsError);
    } finally {
      // On relit l'état réel plutôt que de supposer que l'action a abouti.
      const state = await readPushState();
      setAvailability(state.availability);
      setEnabled(state.enabled);
      setBusy(false);
    }
  };

  const blocked =
    availability === 'unsupported'
      ? t.notificationsUnsupported
      : availability === 'needs-install'
        ? t.notificationsNeedsInstall
        : availability === 'denied'
          ? t.notificationsDenied
          : null;

  return (
    <div className="mt-6 rounded-xl bg-felt-900/40 p-3.5 ring-1 ring-white/6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-paper-50/90">{t.notificationsTitle}</p>
          <p className="mt-0.5 text-xs leading-snug text-paper-50/45">{t.notificationsHint}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={enabled ? t.notificationsOn : t.notificationsEnable}
          data-testid="push-toggle"
          onClick={toggle}
          disabled={busy || availability === null || blocked !== null}
          className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition disabled:opacity-40 ${
            enabled ? 'bg-brass-400' : 'bg-white/15'
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-paper-50 transition-all ${
              enabled ? 'left-6' : 'left-1'
            }`}
          />
        </button>
      </div>
      <p className={`mt-2 text-xs ${message ? 'text-danger' : 'text-paper-50/50'}`}>
        {message ||
          blocked ||
          (availability === null
            ? t.notificationsChecking
            : enabled
              ? t.notificationsOn
              : t.notificationsOff)}
      </p>
    </div>
  );
}

/**
 * Sauvegarde de la progression par lien magique.
 * Volontairement court : un champ, un bouton, aucun mot de passe.
 */
function AccountSection({ isGuest, email }: { isGuest: boolean; email: string | null }) {
  const t = useT();
  const [emailInput, setEmailInput] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!isGuest && email) {
    return (
      <div className="mt-6 flex items-center gap-2 rounded-xl bg-success/10 px-3.5 py-3 ring-1 ring-success/20">
        <span aria-hidden="true">✓</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-success">{t.accountSaved}</p>
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
      setMessage(t.magicLinkSent);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl bg-felt-900/40 p-3.5 ring-1 ring-white/6">
      <p className="text-sm font-medium text-paper-50/90">{t.saveAccount}</p>
      <p className="mb-2.5 mt-0.5 text-xs leading-snug text-paper-50/45">{t.saveAccountHint}</p>
      {!sent && (
        <div className="flex gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder={t.emailPlaceholder}
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
            {t.sendMagicLink}
          </button>
        </div>
      )}
      {message && (
        <p className={`mt-2 text-xs ${sent ? 'text-success' : 'text-danger'}`}>{message}</p>
      )}
    </div>
  );
}
