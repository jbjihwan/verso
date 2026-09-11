// 성소: 휴식(회복) 또는 정련(카드 1장 강화)
import { h, fill } from '../dom.js';
import { app, persist, openOverlay } from '../app.js';
import { t } from '../../core/i18n.js';
import { rest, refine, restHealAmount } from '../../core/run.js';
import { canUpgrade } from '../../core/cards.js';
import { relicSum } from '../../core/effects.js';
import { mountHud } from '../hud.js';
import { glyph } from '../art/glyphs.js';
import { icon } from '../art/icons.js';
import { choice } from '../room.js';
import { leave } from '../flow.js';

export function mount(root) {
  const run = app.run;
  root.classList.add(`act-${run.act}`);
  if (!run.rest) { setTimeout(leave, 0); return {}; }
  const hud = mountHud(root, app);
  const box = h('div', { class: 'room-panel rest' });
  root.append(box);

  function draw() {
    const done = run.rest?.done;
    const up = run.deck.filter(canUpgrade);
    fill(box,
      h('div', { class: 'room-art' }, glyph('lantern', 'room-glyph')),
      h('h2', {}, t('rest.title')),
      done
        ? h('p', { class: 'dim' }, t('rest.done'))
        : h('div', { class: 'choices' },
          choice(icon('candle'), t('rest.rest'), t('rest.restDesc', { n: restHealAmount(run) }),
            () => { rest(run); persist(); hud.update(); draw(); }, relicSum(run, 'noRest') > 0),
          choice(icon('star4'), t('rest.refine'), up.length ? t('rest.refineDesc') : t('rest.nothing'),
            () => openOverlay('deck', {
              title: t('rest.chooseRefine'), cards: up, preview: 'upgrade', pickLabel: t('rest.refine'),
              onPick: (inst, close) => { close(); refine(run, inst.uid); persist(); hud.update(); draw(); },
            }), !up.length)),
      done ? h('div', { class: 'room-actions' }, h('button', { class: 'btn primary', onClick: () => leave() }, t('common.continue'))) : null);
  }
  draw();
  return {};
}
