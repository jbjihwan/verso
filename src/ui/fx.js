// 연출 도우미: 대기(속도 배율 적용) · 떠오르는 글자 · 클래스 펄스 · 흔들림 · 파티클 캔버스.
import { h } from './dom.js';
import { app, motionScale } from './app.js';

export function wait(ms) {
  const d = Math.max(0, ms * motionScale());
  return d <= 0 ? Promise.resolve() : new Promise((r) => setTimeout(r, d));
}

export function floatText(layer, x, y, text, cls = '') {
  const el = h('div', { class: `float ${cls}`, style: { left: `${x}px`, top: `${y}px` } }, text);
  layer.append(el);
  const kill = () => el.remove();
  el.addEventListener('animationend', kill);
  setTimeout(kill, 2400);
  return el;
}

// 같은 클래스를 연달아 걸어도 애니메이션이 다시 시작되게
export function pulse(el, cls, ms = 400) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  clearTimeout(el[`_t_${cls}`]);
  el[`_t_${cls}`] = setTimeout(() => el.classList.remove(cls), ms * motionScale() + 60);
}

export function shake(el) {
  if (!app.settings.shake) return;
  pulse(el, 'shake', 380);
}

// ── 파티클 ─────────────────────────────────────────────────────────────
let canvas = null;
let ctx2d = null;
let parts = [];
let raf = 0;
const colorCache = new Map();

function tokenColor(name) {
  if (!colorCache.has(name)) {
    colorCache.set(name, getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#fff');
  }
  return colorCache.get(name);
}

export function bindCanvas(el, w, h2) {
  canvas = el;
  canvas.width = w;
  canvas.height = h2;
  ctx2d = canvas.getContext('2d');
  parts = [];
}

export function unbindCanvas() {
  cancelAnimationFrame(raf);
  raf = 0;
  canvas = null;
  ctx2d = null;
  parts = [];
}

const KINDS = {
  hit: { color: '--hp', n: 14, speed: 5, life: 520, size: 3 },
  block: { color: '--block', n: 10, speed: 3.5, life: 480, size: 2.5 },
  flip: { color: '--gold', n: 16, speed: 3, life: 700, size: 2.2 },
  vanish: { color: '--text-faint', n: 22, speed: 2.4, life: 900, size: 2.6 },
  heal: { color: '--venom', n: 12, speed: 2.5, life: 800, size: 2.4 },
  death: { color: '--text-dim', n: 30, speed: 3, life: 1000, size: 3 },
  gold: { color: '--gold', n: 18, speed: 4, life: 800, size: 2.6 },
};

export function burst(kind, x, y) {
  if (!ctx2d || motionScale() < 0.4) return;
  const k = KINDS[kind] ?? KINDS.hit;
  const color = tokenColor(k.color);
  for (let i = 0; i < k.n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = k.speed * (0.4 + Math.random() * 0.8);
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: k.life, max: k.life, size: k.size * (0.6 + Math.random() * 0.8), color });
  }
  if (!raf) raf = requestAnimationFrame(tick);
}

let last = 0;
function tick(ts) {
  if (!ctx2d) { raf = 0; return; }
  const dt = last ? Math.min(48, ts - last) : 16;
  last = ts;
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  parts = parts.filter((p) => (p.life -= dt) > 0);
  for (const p of parts) {
    p.x += p.vx * (dt / 16);
    p.y += p.vy * (dt / 16);
    p.vy += 0.06 * (dt / 16);
    p.vx *= 0.985;
    ctx2d.globalAlpha = Math.max(0, p.life / p.max);
    ctx2d.fillStyle = p.color;
    ctx2d.beginPath();
    ctx2d.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx2d.fill();
  }
  ctx2d.globalAlpha = 1;
  if (parts.length) raf = requestAnimationFrame(tick);
  else { raf = 0; last = 0; ctx2d.clearRect(0, 0, canvas.width, canvas.height); }
}
