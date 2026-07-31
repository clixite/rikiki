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
        <div
          role="status"
          className="fixed inset-x-0 top-2 z-50 mx-auto w-fit rounded-full bg-red-600/90 px-4 py-1.5 text-sm font-medium shadow-lg"
        >
          {t.reconnecting}
        </div>
      )}
      {/* `assertive` : ces messages sont presque toujours la réponse à une
          action qui vient d'échouer (« coup refusé », « partie fermée »). Sans
          cela, un joueur au lecteur d'écran tente un coup illégal et n'entend
          RIEN — pour lui, le jeu a simplement cessé de répondre. */}
      <div role="alert" aria-live="assertive" className="contents">
        {/* En bas, pas en haut : posé à 48 px du sommet, le message venait
            recouvrir précisément ce qu'on était en train de lire — le code de
            la partie dans le salon, le nom du groupe qu'on vient de créer. Le
            bas de l'écran est la seule bande qui ne porte d'information
            critique sur aucun écran. Le bandeau de reconnexion, lui, reste en
            haut : c'est une alerte, elle a le droit de s'imposer. */}
        {toast && (
          <div className="fixed inset-x-0 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+5rem))] z-50 mx-auto w-fit max-w-[90%] rounded-full bg-black/80 px-4 py-1.5 text-center text-sm shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </>
  );
}
