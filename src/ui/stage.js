// 고정 크기 논리 스테이지를 화면에 맞춘다. 짧은 변 고정, 긴 변 가변(스펙 11.1).
// 모든 화면은 스테이지 좌표(px)로 설계하고, 확대/축소는 transform 한 번으로 끝낸다.

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 검증용: ?layout=portrait|landscape 로 방향을 강제한다(창 크기를 못 바꾸는 환경에서 세로 화면 확인)
const FORCED = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('layout') : null;

let stageEl = null;
let info = { w: 1280, h: 720, scale: 1, ox: 0, oy: 0, portrait: false };
const listeners = new Set();

export function initStage(el) {
  stageEl = el;
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 120));
  window.visualViewport?.addEventListener('resize', fit);
}

export function fit() {
  if (!stageEl) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const aspect = vw / Math.max(1, vh);
  let portrait = aspect < 0.9;
  if (FORCED === 'portrait') portrait = true;
  else if (FORCED === 'landscape') portrait = false;
  let w, h;
  if (portrait) {
    // 세로(휴대폰)는 너비 560 — 390px 폭 화면에서 약 0.7배로 그려져 카드 글씨를 읽을 수 있다
    const a = FORCED === 'portrait' ? Math.min(aspect, 0.5) : aspect;
    w = 560; h = Math.round(clamp(560 / a, 860, 1240));
  }
  else { h = 720; w = Math.round(clamp(aspect * 720, 1024, 1560)); }
  const scale = Math.min(vw / w, vh / h);
  const ox = (vw - w * scale) / 2;
  const oy = (vh - h * scale) / 2;

  const changed = portrait !== info.portrait || w !== info.w || h !== info.h;
  info = { w, h, scale, ox, oy, portrait };

  stageEl.style.width = `${w}px`;
  stageEl.style.height = `${h}px`;
  stageEl.style.transform = `translate(${ox}px, ${oy}px) scale(${scale})`;
  stageEl.style.setProperty('--sw', `${w}px`);
  stageEl.style.setProperty('--sh', `${h}px`);
  stageEl.classList.toggle('portrait', portrait);
  stageEl.classList.toggle('landscape', !portrait);
  document.documentElement.style.setProperty('--scale', String(scale));

  if (changed) for (const fn of listeners) fn(info);
}

export function stageInfo() { return info; }

// 화면(client) 좌표 → 스테이지 좌표
export function toStage(clientX, clientY) {
  return { x: (clientX - info.ox) / info.scale, y: (clientY - info.oy) / info.scale };
}

// 요소의 스테이지 좌표 사각형
export function stageRect(el) {
  const r = el.getBoundingClientRect();
  const a = toStage(r.left, r.top);
  return { x: a.x, y: a.y, w: r.width / info.scale, h: r.height / info.scale,
    cx: a.x + r.width / info.scale / 2, cy: a.y + r.height / info.scale / 2 };
}

export function onStageChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
