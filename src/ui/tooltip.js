// 툴팁: 마우스는 짧은 호버, 터치는 길게 누르기, 키보드는 포커스 즉시.
// 내용: [{ title, body }] 배열. 스테이지 좌표로 배치해 화면 밖으로 나가지 않게 한다.
import { h, clear } from './dom.js';
import { stageRect, stageInfo } from './stage.js';

let tipEl = null;
let owner = null;

export function initTips(stage) {
  tipEl = h('div', { class: 'tip', role: 'tooltip' });
  stage.append(tipEl);
}

export function showTip(anchor, items) {
  if (!tipEl || !items?.length) return;
  owner = anchor;
  clear(tipEl);
  for (const it of items) {
    if (it.title) tipEl.append(h('h4', {}, it.title));
    if (it.body) tipEl.append(h('p', {}, it.body));
  }
  tipEl.classList.add('on');
  const r = stageRect(anchor);
  const { w: W, h: H } = stageInfo();
  const tw = tipEl.offsetWidth;
  const th = tipEl.offsetHeight;
  let x = r.cx - tw / 2;
  let y = r.y - th - 10;
  if (y < 8) y = r.y + r.h + 10;
  x = Math.max(8, Math.min(W - tw - 8, x));
  y = Math.max(8, Math.min(H - th - 8, y));
  tipEl.style.left = `${x}px`;
  tipEl.style.top = `${y}px`;
}

export function hideTip(anchor) {
  if (!tipEl || (anchor && anchor !== owner)) return;
  tipEl.classList.remove('on');
  owner = null;
}

export function attachTip(el, itemsFn) {
  let timer = null;
  const open = () => showTip(el, itemsFn());
  el.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(timer);
    timer = setTimeout(open, 300);
  });
  el.addEventListener('pointerleave', () => { clearTimeout(timer); hideTip(el); });
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    clearTimeout(timer);
    timer = setTimeout(open, 380);
  });
  el.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse') return;
    clearTimeout(timer);
    setTimeout(() => hideTip(el), 1400);
  });
  el.addEventListener('pointercancel', () => { clearTimeout(timer); hideTip(el); });
  el.addEventListener('focus', open);
  el.addEventListener('blur', () => hideTip(el));
}
