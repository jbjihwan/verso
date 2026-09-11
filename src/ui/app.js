// 앱 상태 · 화면 전환 · 오버레이 · 저장 · 설정 · 토스트.
// 화면/오버레이 모듈은 main.js 가 registerScreens/registerOverlays 로 등록한다(순환 import 방지).
// 화면 모듈 계약: mount(root, app) → { unmount?(), onKey?(e) }
// 오버레이 계약: mount(root, app, props, close) → { unmount?(), onKey?(e) → true 면 처리됨 }
import { h, clear } from './dom.js';
import { initStage, onStageChange } from './stage.js';
import { makeStore, loadAll, saveRun, saveMeta, saveSettings, KEYS } from '../core/save.js';
import { detectLang, setLang, getLang, t } from '../core/i18n.js';
import { defaultMeta } from '../core/meta.js';

export const app = {
  stage: null,
  store: null,
  settings: null,
  meta: null,
  run: null,
  menu: 'title',   // 런 밖 메뉴 화면 이름. null 이면 run.screen 을 그린다
  debug: false,
};

const screens = {};
const overlays = {};
const layers = {};
const overlayStack = [];      // [{ name, props, root, handle }]
const settingsListeners = new Set();
let current = null;           // { name, handle }
let saveQueued = false;
let validateRun = (r) => !!r && r.v === 1;

export function registerScreens(map) { Object.assign(screens, map); }
export function registerOverlays(map) { Object.assign(overlays, map); }
export function setRunValidator(fn) { validateRun = fn; }

export function defaultSettings() {
  return { lang: detectLang(globalThis.navigator?.language), sfx: 0.7, music: 0.45, fast: false, shake: true };
}

export function startApp(stage) {
  app.stage = stage;
  const q = new URLSearchParams(location.search);
  app.debug = q.has('debug');
  app.instant = q.has('instant');
  const storage = probeStorage();
  app.store = makeStore(storage);
  const loaded = loadAll(app.store, { defaultSettings: defaultSettings(), defaultMeta: defaultMeta(), validateRun });
  app.settings = loaded.settings;
  app.meta = loaded.meta;
  app.run = loaded.run;
  applySettings();

  layers.screen = h('div', { class: 'layer-screen' });
  layers.overlay = h('div', { class: 'layer-overlay' });
  layers.toast = h('div', { class: 'layer-toast', 'aria-live': 'polite' });
  stage.append(layers.screen, layers.overlay, layers.toast);

  initStage(stage);
  onStageChange(() => { render(); remountOverlays(); });
  window.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  window.addEventListener('pagehide', flush);

  render();
  for (const n of loaded.notices) toast(t(`notice.${n}`), 'warn');
  if (!storage) toast(t('notice.nostorage'), 'warn');
}

// ── 화면 ────────────────────────────────────────────────────────────
export function currentScreenName() {
  return app.menu ?? app.run?.screen ?? 'title';
}

export function render() {
  const name = currentScreenName();
  if (current) {
    try { current.handle.unmount?.(); } catch (e) { console.error(e); }
  }
  clear(layers.screen);
  const mod = screens[name] ?? screens.title;
  const root = h('div', { class: `screen screen-${name}` });
  layers.screen.append(root);
  current = { name, handle: mod.mount(root, app) ?? {} };
}

export function goMenu(name, arg = null) {
  closeAllOverlays();
  app.menu = name;
  app.menuArg = arg;
  render();
}

export function enterRun() {
  closeAllOverlays();
  app.menu = null;
  render();
}

// 런 안에서 화면 이동(보상 → 맵 등). 상태를 저장하고 다시 그린다.
export function setScreen(name) {
  if (!app.run) return;
  app.run.screen = name;
  persist();
  closeAllOverlays();
  app.menu = null;
  render();
}

// 런 포기: Task 4 에서 결과 화면으로 연결한다.
let abandonHandler = null;
export function setAbandonHandler(fn) { abandonHandler = fn; }
export function abandonRun(opts = {}) {
  if (abandonHandler) return abandonHandler(opts);
  app.run = null;
  persist();
  if (!opts.silent) goMenu('title');
}

