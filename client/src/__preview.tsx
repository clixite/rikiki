/* Script temporaire d'aperçu — non versionné, supprimé après vérification. */
import { writeFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import Avatar, { AVATAR_IDS } from './components/Avatar';

const tokens = `
  --color-felt-400:#4a8f6a; --color-felt-500:#35734f; --color-felt-600:#275b3d;
  --color-felt-700:#1d4a31; --color-felt-800:#163a27; --color-felt-900:#10291c;
  --color-felt-950:#0a1b13;
  --color-brass-200:#f4e4b8; --color-brass-300:#e8cd8a; --color-brass-400:#d9b25c;
  --color-brass-500:#c1953d; --color-brass-600:#9d762c;
  --color-paper-50:#fdfbf6; --color-paper-100:#f7f2e7; --color-paper-300:#ddd4c0;
  --color-ink:#1a1712; --color-suit-red:#b8323a; --color-suit-black:#22201c;
  --color-success:#4ba36f; --color-danger:#d4614f;
`;

const row = (size: 24 | 80) =>
  AVATAR_IDS.map(
    (id) =>
      `<div class="cell"><div>${renderToStaticMarkup(<Avatar id={id} size={size} />)}</div><span>${id}</span></div>`,
  ).join('');

const emoji = ['🦊', '🐼', '🐸']
  .map(
    (e) =>
      `<div class="cell"><div>${renderToStaticMarkup(<Avatar id={e} size={80} />)}</div><span>${e}</span></div>`,
  )
  .join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
:root{${tokens}}
body{margin:0;padding:28px;font-family:system-ui,sans-serif;color:#fdfbf6;
 background:radial-gradient(ellipse 120% 80% at 50% 22%, #275b3d 0%, transparent 60%),
 radial-gradient(ellipse 100% 100% at 50% 100%, #0a1b13 0%, transparent 70%), #163a27;}
h2{font:600 13px/1 system-ui;letter-spacing:.12em;text-transform:uppercase;opacity:.55;margin:26px 0 12px}
.grid{display:flex;flex-wrap:wrap;gap:14px}
.cell{display:flex;flex-direction:column;align-items:center;gap:5px;width:92px}
.cell span{font-size:10px;opacity:.45}
.tiny .cell{width:44px}
.bar{display:flex;align-items:center;gap:8px;background:#10291c80;padding:10px 14px;border-radius:14px;width:max-content}
.bar b{font:600 12px system-ui}
.bg-felt-900\\/50{background:#10291c80}
.ring-1{box-shadow:inset 0 0 0 1px #ffffff1a}
</style></head><body>
<h2>16 avatars — 80 px</h2><div class="grid">${row(80)}</div>
<h2>16 avatars — 24 px (taille réelle barre adversaires)</h2><div class="grid tiny">${row(24)}</div>
<h2>Mise en situation — barre des adversaires</h2>
<div class="bar">${AVATAR_IDS.slice(0, 6)
  .map(
    (id, i) =>
      `<div style="display:flex;align-items:center;gap:5px">${renderToStaticMarkup(<Avatar id={id} size={24} />)}<b>${['Marie', 'Karim', 'Léa', 'Tom', 'Zoé', 'Ali'][i]}</b></div>`,
  )
  .join('')}</div>
<h2>Rétrocompatibilité — anciens comptes emoji</h2><div class="grid">${emoji}</div>
</body></html>`;

writeFileSync(process.argv[2], html);
