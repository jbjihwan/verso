// 첫 전투에서 한 번만 보이는 짧은 안내
import { h } from '../dom.js';
import { t } from '../../core/i18n.js';
import { icon } from '../art/icons.js';

export function mount(root, _app, _props, close) {
  const items = [
    ['sword', t('tutorial.play')],
    ['flip', t('tutorial.flip')],
    ['eye', t('tutorial.intent')],
    ['hourglass', t('tutorial.end')],
  ];
  const ok = h('button', { class: 'btn primary', onClick: close }, t('tutorial.gotIt'));
  root.append(h('div', { class: 'panel tutorial', role: 'dialog', 'aria-modal': 'true' },
    h('h2', {}, t('tutorial.title')),
    h('ul', { class: 'tut-list' }, items.map(([ic, text]) => h('li', {}, h('span', { class: 'tut-ico' }, icon(ic)), h('span', {}, text)))),
    h('div', { class: 'panel-actions' }, ok)));
  setTimeout(() => ok.focus({ preventScroll: true }), 0);
  return {};
}
