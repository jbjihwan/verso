// 저장소 어댑터. localStorage 처럼 getItem/setItem/removeItem 을 가진 객체를 받는다.
// 원칙: 읽을 수 없는 데이터는 절대 조용히 지우지 않는다 — 격리 키로 옮기고 알린다.
// (Coreward 2단계에서 "거절된 저장이 조용히 영구 삭제"되는 치명적 버그를 겪었다)

export const KEYS = {
  settings: 'verso:settings:v1',
  meta: 'verso:meta:v1',
  run: 'verso:run:v1',
  corrupt: 'verso:run:corrupt',
};
const VERSION = 1;

export function makeStore(storage) {
  const raw = {
    get(k) { try { return storage ? storage.getItem(k) : null; } catch { return null; } },
    set(k, v) { try { if (!storage) return false; storage.setItem(k, v); return true; } catch { return false; } },
    del(k) { try { storage?.removeItem(k); } catch { /* 접근이 막힌 환경 */ } },
  };
  return {
    // → { ok: true, data } | { ok: false, raw }   (data 가 null 이면 저장된 것이 없음)
    read(key) {
      const s = raw.get(key);
      if (s == null) return { ok: true, data: null };
      try {
        const env = JSON.parse(s);
        if (!env || typeof env !== 'object' || env.v !== VERSION || !('data' in env)) return { ok: false, raw: s };
        return { ok: true, data: env.data };
      } catch {
        return { ok: false, raw: s };
      }
    },
    write(key, data) { return raw.set(key, JSON.stringify({ v: VERSION, data })); },
    quarantine(key, s) {
      raw.set(key === KEYS.run ? KEYS.corrupt : `${key}:corrupt`, s);
      raw.del(key);
    },
    remove(key) { raw.del(key); },
  };
}

// 세 가지를 한 번에 읽는다. validateRun(run) 이 false 면 런도 격리한다.
// → { settings, meta, run, notices: ['settings'|'meta'|'run', ...] }
export function loadAll(store, { defaultSettings, defaultMeta, validateRun = () => true }) {
  const notices = [];

  const s = store.read(KEYS.settings);
  if (!s.ok) { store.quarantine(KEYS.settings, s.raw); notices.push('settings'); }
  const settings = { ...defaultSettings, ...(s.ok && s.data ? s.data : {}) };

  const m = store.read(KEYS.meta);
  if (!m.ok) { store.quarantine(KEYS.meta, m.raw); notices.push('meta'); }
  const meta = m.ok && m.data ? mergeMeta(defaultMeta, m.data) : defaultMeta;

  let run = null;
  const r = store.read(KEYS.run);
  if (!r.ok) {
    store.quarantine(KEYS.run, r.raw); notices.push('run');
  } else if (r.data) {
    let valid = false;
    try { valid = validateRun(r.data); } catch { valid = false; }
    if (valid) run = r.data;
    else { store.quarantine(KEYS.run, JSON.stringify({ v: VERSION, data: r.data })); notices.push('run'); }
  }
  return { settings, meta, run, notices };
}

export function saveSettings(store, settings) { return store.write(KEYS.settings, settings); }
export function saveMeta(store, meta) { return store.write(KEYS.meta, meta); }
export function saveRun(store, run) { return run ? store.write(KEYS.run, run) : (store.remove(KEYS.run), true); }

// 새 버전에서 메타에 필드가 늘어도 옛 저장을 살린다: 기본값 위에 저장값을 한 단계 깊이로 덮는다.
function mergeMeta(def, saved) {
  const out = { ...def };
  for (const [k, v] of Object.entries(saved)) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) && def[k] && typeof def[k] === 'object'
      ? { ...def[k], ...v }
      : v;
  }
  return out;
}
