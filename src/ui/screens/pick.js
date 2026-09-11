// 카드 고르기 오버레이(전투 중 버린 더미·뽑을 더미·발견 선택). 닫을 수 없다(dismissable:false).
// props: { title, cards, count, min, run?, onPick(uids) }
import { h } from '../dom.js';
import { t } from '../../core/i18n.js';
import { cardEl } from '../cardview.js';

export function mount(root, _app, props, close) {
  const sel = new Set();
  const single = props.count === 1;
  const confirm = h('button', {
    class: 'btn primary', disabled: sel.size < props.min,
    onClick: () => { close(); props.onPick([...sel]); },
  }, t('combat.confirmPick'));
  const grid = h('div', { class: 'card-grid' });
  for (const inst of props.cards) {
    const el = cardEl(inst, { run: props.run, opt: true });
    el.tabIndex = 0;
    const act = () => {
      if (single) { close(); props.onPick([inst.uid]); return; }
      if (sel.has(inst.uid)) sel.delete(inst.uid);
      else if (sel.size < props.count) sel.add(inst.uid);
      el.classList.toggle('picked', sel.has(inst.uid));
      confirm.disabled = sel.size < props.min;
    };
    el.addEventListener('click', act);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
    grid.append(el);
  }
  const skip = props.min === 0
    ? h('button', { class: 'btn ghost', onClick: () => { close(); props.onPick([]); } }, t('common.skip'))
    : null;
  root.append(h('div', { class: 'panel wide', role: 'dialog', 'aria-modal': 'true' },
    h('div', { class: 'panel-head' }, h('h2', {}, props.title)),
    grid,
    h('div', { class: 'panel-actions' }, skip, single ? null : confirm)));
  return {};
}
