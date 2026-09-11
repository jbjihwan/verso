// 모든 콘텐츠를 등록하고 조회 함수를 내보낸다. 게임 로직은 데이터 모듈을 직접 import 하지 않고 여기를 거친다.
import { registerCards } from './cards.js';
import { registerStatuses } from './statuses.js';
import * as basic from './data/cards/basic.js';
import * as fool from './data/cards/fool.js';
import * as magician from './data/cards/magician.js';
import * as neutral from './data/cards/neutral.js';
import { RELICS } from './data/relics.js';
import { POTIONS } from './data/potions.js';
import * as act1 from './data/enemies/act1.js';
import { ENCOUNTERS } from './data/encounters.js';
import { EVENTS } from './data/events.js';

const relics = new Map();
const potions = new Map();
const enemies = new Map();
const encounters = new Map();
const events = new Map();

function put(map, list, kind) {
  for (const x of list) {
    if (map.has(x.id)) throw new Error(`duplicate ${kind}: ${x.id}`);
    map.set(x.id, x);
  }
}

export function registerRelics(list) { put(relics, list, 'relic'); }
export function registerPotions(list) { put(potions, list, 'potion'); }
export function registerEnemies(list) { put(enemies, list, 'enemy'); }
export function registerEncounters(list) { put(encounters, list, 'encounter'); }
export function registerEvents(list) { put(events, list, 'event'); }

function get(map, id, kind) {
  const x = map.get(id);
  if (!x) throw new Error(`unknown ${kind}: ${id}`);
  return x;
}

export const relicDef = (id) => get(relics, id, 'relic');
export const potionDef = (id) => get(potions, id, 'potion');
export const enemyDef = (id) => get(enemies, id, 'enemy');
export const encounterDef = (id) => get(encounters, id, 'encounter');
export const eventDef = (id) => get(events, id, 'event');

export const allRelics = () => [...relics.values()];
export const allPotions = () => [...potions.values()];
export const allEnemies = () => [...enemies.values()];
export const allEncounters = () => [...encounters.values()];
export const allEvents = () => [...events.values()];

export function encountersFor(act, pool) {
  return allEncounters().filter((e) => e.act === act && e.pool === pool);
}

for (const m of [basic, fool, magician, neutral]) {
  registerCards(m.CARDS);
  if (m.STATUSES) registerStatuses(m.STATUSES);
}
registerRelics(RELICS);
registerPotions(POTIONS);
for (const m of [act1]) {
  registerEnemies(m.ENEMIES);
  if (m.STATUSES) registerStatuses(m.STATUSES);
}
registerEncounters(ENCOUNTERS);
registerEvents(EVENTS);
