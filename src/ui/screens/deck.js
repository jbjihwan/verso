// 카드 목록 오버레이: 덱 보기 · 더미 보기 · 카드 고르기(onPick)
// props: { title, cards, run?, onPick?(inst, close), pickLabel?, preview?: 'upgrade', hint?, dismissable? }
import { h } from '../dom.js';
import { openOverlay } from '../app.js';
import { t } from '../../core/i18n.js';
import { cardEl } from '../cardview.js';
import { bindCardChoice } from '../cardtap.js';
import { icon } from '../art/icons.js';

export function mount(root, _app, props, close) {
  const cards = props.cards ?? [];
  const grid = h('div', { class: 'card-grid' });
  for (const inst of cards) {
    const shown = props.preview === 'upgrade' ? { ...inst, up: 1 } : inst;
    const el = cardEl(shown, { run: null, opt: !!props.onPick });
    if (props.onPick) {
      bindCardChoice(el, shown, { label: props.pickLabel ?? t('common.choose'), onChoose: () => props.onPick(inst, close) });
    } else {
      el.tabIndex = 0;
      el.addEventListener('click', () => openOverlay('inspect', { inst, run: null }));
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') openOverlay('inspect', { inst, run: null }); });
    }
    grid.append(el);
  }
  const canClose = props.dismissable !== false;
  root.append(h('div', { class: 'panel wide deckview', role: 'dialog', 'aria-modal': 'true' },
    h('div', { class: 'panel-head' },
      h('h2', {}, props.title, ' ', h('span', { class: 'dim num count' }, t('deck.count', { n: cards.length }))),
      canClose ? h('button', { class: 'btn icon ghost', 'aria-label': t('common.close'), onClick: close }, icon('close')) : null),
    props.hint ? h('p', { class: 'dim hint' }, props.hint) : null,
    cards.length ? grid : h('p', { class: 'dim' }, t('deck.empty'))));
  return {};
}
