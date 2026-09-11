// 카드 레지스트리와 인스턴스 헬퍼.
// 인스턴스는 순수 데이터 { uid, id, up, rev, swapped } — 전투 중에만 costMod/free/stuck/temp 가 붙는다.
import { L } from './i18n.js';

const REG = new Map();

export function registerCards(list) {
  for (const c of list) {
    if (REG.has(c.id)) throw new Error(`duplicate card id: ${c.id}`);
    REG.set(c.id, c);
  }
}

export function cardDef(id) {
  const d = REG.get(id);
  if (!d) throw new Error(`unknown card: ${id}`);
  return d;
}

export function hasCard(id) { return REG.has(id); }
export function allCards() { return [...REG.values()]; }

export function makeInst(run, id, { up = 0, rev = false, swapped = false } = {}) {
  cardDef(id);
  run.uid = (run.uid ?? 0) + 1;
  return { uid: `c${run.uid}`, id, up: up ? 1 : 0, rev: !!(rev || swapped), swapped: !!swapped };
}

export const faceIdx = (inst) => (inst.rev ? 1 : 0);

export function faceOf(inst, fi = faceIdx(inst)) {
  return cardDef(inst.id).faces[fi];
}

export function valsOf(inst, fi = faceIdx(inst)) {
  const f = faceOf(inst, fi);
  return inst.up ? { ...(f.vals ?? {}), ...(f.upg ?? {}) } : { ...(f.vals ?? {}) };
}

export function baseCost(inst, fi = faceIdx(inst)) {
  const f = faceOf(inst, fi);
  if (f.cost == null || f.cost === 'X') return f.cost;
  return inst.up && f.upgCost != null ? f.upgCost : f.cost;
}

// 전투 중 실제 비용: 이번 턴 무료(free) > 전투 한정 증감(costMod)
export function costOf(inst, fi = faceIdx(inst)) {
  const c = baseCost(inst, fi);
  if (c == null || c === 'X') return c;
  if (inst.free) return 0;
  return Math.max(0, c + (inst.costMod ?? 0));
}

export function hasKw(inst, kw, fi = faceIdx(inst)) {
  const f = faceOf(inst, fi);
  if (kw === 'unplayable' && f.cost == null) return true;
  return !!f.kw?.includes(kw);
}

export function cardName(inst, fi = faceIdx(inst)) {
  return L(faceOf(inst, fi).name) + (inst.up ? '+' : '');
}

export function onFlipVals(inst) {
  const o = cardDef(inst.id).onFlip;
  if (!o) return {};
  return inst.up ? { ...(o.vals ?? {}), ...(o.upg ?? {}) } : { ...(o.vals ?? {}) };
}

export function canUpgrade(inst) {
  const d = cardDef(inst.id);
  return !inst.up && !d.noUpgrade && d.pool !== 'curse' && d.pool !== 'status';
}

export function isType(inst, type, fi = faceIdx(inst)) {
  return faceOf(inst, fi).type === type;
}
