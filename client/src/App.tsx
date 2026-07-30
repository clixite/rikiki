import { lazy, Suspense, useEffect, useRef } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useNav } from './nav';
import Confetti from './components/Confetti';
import LiveAnnouncer from './components/LiveAnnouncer';
import Toast from './components/Toast';
import UpdatePrompt from './components/UpdatePrompt';
import { useT } from './i18n';

import { connectSocket, joinRoom } from './socket';
import { useGame } from './store/game';
import { useSession } from './store/session';
import Game from './screens/Game';
import Home from './screens/Home';
import Join from './screens/Join';
import Profile from './screens/Profile';

/*
 * Écrans chargés à la demande.
 *
 * Le chemin de jeu — accueil, profil, rejoindre, table — reste dans le premier
 * paquet : y mettre le moindre délai se paierait au pire moment, quand la
 * partie démarre. Tout le reste se consulte à froid, entre deux parties, et
 * n'a aucune raison d'alourdir l'ouverture de l'application : les règles et
 * leur démonstration animée, l'historique, les groupes, la confirmation
 * d'adresse. Le service worker les met de toute façon en cache dès la
 * première visite, donc la seconde ne coûte rien.
 */
const GroupDetail = lazy(() => import('./screens/GroupDetail'));
const Groups = lazy(() => import('./screens/Groups'));
const History = lazy(() => import('./screens/History'));
const Rules = lazy(() => import('./screens/Rules'));
const VerifyEmail = lazy(() => import('./screens/VerifyEmail'));

/**
 * Attente d'un écran chargé à la demande.
 *
 * Volontairement nue : ces écrans arrivent en quelques dizaines de
 * millisecondes depuis le cache du service worker, et une animation d'attente
 * qui apparaît puis disparaît aussitôt se voit plus qu'un fond calme.
 */
function ScreenLoading({ label }: { label: string }) {
  return (
    <div className="flex h-dvh items-center justify-center text-sm text-paper-50/40" aria-busy="true">
      {label}
    </div>
  );
}

export default function App() {
  const t = useT();
  const { token, user, roomCode } = useSession();
  const view = useGame((s) => s.view);
  const celebrate = useGame((s) => s.celebrate);
  // Salve nourrie pour une victoire finale, brève pour un contrat tenu
  const celebrateIntensity = view?.phase === 'game-over' ? 'full' : 'light';
  const socketConnected = useGame((s) => s.socketConnected);
  const closedReason = useGame((s) => s.closedReason);
  const navigate = useNav();
  const rejoinTried = useRef(false);

  useEffect(() => {
    if (token && user) connectSocket(token);
  }, [token, user]);

  // Reprise automatique de la partie après un refresh
  useEffect(() => {
    if (!token || !roomCode || view || !socketConnected || rejoinTried.current) return;
    rejoinTried.current = true;
    joinRoom(roomCode).then((res) => {
      if (!res.ok) useSession.getState().setRoomCode(null);
    });
  }, [token, roomCode, view, socketConnected]);

  // Room fermée (expiration, exclusion…) : retour à l'accueil
  useEffect(() => {
    if (!closedReason) return;
    useGame
      .getState()
      .showToast(closedReason === 'kicked' ? t.roomClosedKicked : closedReason === 'expired' ? t.roomClosedExpired : t.roomClosed);
    useGame.getState().setClosed(null);
    navigate('/');
  }, [closedReason, navigate]);

  return (
    <>
      <Confetti trigger={celebrate} intensity={celebrateIntensity} />
      <LiveAnnouncer />
      <Toast />
      <UpdatePrompt />
      <Suspense fallback={<ScreenLoading label={t.loading} />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/join" element={<Join />} />
          <Route path="/j/:code" element={<Join />} />
          <Route path="/game" element={<Game />} />
          <Route path="/history" element={<History />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:id" element={<GroupDetail />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
