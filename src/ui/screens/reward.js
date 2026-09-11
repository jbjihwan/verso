// 전투 보상: 골드 · 물약 · 유물 · 카드 3장 중 1장
import { h } from '../dom.js';
import { app, persist, toast } from '../app.js';
import { t, L } from '../../core/i18n.js';
import { takeGold, takeCard, skipCards, takePotion, takeRelic } from '../../core/run.js';
import { relicDef, potionDef } from '../../core/content.js';
import { mountHud, relicTip } from '../hud.js';
import { cardEl } from '../cardview.js';
import { bindCardChoice } from '../cardtap.js';
import { glyph } from '../art/glyphs.js';
import { icon } from '../art/icons.js';
import { attachTip } from '../tooltip.js';
import { leave } from '../flow.js';
import { markSeen } from '../../core/meta.js';
import { sfx } from '../../audio/audio.js';

export function mount(root) {
  const run = app.run;
  const r = run.reward;
  root.classList.add(`act-${run.act}`);
  if (!r) { setTimeout(leave, 0); return {}; }
  const hud = mountHud(root, app);
  const list = h('div', { class: 'rw-list' });
  const cards = h('div', { class: 'rw-cards' });
  root.append(h('div', { class: 'room-panel reward' },
    h('h2', {}, r.kind === 'boss' ? t('reward.bossTitle') : t('reward.title')),
    list, cards,
    h('div', { class: 'room-actions' }, h('button', { class: 'btn primary', onClick: () => leave() }, t('reward.proceed')))));

  const redraw = () => { persist(); hud.update(); draw(); };

  function item(iconEl, label, onClick, tip) {
    const b = h('button', { class: 'rw-item', onClick }, h('span', { class: 'rw-ico' }, iconEl), h('span', {}, label));
    if (tip) attachTip(b, tip);
    return b;
  }

  function draw() {
    list.replaceChildren();
    if (!r.goldTaken) list.append(item(icon('coin'), t('reward.gold', { n: r.gold }), () => { takeGold(run); sfx('gold'); redraw(); }));
    if (!r.potionTaken) {
      const p = potionDef(r.potion);
      list.append(item(glyph(p.art ?? 'drop', 'rglyph'), L(p.name),
        () => { if (!takePotion(run)) toast(t('reward.potionsFull')); redraw(); },
        () => [{ title: L(p.name), body: L(p.desc, p.vals ?? {}) }]));
    }
    if (!r.relicTaken) {
      const rd = relicDef(r.relic);
      list.append(item(glyph(rd.art ?? 'star', 'rglyph'), L(rd.name), () => { takeRelic(run); sfx('relic'); redraw(); }, () => relicTip(r.relic)));
    }
    cards.replaceChildren();
    for (const c of r.cards) markSeen(app.meta, 'cards', c.id);
    if (r.relic) markSeen(app.meta, 'relics', r.relic);
    if (!r.cardsDone && r.cards.length) {
      const row = h('div', { class: 'rw-cardrow' });
      r.cards.forEach((c, i) => {
        const inst = { uid: `rw${i}`, id: c.id, up: c.up, rev: false };
        const el = cardEl(inst);
        bindCardChoice(el, inst, { label: t('common.take'), onChoose: () => { takeCard(run, i); redraw(); } });
        row.append(el);
      });
      cards.append(h('h3', {}, t('reward.chooseCard')), row,
        h('button', { class: 'btn ghost', onClick: () => { skipCards(run); redraw(); } }, t('reward.skipCards')));
    }
  }
  draw();
  return {};
}
