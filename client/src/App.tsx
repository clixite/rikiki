import { useEffect, useRef } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Toast from './components/Toast';
import UpdatePrompt from './components/UpdatePrompt';
import { fr } from './i18n/fr';
import { connectSocket, joinRoom } from './socket';
import { useGame } from './store/game';
import { useSession } from './store/session';
import Game from './screens/Game';
import GroupDetail from './screens/GroupDetail';
import Groups from './screens/Groups';
import History from './screens/History';
import Home from './screens/Home';
import Join from './screens/Join';
import Profile from './screens/Profile';
import Rules from './screens/Rules';
import VerifyEmail from './screens/VerifyEmail';

export default function App() {
  const { token, user, roomCode } = useSession();
  const view = useGame((s) => s.view);
  const socketConnected = useGame((s) => s.socketConnected);
  const closedReason = useGame((s) => s.closedReason);
  const navigate = useNavigate();
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
      .showToast(closedReason === 'kicked' ? fr.roomClosedKicked : closedReason === 'expired' ? fr.roomClosedExpired : fr.roomClosed);
    useGame.getState().setClosed(null);
    navigate('/');
  }, [closedReason, navigate]);

  return (
    <>
      <Toast />
      <UpdatePrompt />
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
    </>
  );
}
