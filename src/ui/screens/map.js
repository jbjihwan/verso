// 막 지도: 아래에서 위로 오르는 길. 지금 고를 수 있는 노드만 누를 수 있다.
import { h, svgEl } from '../dom.js';
import { app } from '../app.js';
import { stageInfo } from '../stage.js';
import { t, L } from '../../core/i18n.js';
import { selectableNodes } from '../../core/run.js';
import { encounterDef, enemyDef } from '../../core/content.js';
import { mountHud, actLabel } from '../hud.js';
import { icon } from '../art/icons.js';
import { attachTip } from '../tooltip.js';
import { goNode } from '../flow.js';

export const NODE_ICON = {
  combat: 'swords', elite: 'skull', event: 'question', shop: 'pouch', rest: 'candle', treasure: 'chest', boss: 'crown',
};

// 노드 id 로 정해지는 작은 흔들림(같은 맵은 늘 같은 모양)
function jitter(str, amp) {
  let x = 0;
  for (let i = 0; i < str.length; i++) x = (x * 31 + str.charCodeAt(i)) | 0;
  return ((x % 1000) / 1000) * amp;
}

function bossName(run) {
  const enc = run.bosses[run.act];
  return enc ? L(enemyDef(encounterDef(enc).enemies[0]).name) : '';
}

export function mount(root) {
  const run = app.run;
  root.classList.add(`act-${run.act}`);
  mountHud(root, app);
  const { w: W, portrait } = stageInfo();
  const top = portrait ? 108 : 52;
  const mapW = portrait ? W - 60 : Math.min(760, W - 400);
  const rowGap = portrait ? 150 : 104;
  const padTop = 120;
  const padBot = 70;
  const total = padTop + padBot + 8 * rowGap;
  const colGap = mapW / 6;
  const nodes = run.map.nodes;
  const posOf = (n) => (n.type === 'boss'
    ? { x: mapW / 2, y: padTop - 40 }
    : { x: colGap * (n.c + 0.5) + jitter(n.id, 14), y: padTop + (8 - n.r) * rowGap + jitter(`${n.id}#`, 12) });

  const can = new Set(selectableNodes(run));
  const visited = new Set(run.visited);
  const walked = new Set();
  for (let i = 1; i < run.visited.length; i++) walked.add(`${run.visited[i - 1]}>${run.visited[i]}`);

  const svg = svgEl('svg', { class: 'map-lines', width: String(mapW), height: String(total), viewBox: `0 0 ${mapW} ${total}` });
  for (const n of Object.values(nodes)) {
    for (const nid of n.next) {
      const a = posOf(n);
      const b = posOf(nodes[nid]);
      const cls = walked.has(`${n.id}>${nid}`) ? 'walked' : run.pos === n.id && can.has(nid) ? 'open' : '';
      svg.append(svgEl('line', { x1: String(a.x), y1: String(a.y), x2: String(b.x), y2: String(b.y), class: cls }));
    }
  }
  const inner = h('div', { class: 'map-inner', style: { width: `${mapW}px`, height: `${total}px` } }, svg);
  for (const n of Object.values(nodes)) {
    const p = posOf(n);
    const b = h('button', {
      class: `mnode t-${n.type}${can.has(n.id) ? ' can' : ''}${visited.has(n.id) ? ' done' : ''}${run.pos === n.id ? ' here' : ''}`,
      style: { left: `${p.x}px`, top: `${p.y}px` },
      disabled: !can.has(n.id),
      'aria-label': t(`node.${n.type}`),
      onClick: () => goNode(n.id),
    }, icon(NODE_ICON[n.type]));
    attachTip(b, () => [{ title: t(`node.${n.type}`), body: n.type === 'boss' ? bossName(run) : '' }]);
    inner.append(b);
  }

  const scroller = h('div', { class: 'map-scroll', style: { top: `${top}px` } }, inner);
  const head = h('div', { class: 'map-head' },
    h('h2', {}, `${actLabel(run.act)} · ${t(`acts.${run.act}`)}`),
    h('p', { class: 'dim' }, t('map.choose')));
  const legend = h('ul', { class: 'map-legend' },
    ['combat', 'elite', 'event', 'shop', 'rest', 'treasure', 'boss'].map((k) => h('li', { class: `t-${k}` }, icon(NODE_ICON[k]), t(`node.${k}`))));
  root.append(scroller, head, legend);

  // 지금 고를 노드가 화면 아래쪽 2/3 지점에 오게 스크롤
  const focusY = can.size ? Math.max(...[...can].map((id) => posOf(nodes[id]).y)) : total;
  scroller.scrollTop = Math.max(0, focusY - scroller.clientHeight * 0.7);
  return {};
}
