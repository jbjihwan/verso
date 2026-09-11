// 골동품 상인: 카드 7(캐릭터 5 + 무색 2) · 유물 3 · 물약 3 · 카드 제거
import { h, fill } from '../dom.js';
import { app, persist, toast, openOverlay } from '../app.js';
import { t, L } from '../../core/i18n.js';
import { buy, priceOf, removeCard, removePrice } from '../../core/run.js';
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

const REASON = { poor: 'shop.poor', potionsFull: 'shop.potionsFull', sold: 'shop.sold' };

export function mount(root) {
  const run = app.run;
  root.classList.add(`act-${run.act}`);
  if (!run.shop) { setTimeout(leave, 0); return {}; }
  const hud = mountHud(root, app);
  const body = h('div', { class: 'shop' });
  root.append(body);

  const refresh = () => { persist(); hud.update(); draw(); };
  const tryBuy = (kind, i) => {
    const res = buy(run, kind, i);
    if (!res.ok) { toast(t(REASON[res.reason] ?? 'shop.sold')); sfx('error'); return; }
    sfx('gold');
    refresh();
  };
  const tag = (price, sale) => h('span', { class: `price num${run.gold < price ? ' poor' : ''}${sale ? ' sale' : ''}` }, icon('coin'), String(price));
  const soldTag = () => h('span', { class: 'price faint' }, t('shop.sold'));

  function draw() {
    const s = run.shop;
    for (const it of [...s.cards, ...s.neutral]) markSeen(app.meta, 'cards', it.id);
    for (const it of s.relics) markSeen(app.meta, 'relics', it.id);
    const cards = h('div', { class: 'shop-cards' });
    for (const [kind, list] of [['cards', s.cards], ['neutral', s.neutral]]) {
      list.forEach((it, i) => {
        const inst = { uid: `sh-${kind}-${i}`, id: it.id, up: it.up, rev: false };
        const el = cardEl(inst);
        const price = priceOf(run, it);
        if (!it.sold) bindCardChoice(el, inst, { label: `${t('shop.buy')} · ${price}`, onChoose: () => tryBuy(kind, i) });
        cards.append(h('div', { class: `shop-item${it.sold ? ' sold' : ''}` }, el, it.sold ? soldTag() : tag(price, it.sale)));
      });
    }
    const relics = s.relics.map((it, i) => {
      const rd = relicDef(it.id);
      const b = h('button', { class: `shop-thing${it.sold ? ' sold' : ''}`, disabled: it.sold, onClick: () => tryBuy('relics', i) },
        glyph(rd.art ?? 'star', 'rglyph big'), h('span', { class: 'shop-name' }, L(rd.name)), it.sold ? soldTag() : tag(priceOf(run, it)));
      attachTip(b, () => relicTip(it.id));
      return b;
    });
    const potions = s.potions.map((it, i) => {
      const p = potionDef(it.id);
      const b = h('button', { class: `shop-thing${it.sold ? ' sold' : ''}`, disabled: it.sold, onClick: () => tryBuy('potions', i) },
        glyph(p.art ?? 'drop', 'rglyph big'), h('span', { class: 'shop-name' }, L(p.name)), it.sold ? soldTag() : tag(priceOf(run, it)));
      attachTip(b, () => [{ title: L(p.name), body: L(p.desc, p.vals ?? {}) }]);
      return b;
    });
    const rp = removePrice(run);
    const removal = h('button', {
      class: `shop-thing service${s.removeUsed ? ' sold' : ''}`, disabled: s.removeUsed,
      onClick: () => {
        if (run.gold < rp) { toast(t('shop.poor')); return; }
        openOverlay('deck', {
          title: t('shop.chooseRemove'), cards: run.deck, pickLabel: t('shop.remove'),
          onPick: (inst, close) => { if (removeCard(run, inst.uid)) { close(); refresh(); } else toast(t('shop.poor')); },
        });
      },
    }, icon('close'), h('span', { class: 'shop-name' }, t('shop.remove')), s.removeUsed ? soldTag() : tag(rp));
    attachTip(removal, () => [{ title: t('shop.remove'), body: t('shop.removeDesc') }]);

    fill(body,
      h('div', { class: 'shop-head' }, h('h2', {}, t('shop.title')), h('button', { class: 'btn primary', onClick: () => leave() }, t('shop.leave'))),
      cards,
      h('div', { class: 'shop-bottom' }, ...relics, ...potions, removal));
  }
  draw();
  return {};
}
