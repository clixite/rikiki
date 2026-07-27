import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useT } from '../i18n';

import { joinRoom } from '../socket';
import { useGame } from '../store/game';
import { useSession } from '../store/session';

export default function Join() {
  const t = useT();
  const { code: urlCode } = useParams();
  const { user } = useSession();
  const socketConnected = useGame((s) => s.socketConnected);
  const navigate = useNavigate();
  const [code, setCode] = useState((urlCode ?? '').toUpperCase().slice(0, 4));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const autoTried = useRef(false);

  // Arrivée via lien /j/CODE sans profil : on crée le profil d'abord
  useEffect(() => {
    if (!user && urlCode) {
      sessionStorage.setItem('rikiki-pending-code', urlCode.toUpperCase().slice(0, 4));
      navigate('/profile', { replace: true });
    } else if (!user) {
      navigate('/profile', { replace: true });
    }
  }, [user, urlCode, navigate]);

  const submit = async (value: string) => {
    if (busy) return;
    setBusy(true);
    setError('');
    const res = await joinRoom(value);
    setBusy(false);
    if (res.ok) {
      navigate('/game', { replace: true });
    } else {
      setError(res.error.message);
    }
  };

  // Auto-join quand on arrive par le lien d'invitation
  useEffect(() => {
    if (user && socketConnected && urlCode && !autoTried.current && /^[A-Za-z]{4}$/.test(urlCode)) {
      autoTried.current = true;
      submit(urlCode.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, socketConnected, urlCode]);

  const onChange = (raw: string) => {
    const cleaned = raw.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    setCode(cleaned);
    setError('');
    if (cleaned.length === 4) submit(cleaned);
  };

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col items-center justify-center px-6">
      <h1 className="mb-2 text-2xl font-bold">{t.joinGame}</h1>
      <p className="mb-6 text-sm text-white/70">{t.enterCode}</p>

      <div className="relative">
        <input
          autoFocus
          value={code}
          onChange={(e) => onChange(e.target.value)}
          maxLength={4}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          className="absolute inset-0 z-10 w-full bg-transparent text-transparent caret-transparent outline-none"
          aria-label={t.enterCode}
        />
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex h-16 w-13 items-center justify-center rounded-xl border-2 bg-black/25 text-3xl font-bold ${
                i === code.length ? 'border-gold-400' : 'border-white/20'
              }`}
            >
              {code[i] ?? ''}
            </div>
          ))}
        </div>
      </div>

      {busy && <p className="mt-4 text-sm text-white/60">{t.loading}</p>}
      {error && <p className="mt-4 text-center text-sm text-red-300">{error}</p>}

      <button type="button" onClick={() => navigate('/')} className="mt-8 py-2 text-sm text-white/60">
        ← {t.backHome}
      </button>
    </div>
  );
}
