import { fr } from '../i18n/fr';
import { useGame } from '../store/game';

interface Props {
  code: string;
}

export default function InviteButtons({ code }: Props) {
  const url = `${window.location.origin}/j/${code}`;
  const message = fr.inviteMessage(code, url);
  const encoded = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/?text=${encoded}`;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const smsUrl = isIOS ? `sms:&body=${encoded}` : `sms:?body=${encoded}`;
  const canShare = typeof navigator.share === 'function';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      useGame.getState().showToast(fr.copied);
    } catch {
      useGame.getState().showToast(url);
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: fr.appName, text: message, url });
    } catch {
      // partage annulé
    }
  };

  const btn =
    'flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold shadow-md active:scale-95 transition';

  return (
    <div>
      <p className="mb-2 text-center text-sm text-white/70">{fr.invite}</p>
      <div className="grid grid-cols-2 gap-2">
        <a href={whatsappUrl} target="_blank" rel="noreferrer" className={`${btn} bg-[#25D366] text-white`}>
          💬 {fr.inviteWhatsApp}
        </a>
        <a href={smsUrl} className={`${btn} bg-blue-500 text-white`}>
          ✉️ {fr.inviteSms}
        </a>
        {canShare && (
          <button type="button" onClick={share} className={`${btn} bg-white/15 text-white`}>
            📤 {fr.inviteShare}
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          className={`${btn} bg-white/15 text-white ${canShare ? '' : 'col-span-1'}`}
        >
          🔗 {fr.copyLink}
        </button>
      </div>
    </div>
  );
}
