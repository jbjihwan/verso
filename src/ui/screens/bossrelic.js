// 보스 유물 3개 중 1개(가져가지 않아도 된다)
import { h } from '../dom.js';
import { app } from '../app.js';
import { t, L } from '../../core/i18n.js';
import { relicDef } from '../../core/content.js';
import { mountHud } from '../hud.js';
import { glyph } from '../art/glyphs.js';
import { takeBossRelic } from '../flow.js';

export function mount(root) {
  const run = app.run;
  root.classList.add(`act-${run.act}`);
  const br = run.bossRelic;
  if (!br) { setTimeout(() => takeBossRelic(null), 0); return {}; }
  mountHud(root, app);
  root.append(h('div', { class: 'room-panel bossrelic' },
    h('h2', {}, t('bossRelic.title')),
    h('div', { class: 'br-options' }, br.options.map((id, i) => {
      const r = relicDef(id);
      return h('button', { class: 'br-opt', onClick: () => takeBossRelic(i) },
        glyph(r.art ?? 'star', 'rglyph huge'), h('b', {}, L(r.name)), h('span', { class: 'dim' }, L(r.desc)));
    })),
    h('div', { class: 'room-actions' }, h('button', { class: 'btn ghost', onClick: () => takeBossRelic(null) }, t('bossRelic.skip')))));
  return {};
}
