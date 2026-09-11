// 되돌릴 수 없는 행동에만 쓰는 확인 창.
// props: { title, body?, okLabel?, cancelLabel?, danger?, onOk }
import { h } from '../dom.js';
import { t } from '../../core/i18n.js';

export function mount(root, _app, props, close) {
  const cancel = h('button', { class: 'btn ghost', onClick: close }, props.cancelLabel ?? t('common.cancel'));
  const ok = h('button', {
    class: `btn ${props.danger ? 'danger' : 'primary'}`,
    onClick: () => { close(); props.onOk?.(); },
  }, props.okLabel ?? t('common.confirm'));
  root.append(h('div', { class: 'panel confirm', role: 'alertdialog', 'aria-modal': 'true' },
    h('h2', {}, props.title),
    props.body ? h('p', { class: 'dim' }, props.body) : null,
    h('div', { class: 'panel-actions' }, cancel, ok)));
  setTimeout(() => cancel.focus({ preventScroll: true }), 0);
  return {};
}
