// 도감: 캐릭터별 카드 · 공용(기본·무색·저주) · 유물.
// 본 적 없는 카드는 뒷면으로, 아직 잠긴 것은 필요한 아르카나 레벨을 보여 준다.
import { h, fill } from '../dom.js';
import { app, goMenu, openOverlay } from '../app.js';
import { t, L } from '../../core/i18n.js';
import { allCards } from '../../core/cards.js';
import { allRelics } from '../../core/content.js';
import { isUnlocked, unlockLevelOf } from '../../core/meta.js';
import { cardEl, cardBack } from '../cardview.js';
import { glyph } from '../art/glyphs.js';
import { icon } from '../art/icons.js';

const RANK = { basic: 0, common: 1, uncommon: 2, rare: 3, special: 4, starter: 0, boss: 4, shop: 5 };
const TABS = [
  ['fool', ['fool']],
  ['magician', ['magician']],
  ['neutral', ['basic', 'neutral', 'curse']],
  ['relics', null],
];

export function mount(root) {
  let tab = 'fool';
  const tabs = h('div', { class: 'seg cp-tabs', role: 'tablist' });
  const count = h('span', { class: 'dim num cp-count' });
  const body = h('div', { class: 'cp-body' });
  root.append(
    h('button', { class: 'btn ghost cs-back', onClick: () => goMenu('title') }, icon('back'), t('common.back')),
    h('div', { class: 'cp-head' }, h('h1', {}, t('compendium.title')), tabs, count),
    body);

  const byName = (a, b) => (RANK[a.rarity] ?? 9) - (RANK[b.rarity] ?? 9) || L(a.name ?? a.faces[0].name).localeCompare(L(b.name ?? b.faces[0].name));

  function draw() {
    fill(tabs, ...TABS.map(([k]) => h('button', {
      role: 'tab', 'aria-pressed': String(tab === k), onClick: () => { tab = k; draw(); },
    }, t(`compendium.${k}`))));
    const seen = app.meta.seen ?? {};

    if (tab === 'relics') {
      const list = allRelics().sort(byName);
      let n = 0;
      const grid = h('div', { class: 'cp-relics' });
      for (const r of list) {
        const known = !!seen.relics?.[r.id];
        if (known) n++;
        const open = isUnlocked(app.meta, 'relic', r);
        grid.append(h('div', { class: `cp-relic${known ? '' : ' unknown'}` },
          glyph(r.art ?? 'star', 'rglyph big'),
          h('b', {}, known ? L(r.name) : t('common.unknown')),
          h('span', { class: 'dim' }, known ? L(r.desc) : open ? t('compendium.sealed') : t('compendium.lockedAt', { n: unlockLevelOf('relic', r) }))));
      }
      count.textContent = t('compendium.found', { n, m: list.length });
      fill(body, grid);
      return;
    }

    const pools = TABS.find(([k]) => k === tab)[1];
    const list = allCards().filter((d) => pools.includes(d.pool) && !d.id.startsWith('t_')).sort(byName);
    let n = 0;
    const grid = h('div', { class: 'card-grid' });
    for (const d of list) {
      const known = !!seen.cards?.[d.id];
      if (known) {
        n++;
        const inst = { uid: `cp-${d.id}`, id: d.id, up: 0, rev: false };
        const el = cardEl(inst);
        el.tabIndex = 0;
        el.addEventListener('click', () => openOverlay('inspect', { inst, run: null }));
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter') openOverlay('inspect', { inst, run: null }); });
        grid.append(el);
      } else {
        const open = isUnlocked(app.meta, 'card', d);
        grid.append(cardBack(open ? t('common.unknown') : t('compendium.lockedAt', { n: unlockLevelOf('card', d) })));
      }
    }
    count.textContent = t('compendium.found', { n, m: list.length });
    fill(body, grid);
  }

  draw();
  return {};
}
