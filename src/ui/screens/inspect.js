// 카드 확대 보기: 실제 카드 + 두 면을 똑바로 세운 패널 + 키워드 설명.
// props: { inst, run?, action?: { label, onClick } } — 아무 곳이나 누르면 닫힌다(확정 버튼 제외).
import { h } from '../dom.js';
import { t } from '../../core/i18n.js';
import { cardDef } from '../../core/cards.js';
import { cardEl, facePanel, cardTips } from '../cardview.js';

export function mount(root, _app, props, close) {
  const inst = props.inst;
  if (!inst) { close(); return {}; }
  const d = cardDef(inst.id);
  const big = cardEl(inst, { run: props.run });
  big.classList.add('big');
  const tips = cardTips(inst);
  const action = props.action
    ? h('button', {
      class: 'btn primary insp-action',
      onClick: (e) => { e.stopPropagation(); close(); props.action.onClick(); },
    }, props.action.label)
    : null;
  root.append(h('div', { class: 'inspect', role: 'dialog', 'aria-modal': 'true', onClick: close },
    h('div', { class: 'insp-row' },
      big,
      h('div', { class: 'insp-side' },
        facePanel(inst, 0, { active: !inst.rev, run: props.run }),
        facePanel(inst, 1, { active: !!inst.rev, run: props.run }),
        h('div', { class: 'insp-meta faint' }, t(`card.${d.rarity}`)),
        action)),
    tips.length ? h('div', { class: 'insp-tips' }, tips.map((x) => h('p', {}, h('b', {}, x.title), ' — ', x.body))) : null));
  setTimeout(() => action?.focus({ preventScroll: true }), 0);
  return {};
}
