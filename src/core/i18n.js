// 언어 상태와 문자열 조회. DOM 을 모른다 — Node 에서도 그대로 import 된다.
import ko from './text/ko.js';
import en from './text/en.js';

const TABLES = { ko, en };
let lang = 'en';

export function detectLang(navLang) {
  return typeof navLang === 'string' && navLang.toLowerCase().startsWith('ko') ? 'ko' : 'en';
}

export function setLang(l) { lang = l === 'ko' ? 'ko' : 'en'; }
export function getLang() { return lang; }

// UI 문자열: 'combat.endTurn' 같은 점 경로 키. {name} 자리표시자를 params 로 치환한다.
// 표에 함수가 들어 있으면 params 를 넘겨 호출한다(복수형 등).
export function t(key, params) {
  const s = lookup(TABLES[lang], key) ?? lookup(TABLES.en, key) ?? key;
  if (typeof s === 'function') return s(params ?? {});
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m));
}

// 데이터 쪽의 { ko, en } 값 → 현재 언어. 값이 함수면 args 로 호출한다.
export function L(obj, ...args) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  const v = obj[lang] ?? obj.en;
  return typeof v === 'function' ? v(...args) : (v ?? '');
}

function lookup(table, key) {
  let cur = table;
  for (const part of key.split('.')) {
    if (cur == null) return undefined;
    cur = cur[part];
  }
  return cur;
}
