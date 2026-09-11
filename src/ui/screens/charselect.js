// 캐릭터 선택 + 징조 선택
import { h, fill } from '../dom.js';
import { app, goMenu } from '../app.js';
import { t, L } from '../../core/i18n.js';
import { CHARACTERS, CHAR_ORDER } from '../../core/data/characters.js';
import { isCharUnlocked } from '../../core/meta.js';
import { relicDef } from '../../core/content.js';
import { cardDef } from '../../core/cards.js';
import { heroArt } from '../art/portraits.js';
import { glyph } from '../art/glyphs.js';
import { icon } from '../art/icons.js';
import { beginRun } from '../flow.js';

function deckSummary(ids) {
  const counts = new Map();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts].map(([id, n]) => `${L(cardDef(id).faces[0].name)}${n > 1 ? ` ×${n}` : ''}`).join(' · ');
}

export function mount(root) {
  const want = app.menuArg?.char;
  let sel = want && isCharUnlocked(app.meta, want) ? want : 'fool';
  let omen = app.meta.omen[sel] ?? 0;
  const chars = h('div', { class: 'cs-chars' });
  const detail = h('div', { class: 'cs-detail' });
  root.append(
    h('button', { class: 'btn ghost cs-back', onClick: () => goMenu('title') }, icon('back'), t('common.back')),
    h('h1', { class: 'cs-title' }, t('charselect.title')),
    h('div', { class: 'cs-body' }, chars, detail));

  function panel(id) {
    const c = CHARACTERS[id];
    const open = isCharUnlocked(app.meta, id);
    return h('button', {
      class: `cs-char${sel === id ? ' on' : ''}${open ? '' : ' locked'}`,
      'aria-pressed': String(sel === id), disabled: !open,
      onClick: () => { sel = id; omen = app.meta.omen[id] ?? 0; draw(); },
    },
    h('div', { class: 'cs-art' }, heroArt(id)),
    h('div', { class: 'cs-num' }, c.numeral),
    h('div', { class: 'cs-name' }, open ? L(c.name) : t('charselect.locked')),
    open ? null : h('div', { class: 'cs-hint' }, t('charselect.unlockHint')));
  }

  function drawDetail() {
    const c = CHARACTERS[sel];
    const r = relicDef(c.relic);
    const st = app.meta.stats[sel] ?? { runs: 0, wins: 0, best: 0 };
    const maxOmen = app.meta.omen[sel] ?? 0;
    const omens = t('charselect.omens');
    const omenDesc = omen ? omens.slice(1, omen + 1).join(' ') : omens[0];
    fill(detail,
      h('h2', {}, L(c.name)),
      h('p', { class: 'dim cs-blurb' }, L(c.blurb)),
      h('ul', { class: 'cs-facts' },
        h('li', {}, icon('heart'), h('span', {}, t('charselect.hp', { n: c.hp }))),
        h('li', {}, glyph(r.art ?? 'star', 'rglyph'), h('span', {}, h('b', {}, L(r.name)), ' — ', L(r.desc))),
        h('li', {}, icon('deck'), h('span', {}, deckSummary(c.deck)))),
      st.runs ? h('p', { class: 'faint num' }, t('charselect.stats', st)) : null,
      maxOmen > 0
        ? h('div', { class: 'cs-omen' },
          h('div', { class: 'row-label' }, t('charselect.omen')),
          h('div', { class: 'seg' }, Array.from({ length: maxOmen + 1 }, (_, i) => h('button', {
            'aria-pressed': String(omen === i), onClick: () => { omen = i; drawDetail(); },
          }, i === 0 ? t('charselect.omenNone') : String(i)))),
          h('p', { class: 'dim' }, omenDesc))
        : null,
      h('button', { class: 'btn primary cs-start', onClick: () => beginRun(sel, omen) }, t('charselect.start')));
  }

  function draw() {
    chars.replaceChildren(...CHAR_ORDER.map(panel));
    drawDetail();
  }
  draw();
  return {};
}
