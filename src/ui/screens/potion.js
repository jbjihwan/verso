// 물약 창: 설명 + 버리기 + (전투 중 쓸 수 있을 때) 사용
// props: { slot, onUse?(slot), onChange?() }
import { h } from '../dom.js';
import { app, persist } from '../app.js';
import { t, L } from '../../core/i18n.js';
import { potionDef } from '../../core/content.js';
import { discardPotion } from '../../core/run.js';
import { glyph } from '../art/glyphs.js';

export function mount(root, _app, props, close) {
  const run = app.run;
  const id = run?.potions[props.slot];
  if (!id) { close(); return {}; }
  const p = potionDef(id);
  const use = props.onUse
    ? h('button', { class: 'btn primary', onClick: () => { close(); props.onUse(props.slot); } }, t('top.use'))
    : null;
  root.append(h('div', { class: 'panel potion-panel', role: 'dialog', 'aria-modal': 'true' },
    glyph(p.art ?? 'drop', 'rglyph huge'),
    h('h2', {}, L(p.name)),
    h('p', { class: 'dim' }, L(p.desc, p.vals ?? {})),
    h('div', { class: 'panel-actions' },
      h('button', {
        class: 'btn ghost',
        onClick: () => { discardPotion(run, props.slot); persist(); close(); props.onChange?.(); },
      }, t('top.drop')),
      use)));
  setTimeout(() => (use ?? root.querySelector('button'))?.focus({ preventScroll: true }), 0);
  return {};
}
