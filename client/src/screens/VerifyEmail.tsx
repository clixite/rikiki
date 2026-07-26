import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyMagicLink } from '../api';
import { fr } from '../i18n/fr';
import { connectSocket } from '../socket';
import { useSession } from '../store/session';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'ok' | 'error'>('pending');
  const tried = useRef(false);

  useEffect(() => {
    const t = params.get('t');
    if (!t || tried.current) {
      if (!t) setStatus('error');
      return;
    }
    tried.current = true;
    verifyMagicLink(t)
      .then(({ token, user }) => {
        useSession.getState().setSession(token, user);
        connectSocket(token);
        setStatus('ok');
      })
      .catch(() => setStatus('error'));
  }, [params]);

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      {status === 'pending' && <p className="text-white/70">{fr.verifying}</p>}
      {status === 'ok' && (
        <>
          <div className="mb-3 text-5xl">✅</div>
          <p className="font-medium">{fr.verified}</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="mb-3 text-5xl">😕</div>
          <p className="text-white/80">{fr.verifyFailed}</p>
        </>
      )}
      <button
        type="button"
        onClick={() => navigate('/', { replace: true })}
        className="mt-8 rounded-2xl bg-gold-400 px-8 py-3 font-bold text-felt-900 shadow-lg active:scale-95"
      >
        {fr.backHome}
      </button>
    </div>
  );
}
