import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  newRun, selectableNodes, enterNode, afterCombat, takeGold, removeCard, rest, restHealAmount, validateRun, leaveRoom,
} from '../src/core/run.js';

test('새 런: 바보의 시작 상태', () => {
  const r = newRun({ char: 'fool', seed: 's' });
  assert.equal(r.hp, 72);
  assert.equal(r.maxHp, 72);
  assert.equal(r.gold, 99);
  assert.equal(r.deck.length, 10);
  assert.deepEqual(r.relics, ['wornCoin']);
  assert.equal(r.screen, 'map');
  assert.ok(validateRun(r));
  assert.ok(validateRun(JSON.parse(JSON.stringify(r))));
});

test('처음 고를 수 있는 노드는 0행 시작점이고, 그 밖의 노드는 무시한다', () => {
  const r = newRun({ seed: 's' });
  assert.deepEqual(selectableNodes(r), r.map.start);
  assert.equal(enterNode(r, 'boss'), null);
});

test('전투 노드에 들어가면 전투가 시작되고 층이 오른다', () => {
  const r = newRun({ seed: 's' });
  const ev = enterNode(r, r.map.start[0]);
  assert.ok(Array.isArray(ev) && ev.length > 0);
  assert.equal(r.screen, 'combat');
  assert.ok(r.combat);
  assert.equal(r.floor, 1);
});

test('전투 승리 뒤 보상 화면, 골드는 한 번만 받는다', () => {
  const r = newRun({ seed: 's' });
  enterNode(r, r.map.start[0]);
  r.combat.phase = 'won';
  afterCombat(r);
  assert.equal(r.screen, 'reward');
  assert.equal(r.combat, null);
  const g = r.gold;
  assert.ok(takeGold(r));
  assert.ok(r.gold >= g + 10 && r.gold <= g + 20);
  assert.equal(takeGold(r), false);
  leaveRoom(r);
  assert.equal(r.screen, 'map');
  assert.equal(selectableNodes(r).length > 0, true);
});

test('상점의 카드 제거는 한 번, 다음 비용은 25 오른다', () => {
  const r = newRun({ seed: 's' });
  r.shop = { cards: [], neutral: [], relics: [], potions: [], removeUsed: false };
  r.gold = 500;
  const before = r.removeCost;
  const n = r.deck.length;
  assert.ok(removeCard(r, r.deck[0].uid));
  assert.equal(r.deck.length, n - 1);
  assert.equal(r.removeCost, before + 25);
  assert.equal(removeCard(r, r.deck[0].uid), false);
});

test('휴식은 최대 체력의 30%를 회복하고 최대치를 넘지 않는다', () => {
  const r = newRun({ seed: 's' });
  r.rest = { done: null };
  r.hp = 10;
  rest(r);
  assert.equal(r.hp, 10 + Math.floor(72 * 0.3));
  r.rest = { done: null };
  r.hp = 70;
  rest(r);
  assert.equal(r.hp, 72);
});

test('징조 3 이상이면 휴식 회복이 20%', () => {
  const r = newRun({ seed: 's', omen: 3 });
  assert.equal(restHealAmount(r), Math.floor(72 * 0.2));
});
