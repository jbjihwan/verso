// 메타 진행: 통찰 · 아르카나 레벨 · 해금 · 징조 · 기록 · 도감 발견 (스펙 10)
import './content.js';
import { allRelics } from './content.js';
import { allCards } from './cards.js';

export const LEVELS = [0, 100, 250, 450, 700, 1000, 1400];

// 레벨에 도달하면 풀리는 묶음: 카드 묶음은 해당 캐릭터 풀에서 lock 표시가 같은 카드들
export const UNLOCKS = {
  2: { kind: 'card', pool: 'fool', lock: 'A' },
  3: { kind: 'relic', lock: 'A' },
  4: { kind: 'card', pool: 'magician', lock: 'A' },
  5: { kind: 'card', pool: 'fool', lock: 'B' },
  6: { kind: 'relic', lock: 'B' },
  7: { kind: 'card', pool: 'magician', lock: 'B' },
};

export function defaultMeta() {
  return {
    insight: 0,
    unlocked: { magician: false },
    omen: { fool: 0, magician: 0 },
    stats: {
      fool: { runs: 0, wins: 0, best: 0 },
      magician: { runs: 0, wins: 0, best: 0 },
    },
    seen: { cards: {}, relics: {}, enemies: {} },
    flags: { tutorial: false },
  };
}

export function levelOf(insight) {
  let lv = 1;
  for (let i = 0; i < LEVELS.length; i++) if (insight >= LEVELS[i]) lv = i + 1;
  return lv;
}

export function levelProgress(insight) {
  const level = levelOf(insight);
  if (level >= LEVELS.length) return { level, next: null, frac: 1 };
  const lo = LEVELS[level - 1];
  const hi = LEVELS[level];
  return { level, next: hi, frac: Math.max(0, Math.min(1, (insight - lo) / (hi - lo))) };
}

export function isCharUnlocked(meta, id) {
  if (id === 'fool') return true;
  return !!meta.unlocked?.[id] || levelOf(meta.insight ?? 0) >= 3;
}

function unlockLevelOf(kind, def) {
  if (!def.lock) return 1;
  for (const [lv, u] of Object.entries(UNLOCKS)) {
    if (u.kind === kind && u.lock === def.lock && (kind === 'relic' || u.pool === def.pool)) return Number(lv);
  }
  return 1;
}

export function isUnlocked(meta, kind, def) {
  return levelOf(meta.insight ?? 0) >= unlockLevelOf(kind, def);
}

// 새 런에 넘길 잠김 목록
export function lockedContent(meta) {
  return {
    cards: allCards().filter((d) => !isUnlocked(meta, 'card', d)).map((d) => d.id),
    relics: allRelics().filter((r) => !isUnlocked(meta, 'relic', r)).map((r) => r.id),
  };
}

// 레벨 lv 에서 풀리는 항목 id 목록
export function unlocksAt(lv) {
  const u = UNLOCKS[lv];
  if (!u) return null;
  const ids = u.kind === 'card'
    ? allCards().filter((d) => d.lock === u.lock && d.pool === u.pool).map((d) => d.id)
    : allRelics().filter((r) => r.lock === u.lock).map((r) => r.id);
  return { kind: u.kind, ids };
}

export function insightFor(summary) {
  const base = summary.floor * 5 + summary.elites * 15 + summary.bosses * 50 + (summary.won ? 100 : 0);
  return Math.round(base * (1 + 0.1 * (summary.omen ?? 0)));
}

// 런 결과를 메타에 반영한다. meta 를 직접 바꾸고 알림용 요약을 돌려준다.
export function applyRunEnd(meta, summary) {
  const before = levelOf(meta.insight);
  const gained = insightFor(summary);
  meta.insight += gained;
  const after = levelOf(meta.insight);
  const st = (meta.stats[summary.char] ??= { runs: 0, wins: 0, best: 0 });
  st.runs++;
  if (summary.won) st.wins++;
  st.best = Math.max(st.best, summary.floor);
  let charUnlocked = false;
  if (!meta.unlocked.magician && (summary.act1Boss || after >= 3)) {
    meta.unlocked.magician = true;
    charUnlocked = true;
  }
  let newOmen = null;
  const cur = meta.omen[summary.char] ?? 0;
  if (summary.won && summary.omen >= cur && cur < 5) {
    meta.omen[summary.char] = cur + 1;
    newOmen = cur + 1;
  }
  const unlocks = [];
  for (let lv = before + 1; lv <= after; lv++) {
    const u = unlocksAt(lv);
    if (u) unlocks.push({ level: lv, ...u });
  }
  return { gained, levelBefore: before, levelAfter: after, unlocks, charUnlocked, newOmen };
}

export function markSeen(meta, kind, id) {
  meta.seen[kind] ??= {};
  meta.seen[kind][id] = true;
}
