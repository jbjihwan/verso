// 메타 진행: 통찰·아르카나 레벨·해금·징조·기록. (Task 9 에서 확장)

export const LEVELS = [0, 100, 250, 450, 700, 1000, 1400];

export function defaultMeta() {
  return {
    insight: 0,
    unlocked: { magician: false },
    omen: { fool: 0, magician: 0 },          // 캐릭터별로 선택 가능한 최고 징조
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

// → { level, next: 다음 레벨 문턱 | null, frac: 0..1 }
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
