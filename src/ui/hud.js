// 런 화면 공통 상단 바: 캐릭터 · 체력 · 골드 · 물약 · 유물 · 막/층 · 덱 · 설정
import { h } from './dom.js';
import { app, openOverlay } from './app.js';
import { t, L, getLang } from '../core/i18n.js';
import { CHARACTERS } from '../core/data/characters.js';
import { relicDef, potionDef } from '../core/content.js';
import { icon } from './art/icons.js';
import { glyph } from './art/glyphs.js';
import { attachTip } from './tooltip.js';
import * as fx from './fx.js';
import { markSeen } from '../core/meta.js';

const ROMAN = ['', 'I', 'II', 'III', 'IV'];
export const actLabel = (n) => t('top.act', { n: getLang() === 'ko' ? n : ROMAN[n] ?? n });

export function relicTip(id) {
  const r = relicDef(id);
  return [{ title: L(r.name), body: L(r.desc) }];
}

export function mountHud(root, _app, opts = {}) {
  const run = app.run;
  const c = CHARACTERS[run.char];
  const hpText = h('span', { class: 'num' });
  const goldText = h('span', { class: 'num' });
  const potions = h('div', { class: 'hud-potions' });
  const relics = h('div', { class: 'hud-relics' });
  const where = h('span', { class: 'hud-where' });
  const deckN = h('span', { class: 'num' });
  const deckBtn = h('button', {
    class: 'hud-btn', 'aria-label': t('top.deck'),
    onClick: () => openOverlay('deck', { title: t('deck.title'), cards: run.deck, run: null }),
  }, icon('deck'), deckN);
  const gear = h('button', { class: 'hud-btn icon-only', 'aria-label': t('title.settings'), onClick: () => openOverlay('settings') }, icon('gear'));
  const mapBtn = opts.map ? h('button', { class: 'hud-btn icon-only', 'aria-label': t('top.map'), onClick: opts.map }, icon('map')) : null;

  const el = h('header', { class: 'hud' },
    h('div', { class: 'hud-who' }, h('span', { class: 'hud-numeral' }, c.numeral), h('span', { class: 'hud-name' }, L(c.name))),
    h('div', { class: 'hud-stat hp' }, icon('heart'), hpText),
    h('div', { class: 'hud-stat gold' }, icon('coin'), goldText),
    potions, relics, h('div', { class: 'hud-spacer' }), where, mapBtn, deckBtn, gear);
  root.append(el);

  const relicEls = new Map();

  function update() {
    const cs = run.combat;
    setHp(cs ? cs.player.hp : run.hp, cs ? cs.player.maxHp : run.maxHp);
    goldText.textContent = String(run.gold);
    where.textContent = `${actLabel(run.act)} · ${t('top.floor', { n: run.floor })}`;
    deckN.textContent = String(run.deck.length);

    potions.replaceChildren();
    run.potions.forEach((id, slot) => {
      const b = h('button', {
        class: `pslot${id ? ' full' : ''}`,
        'aria-label': id ? L(potionDef(id).name) : t('top.emptySlot'),
        onClick: () => {
          if (!id) return;
          if (opts.onPotion) opts.onPotion(slot);
          else openOverlay('potion', { slot, onChange: update });
        },
      }, id ? glyph(potionDef(id).art ?? 'drop', 'pglyph') : null);
      if (id) attachTip(b, () => [{ title: L(potionDef(id).name), body: L(potionDef(id).desc, potionDef(id).vals ?? {}) }]);
      potions.append(b);
    });

    relics.replaceChildren();
    relicEls.clear();
    for (const id of run.relics) {
      const r = relicDef(id);
      markSeen(app.meta, 'relics', id);
      const counter = run.rs?.[id]?.counter;
      const b = h('button', { class: 'relic', 'aria-label': L(r.name) }, glyph(r.art ?? 'star', 'rglyph'),
        counter != null ? h('b', { class: 'num relic-n' }, String(counter)) : null);
      attachTip(b, () => relicTip(id));
      relics.append(b);
      relicEls.set(id, b);
    }
  }

  function setHp(hp, max) {
    const cur = hpText.textContent.split('/');
    hpText.textContent = `${Math.max(0, hp)}/${max ?? cur[1]}`;
  }

  update();
  return {
    el,
    update,
    setHp,
    flashRelic(id) { fx.pulse(relicEls.get(id), 'flash', 700); },
  };
}