// ── 오버레이 ─────────────────────────────────────────────────────────
export function openOverlay(name, props = {}) {
  if (!overlays[name]) { console.warn('unknown overlay', name); return; }
  const entry = { name, props };
  overlayStack.push(entry);
  mountOverlay(entry);
}

function mountOverlay(entry) {
  const root = h('div', { class: `overlay overlay-${entry.name}` });
  root.addEventListener('pointerdown', (e) => {
    if (e.target === root && entry.props.dismissable !== false) closeOverlay(entry);
  });
  layers.overlay.append(root);
  layers.overlay.classList.add('on');
  entry.root = root;
  entry.handle = overlays[entry.name].mount(root, app, entry.props, () => closeOverlay(entry)) ?? {};
}

export function closeOverlay(entry = overlayStack[overlayStack.length - 1]) {
  if (!entry) return;
  const i = overlayStack.indexOf(entry);
  if (i < 0) return;
  overlayStack.splice(i, 1);
  try { entry.handle?.unmount?.(); } catch (e) { console.error(e); }
  entry.root?.remove();
  if (!overlayStack.length) layers.overlay.classList.remove('on');
  entry.props.onClose?.();
}

export function closeAllOverlays() {
  while (overlayStack.length) closeOverlay();
}

export function hasOverlay() { return overlayStack.length > 0; }

function remountOverlays() {
  for (const e of overlayStack) {
    try { e.handle?.unmount?.(); } catch (err) { console.error(err); }
    e.root?.remove();
    mountOverlay(e);
  }
}

function onKey(e) {
  const top = overlayStack[overlayStack.length - 1];
  if (top) {
    if (top.handle.onKey?.(e)) return;
    if (e.key === 'Escape' && top.props.dismissable !== false) {
      e.preventDefault();
      closeOverlay(top);
    }
    return;
  }
  current?.handle.onKey?.(e);
}

// ── 저장 ─────────────────────────────────────────────────────────────
// 여러 상태 변경이 한 틱에 몰려도 저장은 한 번만.
export function persist() {
  if (saveQueued) return;
  saveQueued = true;
  setTimeout(flush, 0);
}

export function flush() {
  saveQueued = false;
  if (!app.store) return;
  saveRun(app.store, app.run);
  saveMeta(app.store, app.meta);
}

export function resetProgress() {
  app.store.remove(KEYS.run);
  app.store.remove(KEYS.meta);
  app.store.remove(KEYS.corrupt);
  app.meta = defaultMeta();
  app.run = null;
  flush();
  goMenu('title');
  toast(t('settings.resetDone'));
}

// ── 설정 ─────────────────────────────────────────────────────────────
export function updateSettings(patch) {
  const langChanged = patch.lang && patch.lang !== app.settings.lang;
  Object.assign(app.settings, patch);
  saveSettings(app.store, app.settings);
  applySettings();
  if (langChanged) { render(); remountOverlays(); }
}

export function onSettings(fn) {
  settingsListeners.add(fn);
  return () => settingsListeners.delete(fn);
}

function applySettings() {
  setLang(app.settings.lang);
  document.documentElement.lang = getLang();
  app.stage?.classList.toggle('fast', !!app.settings.fast);
  app.stage?.classList.toggle('noshake', !app.settings.shake);
  for (const fn of settingsListeners) fn(app.settings);
}

const reduceMq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

// JS 쪽 연출 시간 배율(CSS 의 --spd 와 같은 값)
export function motionScale() {
  if (app.instant) return 0;   // 검증용 ?instant=1 — 백그라운드 탭에서도 연출을 기다리지 않는다
  if (reduceMq?.matches) return 0.3;
  return app.settings?.fast ? 0.5 : 1;
}

// ── 토스트 ───────────────────────────────────────────────────────────
export function toast(msg, kind = '') {
  if (!layers.toast) return;
  const el = h('div', { class: `toast ${kind}` }, msg);
  layers.toast.append(el);
  while (layers.toast.children.length > 3) layers.toast.firstChild.remove();
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 260);
  }, 2400);
}

function probeStorage() {
  try {
    const s = window.localStorage;
    const k = '__verso_probe__';
    s.setItem(k, '1');
    s.removeItem(k);
    return s;
  } catch {
    return null;
  }
}
