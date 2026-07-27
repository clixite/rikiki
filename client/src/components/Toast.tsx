import { useGame } from '../store/game';
import { useT } from '../i18n';


export default function Toast() {
  const t = useT();
  const toast = useGame((s) => s.toast);
  const socketConnected = useGame((s) => s.socketConnected);
  const view = useGame((s) => s.view);

  return (
    <>
      {!socketConnected && view !== null && (
        <div className="fixed inset-x-0 top-2 z-50 mx-auto w-fit rounded-full bg-red-600/90 px-4 py-1.5 text-sm font-medium shadow-lg">
          {t.reconnecting}
        </div>
      )}
      {toast && (
        <div className="fixed inset-x-0 top-12 z-50 mx-auto w-fit max-w-[90%] rounded-full bg-black/80 px-4 py-1.5 text-sm shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
