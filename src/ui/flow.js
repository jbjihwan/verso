// 화면 사이의 흐름: 새 런 · 노드 진입 · 전투 뒤 · 방 떠나기 · 결과 · 포기.
// 로직은 core/run.js 에 있고, 여기서는 상태를 바꾼 뒤 저장하고 알맞은 화면을 그린다.
import { app, persist, goMenu, enterRun, render, setAbandonHandler } from './app.js';
import {
  newRun, enterNode, afterCombat, leaveRoom, endRun, startEventFight, pickBossRelic,
  makeShop, makeEvent, rollRelic, relicPool, gainCard, gainRelic, gainPotion,
} from '../core/run.js';
import { startCombat } from '../core/combat.js';
import { applyRunEnd, lockedContent } from '../core/meta.js';

const randomSeed = () => Math.floor(Math.random() * 2 ** 32).toString(36);

export function beginRun(char, omen = 0) {
  app.run = newRun({ char, omen, seed: randomSeed(), locks: lockedContent(app.meta) });
  persist();
  enterRun();
}

export function goNode(id) {
  const run = app.run;
  const ev = enterNode(run, id);
  if (ev == null) return;
  if (run.screen === 'combat') app.fxQueue = ev;
  persist();
  render();
}

export function afterVictory() {
  const run = app.run;
  if (!run) return goMenu('title');
  if (run.debug) { app.run = null; persist(); goMenu('title'); return; }
  afterCombat(run);
  if (run.screen === 'result') { finishRun(); return; }
  persist();
  render();
}

export function afterDefeat() {
  const run = app.run;
  if (!run) return goMenu('title');
  if (run.debug) { app.run = null; persist(); goMenu('title'); return; }
  endRun(run, false);
  finishRun();
}

export function leave() {
  const run = app.run;
  leaveRoom(run);
  persist();
  render();
}

export function takeBossRelic(idx) {
  pickBossRelic(app.run, idx);
  persist();
  render();
}

export function eventFight() {
  const run = app.run;
  const ev = startEventFight(run);
  if (!ev) return;
  app.fxQueue = ev;
  persist();
  render();
}

// 결과 화면: 메타 반영은 런마다 정확히 한 번
export function finishRun() {
  const run = app.run;
  if (run.result && !run.result.applied) {
    run.result.meta = applyRunEnd(app.meta, run.result);
    run.result.applied = true;
  }
  persist();
  app.menu = null;
  render();
}

export function closeRun(again = false) {
  const char = app.run?.char;
  app.run = null;
  persist();
  if (again) goMenu('charselect', { char });
  else goMenu('title');
}

setAbandonHandler((opts = {}) => {
  const run = app.run;
  if (!run) return;
  if (run.debug) { app.run = null; persist(); if (!opts.silent) goMenu('title'); return; }
  endRun(run, false);
  if (opts.silent) {
    run.result.meta = applyRunEnd(app.meta, run.result);
    run.result.applied = true;
    app.run = null;
    persist();
    return;
  }
  finishRun();
});

// ── 디버그(?debug=1) ─────────────────────────────────────────────────────
// 흐름 확인용: 지금 런에서 원하는 방을 바로 연다
export function debugRoom(type) {
  const run = app.run;
  if (!run) return;
  run.combat = null;
  if (type === 'shop') run.shop = makeShop(run);
  else if (type === 'rest') run.rest = { done: null };
  else if (type === 'treasure') run.treasure = { opened: false, relic: rollRelic(run), gold: 30 };
  else if (type === 'event') { run.event = makeEvent(run); if (!run.event) return; }
  else if (type === 'bossRelic') run.bossRelic = { options: relicPool(run, ['boss']).slice(0, 3).map((r) => r.id) };
  else if (type === 'result') { endRun(run, false); finishRun(); return; }
  run.screen = type;
  persist();
  enterRun();
}

// 흐름 확인용: 지금 런의 덱으로 바로 전투
export function debugBattle(enc = 'a1_imps') {
  const run = app.run;
  if (!run) return;
  run.fight = { kind: 'combat', enc, reward: null };
  app.fxQueue = startCombat(run, enc);
  run.screen = 'combat';
  persist();
  enterRun();
}

// 흐름 확인용: 카드·유물·물약 지급
export function debugGive(...ids) {
  const run = app.run;
  if (!run) return;
  for (const id of ids) gainCard(run, id);
  persist();
  render();
}

export function debugRelic(id) {
  if (!app.run) return;
  gainRelic(app.run, id);
  persist();
  render();
}

export function debugPotion(id) {
  if (!app.run) return;
  gainPotion(app.run, id);
  persist();
  render();
}

// 흐름 확인용: 지금 전투를 즉시 이긴 것으로 처리한다
export function debugWin() {
  const cs = app.run?.combat;
  if (!cs) return;
  for (const e of cs.enemies) { e.hp = 0; e.dead = true; }
  cs.phase = 'won';
  cs.flags.ended = true;
  app.run.hp = cs.player.hp;
  afterVictory();
}

export function debugFight(encounterId = 'a1_imps', char = 'fool') {
  app.run = newRun({ char, seed: `dbg-${Date.now().toString(36)}` });
  app.run.debug = true;
  app.fxQueue = startCombat(app.run, encounterId);
  app.run.screen = 'combat';
  persist();
  enterRun();
}
