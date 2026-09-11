// 이벤트: 본문 → 선택지 → (카드 고르기) → 결과 → 계속/싸움
import { h, fill } from '../dom.js';
import { app, persist, openOverlay } from '../app.js';
import { t, L } from '../../core/i18n.js';
import { eventChoices, chooseEvent, selectableFor, resolveSelect } from '../../core/run.js';
import { eventDef } from '../../core/content.js';
import { mountHud } from '../hud.js';
import { glyph } from '../art/glyphs.js';
import { leave, eventFight } from '../flow.js';

export function mount(root) {
  const run = app.run;
  root.classList.add(`act-${run.act}`);
  if (!run.event) { setTimeout(leave, 0); return {}; }
  const hud = mountHud(root, app);
  const box = h('div', { class: 'room-panel event' });
  root.append(box);

  function draw() {
    const st = run.event;
    if (!st) return;
    const def = eventDef(st.id);
    const header = [h('div', { class: 'room-art' }, glyph(def.art ?? 'eye', 'room-glyph')), h('h2', {}, L(def.title))];
    if (st.page === 'start') {
      fill(box, ...header,
        h('p', { class: 'ev-body' }, L(def.body)),
        h('div', { class: 'ev-choices' }, eventChoices(run).map((c, i) => h('button', {
          class: 'ev-choice', disabled: !!c.disabled, onClick: () => pick(i),
        }, h('span', { class: 'ev-label' }, L(c.label)), c.hint ? h('span', { class: 'ev-hint dim' }, L(c.hint)) : null))));
    } else {
      fill(box, ...header,
        st.result ? h('p', { class: 'ev-body' }, L(st.result)) : null,
        h('div', { class: 'room-actions' }, st.fight
          ? h('button', { class: 'btn danger', onClick: () => eventFight() }, t('event.fight'))
          : h('button', { class: 'btn primary', onClick: () => leave() }, t('event.continue'))));
    }
  }

  function pick(i) {
    const res = chooseEvent(run, i);
    if (!res) return;
    persist();
    hud.update();
    if (res.select) { openSelect(); return; }
    draw();
  }

  function openSelect() {
    const spec = run.pendingSelect;
    const cards = selectableFor(run);
    if (!cards.length) { resolveSelect(run, []); persist(); draw(); return; }
    openOverlay('deck', {
      title: t(`select.${spec.action}`), cards, preview: spec.action === 'upgrade' ? 'upgrade' : null,
      pickLabel: t('common.choose'), dismissable: false,
      onPick: (inst, close) => { close(); resolveSelect(run, [inst.uid]); persist(); hud.update(); draw(); },
    });
  }

  draw();
  if (run.pendingSelect) openSelect();
  return {};
}
