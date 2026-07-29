
import { useGame } from '../store/game';
import { useT } from '../i18n';

interface Props {
  code: string;
}

export default function InviteButtons({ code }: Props) {
  const t = useT();
  const url = `${window.location.origin}/j/${code}`;
  const message = t.inviteMessage(code, url);
  const encoded = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/?text=${encoded}`;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const smsUrl = isIOS ? `sms:&body=${encoded}` : `sms:?body=${encoded}`;
  const canShare = typeof navigator.share === 'function';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      useGame.getState().showToast(t.copied);
    } catch {
      useGame.getState().showToast(url);
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: t.appName, text: message, url });
    } catch {
      // partage annulé
    }
  };

  const btn =
    'flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold shadow-md active:scale-95 transition';

  return (
    <div>
      <p className="mb-2 text-center text-sm text-white/70">{t.invite}</p>
      <div className="grid grid-cols-2 gap-2">
        <a href={whatsappUrl} target="_blank" rel="noreferrer" className={`${btn} bg-[#25D366] text-white`}>
          💬 {t.inviteWhatsApp}
        </a>
        <a href={smsUrl} className={`${btn} bg-blue-500 text-white`}>
          ✉️ {t.inviteSms}
        </a>
        {canShare && (
          <button type="button" onClick={share} className={`${btn} bg-white/15 text-white`}>
            📤 {t.inviteShare}
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          className={`${btn} bg-white/15 text-white ${canShare ? '' : 'col-span-1'}`}
        >
          🔗 {t.copyLink}
        </button>
      </div>
    </div>
  );
}
