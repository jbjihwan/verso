// 런 결과: 기록 · 얻은 통찰 · 레벨업/해금 알림
import { h } from '../dom.js';
import { app } from '../app.js';
import { t, L } from '../../core/i18n.js';
import { levelProgress } from '../../core/meta.js';
import { cardDef } from '../../core/cards.js';
import { relicDef } from '../../core/content.js';
import { stat } from '../room.js';
import { closeRun } from '../flow.js';

export function mount(root) {
  const res = app.run?.result;
  if (!res) { setTimeout(() => closeRun(false), 0); return {}; }
  const m = res.meta;
  const lp = levelProgress(app.meta.insight);
  const notes = [];
  if (m && m.levelAfter > m.levelBefore) notes.push(h('li', {}, t('result.levelUp', { n: m.levelAfter })));
  for (const u of m?.unlocks ?? []) {
    const names = u.ids.map((id) => (u.kind === 'card' ? L(cardDef(id).faces[0].name) : L(relicDef(id).name)));
    if (names.length) notes.push(h('li', {}, `${t('result.unlocked')}: ${names.join(', ')}`));
  }
  if (m?.charUnlocked) notes.push(h('li', {}, t('result.charUnlocked')));
  if (m?.newOmen) notes.push(h('li', {}, t('result.omenUnlocked', { n: m.newOmen })));

  root.append(h('div', { class: `result ${res.won ? 'won' : 'lost'}` },
    h('h1', {}, res.won ? t('result.win') : t('result.lose')),
    h('dl', { class: 'res-stats num' },
      stat(t('result.floor'), res.floor), stat(t('result.elites'), res.elites),
      stat(t('result.bosses'), res.bosses), stat(t('result.kills'), res.kills)),
    h('div', { class: 'res-insight' },
      h('div', { class: 'title-meta-row' },
        h('span', { class: 'lv' }, t('title.level', { level: lp.level })),
        h('span', { class: 'num' }, `${t('result.insight')} +${m?.gained ?? 0}`)),
      h('div', { class: 'bar' }, h('i', { style: { transform: `scaleX(${lp.frac})` } }))),
    notes.length ? h('ul', { class: 'res-notes' }, notes) : null,
    h('div', { class: 'room-actions' },
      h('button', { class: 'btn ghost', onClick: () => closeRun(false) }, t('result.toTitle')),
      h('button', { class: 'btn primary', onClick: () => closeRun(true) }, t('result.again')))));
  return {};
}
