import type { GameView } from '@rikiki/shared';
import { fr } from '../i18n/fr';

interface Props {
  view: GameView;
  open: boolean;
  onClose: () => void;
}

export default function ScoreDrawer({ view, open, onClose }: Props) {
  if (!open) return null;
  const sorted = [...view.players].sort((a, b) => b.totalScore - a.totalScore);
  return (
    <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose}>
      <div
        className="animate-slide-up absolute inset-x-0 bottom-0 max-h-[70%] overflow-y-auto rounded-t-2xl bg-felt-800 p-4 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-center text-lg font-bold">{fr.scoreboard}</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/60">
              <th className="pb-2 text-left font-normal">{fr.players}</th>
              <th className="pb-2 text-right font-normal">{fr.total}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={p.id} className="border-t border-white/10">
                <td className="py-2">
                  <span className="mr-1">{i === 0 ? '👑' : ''}</span>
                  {p.avatar} {p.pseudo}
                  {p.id === view.you && <span className="ml-1 text-white/50">({fr.you})</span>}
                </td>
                <td className="py-2 text-right font-bold text-gold-300">{p.totalScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
