// 보물: 성유물함을 열면 골드와 유물
import { h, fill } from '../dom.js';
import { app, persist } from '../app.js';
import { t, L } from '../../core/i18n.js';
import { openTreasure } from '../../core/run.js';
import { relicDef } from '../../core/content.js';
import { mountHud, relicTip } from '../hud.js';
import { glyph } from '../art/glyphs.js';
import { icon } from '../art/icons.js';
import { attachTip } from '../tooltip.js';
import { leave } from '../flow.js';
import { sfx } from '../../audio/audio.js';

export function mount(root) {
  const run = app.run;
  root.classList.add(`act-${run.act}`);
  if (!run.treasure) { setTimeout(leave, 0); return {}; }
  const hud = mountHud(root, app);
  const box = h('div', { class: 'room-panel treasure' });
  root.append(box);

  function draw() {
    const tr = run.treasure;
    let relicLine = null;
    if (tr.opened && tr.relic) {
      const rd = relicDef(tr.relic);
      relicLine = h('p', { class: 'loot-line', tabindex: '0' }, glyph(rd.art ?? 'star', 'rglyph big'), h('span', {}, h('b', {}, L(rd.name)), h('br'), h('span', { class: 'dim' }, L(rd.desc))));
      attachTip(relicLine, () => relicTip(tr.relic));
    }
    fill(box,
      h('div', { class: `room-art chest${tr.opened ? ' open' : ''}` }, icon('chest')),
      h('h2', {}, t('treasure.title')),
      tr.opened ? h('div', { class: 'loot' }, h('p', { class: 'loot-line' }, icon('coin'), t('reward.gold', { n: tr.gold })), relicLine) : null,
      h('div', { class: 'room-actions' }, tr.opened
        ? h('button', { class: 'btn primary', onClick: () => leave() }, t('common.continue'))
        : h('button', { class: 'btn primary', onClick: () => { openTreasure(run); sfx('relic'); persist(); hud.update(); draw(); } }, t('treasure.open'))));
  }
  draw();
  return {};
}
