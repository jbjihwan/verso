// 카드 DOM. 카드는 점대칭이다: 위 절반 = 정방향 면, 180° 돌린 아래 절반 = 역방향 면.
// 뒤집기는 .card.rev 로 .card-inner 전체를 180° 돌리는 CSS 전이 — 그래서 요소를 다시 만들지 않고
// refreshCard 로 내용만 갈아 끼운다(요소를 새로 만들면 회전 연출이 사라진다).
import { h } from './dom.js';
import { L, t } from '../core/i18n.js';
import { cardDef, valsOf, costOf, baseCost, onFlipVals } from '../core/cards.js';
import { KEYWORDS } from '../core/keywords.js';
import { statusDef, hasStatus } from '../core/statuses.js';
import { displayVals } from '../core/combat.js';
import { glyphMarkup } from './art/glyphs.js';
import { iconMarkup } from './art/icons.js';

const TYPE_ICON = { attack: 'sword', skill: 'ring', power: 'sun', curse: 'skull', status: 'hourglass' };
const TAG_KW = ['innate', 'retain', 'steady', 'ethereal', 'vanish', 'unplayable'];
// 보정된 숫자를 텍스트 함수에 통과시킨 뒤 찾아내기 위한 표식(제어 문자 1·2)
const TOK_A = String.fromCharCode(1);
const TOK_B = String.fromCharCode(2);
const TOK_RE = new RegExp(`${TOK_A}(\\w+)${TOK_B}`, 'g');

export function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

const kwMark = (s) => s.replace(/\[\[(.+?)\]\]/g, '<b class="kw">$1</b>');

// dv: displayVals 결과({ v, mods }) — 없으면 기본값. 보정된 숫자는 색으로 표시한다.
export function faceTextHtml(inst, fi, dv) {
  const d = cardDef(inst.id);
  const f = d.faces[fi];
  const v = dv?.v ?? valsOf(inst, fi);
  const mods = dv?.mods ?? {};
  const tv = {};
  for (const [k, val] of Object.entries(v)) tv[k] = typeof val === 'number' && mods[k] ? `${TOK_A}${k}${TOK_B}` : val;
  let s = kwMark(escapeHtml(L(f.text, tv)));
  s = s.replace(TOK_RE, (_, k) => `<b class="n ${mods[k]}">${v[k]}</b>`);
  if (d.onFlip) {
    s += `<span class="c-onflip"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${iconMarkup('flip')}</svg> ${kwMark(escapeHtml(L(d.onFlip.text, onFlipVals(inst))))}</span>`;
  }
  const tags = (f.kw ?? []).filter((k) => TAG_KW.includes(k));
  if (f.cost == null && !tags.includes('unplayable')) tags.unshift('unplayable');
  if (tags.length) s += `<span class="c-tags">${tags.map((k) => escapeHtml(L(KEYWORDS[k].name))).join(' · ')}</span>`;
  return s;
}

function faceName(inst, fi) {
  return escapeHtml(L(cardDef(inst.id).faces[fi].name)) + (inst.up ? '+' : '');
}

function costHtml(inst, fi, inCombat) {
  const f = cardDef(inst.id).faces[fi];
  if (f.cost == null) return '';
  const c = inCombat ? costOf(inst, fi) : baseCost(inst, fi);
  const b = baseCost(inst, fi);
  const cls = c !== b && c !== 'X' && b !== 'X' ? (c < b ? ' down' : ' up') : '';
  return `<span class="c-cost${cls}">${c === 'X' ? 'X' : c}</span>`;
}

function halfHtml(inst, fi, dv, inCombat) {
  const f = cardDef(inst.id).faces[fi];
  return `<div class="half ${fi ? 'b' : 'a'}" data-t="${f.type}">`
    + `<div class="c-head">${costHtml(inst, fi, inCombat)}<span class="c-name">${faceName(inst, fi)}</span>`
    + `<svg class="c-type" viewBox="0 0 24 24" aria-hidden="true">${iconMarkup(TYPE_ICON[f.type] ?? 'star4')}</svg></div>`
    + `<div class="c-text">${faceTextHtml(inst, fi, dv)}</div></div>`;
}

function artHtml(d) {
  return '<svg class="c-art" viewBox="0 0 100 100" aria-hidden="true">'
    + '<circle class="med-bg" cx="50" cy="50" r="46"/><circle class="med-ring" cx="50" cy="50" r="46"/>'
    + `<g transform="translate(14 14) scale(0.72)">${glyphMarkup(d.art)}</g></svg>`;
}

// opts: { run, target, can, opt, picked, dim }
export function cardEl(inst, opts = {}) {
  const d = cardDef(inst.id);
  const el = h('div', { class: `card r-${d.rarity} p-${d.pool}`, dataset: { uid: inst.uid } });
  el.append(h('div', { class: 'card-inner' }));
  refreshCard(el, inst, opts);
  return el;
}

export function refreshCard(el, inst, opts = {}) {
  const d = cardDef(inst.id);
  const inCombat = !!opts.run?.combat;
  const active = inst.rev ? 1 : 0;
  const dvFor = (fi) => (inCombat && fi === active ? displayVals(opts.run, inst, opts.target) : null);
  el.firstChild.innerHTML = halfHtml(inst, 0, dvFor(0), inCombat) + artHtml(d) + halfHtml(inst, 1, dvFor(1), inCombat);
  el.classList.toggle('rev', !!inst.rev);
  el.classList.toggle('up', !!inst.up);
  el.classList.toggle('can', !!opts.can);
  el.classList.toggle('opt', !!opts.opt);
  el.classList.toggle('picked', !!opts.picked);
  el.classList.toggle('dim', !!opts.dim);
  el.setAttribute('aria-label', `${L(d.faces[active].name)}${inst.up ? '+' : ''}`);
}

// 확대 보기용: 한 면을 똑바로 세운 패널
export function facePanel(inst, fi, { active = false, run = null } = {}) {
  const d = cardDef(inst.id);
  const f = d.faces[fi];
  const inCombat = !!run?.combat;
  const dv = inCombat && active ? displayVals(run, inst) : null;
  const el = h('div', { class: `facep ${active ? 'on' : 'off'}`, dataset: { t: f.type } });
  el.innerHTML = `<div class="facep-lbl">${escapeHtml(fi ? t('common.reversed') : t('common.upright'))} · ${escapeHtml(t(`card.${f.type}`))}</div>`
    + `<div class="c-head">${costHtml(inst, fi, inCombat)}<span class="c-name">${faceName(inst, fi)}</span></div>`
    + `<div class="c-text">${faceTextHtml(inst, fi, dv)}</div>`;
  return el;
}

// 카드가 언급하는 키워드·상태이상 설명 → [{ title, body }]
export function cardTips(inst) {
  const d = cardDef(inst.id);
  const seen = new Set();
  const out = [];
  const add = (key) => {
    if (seen.has(key)) return;
    seen.add(key);
    if (KEYWORDS[key]) out.push({ title: L(KEYWORDS[key].name), body: L(KEYWORDS[key].desc) });
    else if (hasStatus(key)) {
      const s = statusDef(key);
      out.push({ title: L(s.name), body: L(s.desc, s.flag ? 1 : 'X') });
    }
  };
  add('flip');
  if (d.onFlip) add('onFlip');
  for (const f of d.faces) {
    for (const k of f.kw ?? []) add(k);
    for (const k of f.tips ?? []) add(k);
  }
  for (const k of d.tips ?? []) add(k);
  return out;
}
