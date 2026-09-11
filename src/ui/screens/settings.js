// 설정 오버레이
import { h } from '../dom.js';
import { app, updateSettings, openOverlay, goMenu, abandonRun, resetProgress } from '../app.js';
import { t, getLang } from '../../core/i18n.js';
import { icon } from '../art/icons.js';

function row(label, control) {
  return h('div', { class: 'row' }, h('span', { class: 'row-label' }, label), control);
}

function toggle(key) {
  const b = h('button', {
    class: 'toggle', role: 'switch', 'aria-checked': String(!!app.settings[key]),
    onClick: () => {
      updateSettings({ [key]: !app.settings[key] });
      b.setAttribute('aria-checked', String(!!app.settings[key]));
    },
  });
  return b;
}

function slider(key) {
  return h('input', {
    class: 'slider', type: 'range', min: '0', max: '1', step: '0.05', value: String(app.settings[key]),
    onInput: (e) => updateSettings({ [key]: Number(e.target.value) }),
  });
}

export function mount(root, _app, _props, close) {
  const inRun = !!app.run && !app.menu;
  const lang = h('div', { class: 'seg', role: 'group' },
    ['ko', 'en'].map((l) => h('button', {
      'aria-pressed': String(getLang() === l),
      onClick: () => updateSettings({ lang: l }),
    }, l === 'ko' ? '한국어' : 'English')));

  const closeBtn = h('button', { class: 'btn icon ghost', 'aria-label': t('common.close'), onClick: close }, icon('close'));

  const actions = h('div', { class: 'panel-actions wrap' },
    inRun ? h('button', { class: 'btn', onClick: () => goMenu('title') }, t('settings.mainMenu')) : null,
    inRun ? h('button', {
      class: 'btn danger',
      onClick: () => openOverlay('confirm', {
        title: t('settings.abandonTitle'), body: t('settings.abandonBody'),
        okLabel: t('settings.abandonOk'), danger: true,
        onOk: () => { close(); abandonRun(); },
      }),
    }, t('settings.abandon')) : null,
    !inRun ? h('button', {
      class: 'btn danger ghost',
      onClick: () => openOverlay('confirm', {
        title: t('settings.resetTitle'), body: t('settings.resetBody'),
        okLabel: t('settings.resetOk'), danger: true,
        onOk: () => resetProgress(),
      }),
    }, t('settings.reset')) : null);

  const panel = h('div', { class: 'panel settings', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'settings-h' },
    h('div', { class: 'panel-head' }, h('h2', { id: 'settings-h' }, t('settings.title')), closeBtn),
    row(t('settings.lang'), lang),
    row(t('settings.sfx'), slider('sfx')),
    row(t('settings.music'), slider('music')),
    row(t('settings.fast'), toggle('fast')),
    row(t('settings.shake'), toggle('shake')),
    actions);
  root.append(panel);
  setTimeout(() => closeBtn.focus({ preventScroll: true }), 0);
  return {};
}
