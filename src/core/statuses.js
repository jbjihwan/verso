// 상태이상·파워 정의. 콘텐츠 모듈이 registerStatuses 로 파워용 상태를 더 등록한다.
// decay: 'turn' 이면 소유자 턴 종료 시 1 감소. signed: 음수 스택 허용(힘·민첩).
// hooks(ctx, owner, n, ...): turnStart / turnEnd 는 전투 엔진이, 나머지는 runHooks 가 부른다.

const REG = new Map();

export function registerStatuses(obj) {
  for (const [id, def] of Object.entries(obj)) {
    if (REG.has(id)) throw new Error(`duplicate status: ${id}`);
    REG.set(id, { id, ...def });
  }
}

export function statusDef(id) {
  return REG.get(id) ?? { id, kind: 'buff', icon: 'question', name: { ko: id, en: id }, desc: { ko: () => '', en: () => '' } };
}

export function hasStatus(id) { return REG.has(id); }

const s = (n) => (n > 1 ? 's' : '');

registerStatuses({
  might: {
    kind: 'buff', signed: true, icon: 'sword',
    name: { ko: '힘', en: 'Might' },
    desc: {
      ko: (n) => (n >= 0 ? `공격 피해가 타격당 ${n} 늘어납니다.` : `공격 피해가 타격당 ${-n} 줄어듭니다.`),
      en: (n) => (n >= 0 ? `Attacks deal ${n} more damage per hit.` : `Attacks deal ${-n} less damage per hit.`),
    },
  },
  poise: {
    kind: 'buff', signed: true, icon: 'feather',
    name: { ko: '민첩', en: 'Poise' },
    desc: {
      ko: (n) => (n >= 0 ? `카드로 얻는 방어도가 ${n} 늘어납니다.` : `카드로 얻는 방어도가 ${-n} 줄어듭니다.`),
      en: (n) => (n >= 0 ? `Gain ${n} more Block from cards.` : `Gain ${-n} less Block from cards.`),
    },
  },
  thorns: {
    kind: 'buff', icon: 'spikes',
    name: { ko: '가시', en: 'Thorns' },
    desc: { ko: (n) => `공격받을 때마다 공격자에게 피해를 ${n} 줍니다.`, en: (n) => `When attacked, deal ${n} damage back.` },
  },
  regen: {
    kind: 'buff', icon: 'leaf',
    name: { ko: '재생', en: 'Regen' },
    desc: { ko: (n) => `턴이 끝날 때 체력을 ${n} 회복하고 1 줄어듭니다.`, en: (n) => `At the end of turn, heal ${n}, then reduce this by 1.` },
    hooks: { turnEnd(ctx, owner, n) { ctx.heal(owner, n); ctx.apply(owner, 'regen', -1); } },
  },
  bulwark: {
    kind: 'buff', icon: 'castle', flag: true,
    name: { ko: '보루', en: 'Bulwark' },
    desc: { ko: () => '턴이 시작되어도 방어도가 사라지지 않습니다.', en: () => 'Block isn’t removed at the start of turn.' },
  },
  ascend: {
    kind: 'buff', icon: 'chevrons',
    name: { ko: '상승', en: 'Ascend' },
    desc: { ko: (n) => `턴이 끝날 때 힘을 ${n} 얻습니다.`, en: (n) => `At the end of turn, gain ${n} Might.` },
    hooks: { turnEnd(ctx, owner, n) { ctx.apply(owner, 'might', n); } },
  },
  ward: {
    kind: 'buff', icon: 'ring',
    name: { ko: '수호', en: 'Ward' },
    desc: { ko: (n) => `다음 디버프 ${n}개를 무효로 합니다.`, en: (n) => `Negates the next ${n} debuff${s(n)}.` },
  },
  charge: {
    kind: 'buff', icon: 'bolt',
    name: { ko: '충전', en: 'Charge' },
    desc: { ko: (n) => `방출 카드가 소모하는 힘입니다. 현재 ${n}.`, en: (n) => `Spent by Discharge cards. You have ${n}.` },
  },
  exposed: {
    kind: 'debuff', decay: 'turn', icon: 'eye',
    name: { ko: '취약', en: 'Exposed' },
    desc: { ko: (n) => `받는 공격 피해가 50% 늘어납니다. ${n}턴.`, en: (n) => `Takes 50% more attack damage. ${n} turn${s(n)}.` },
  },
  weak: {
    kind: 'debuff', decay: 'turn', icon: 'brokenSword',
    name: { ko: '약화', en: 'Weak' },
    desc: { ko: (n) => `주는 공격 피해가 25% 줄어듭니다. ${n}턴.`, en: (n) => `Deals 25% less attack damage. ${n} turn${s(n)}.` },
  },
  brittle: {
    kind: 'debuff', decay: 'turn', icon: 'crack',
    name: { ko: '허약', en: 'Brittle' },
    desc: { ko: (n) => `카드로 얻는 방어도가 25% 줄어듭니다. ${n}턴.`, en: (n) => `Gains 25% less Block from cards. ${n} turn${s(n)}.` },
  },
  venom: {
    kind: 'debuff', icon: 'drop',
    name: { ko: '독', en: 'Venom' },
    desc: { ko: (n) => `턴이 시작될 때 체력을 ${n} 잃고 1 줄어듭니다.`, en: (n) => `At the start of turn, lose ${n} HP, then reduce this by 1.` },
    hooks: {
      turnStart(ctx, owner, n) {
        ctx.loseHp(owner, n);
        if (!owner.dead && owner.hp > 0) ctx.apply(owner, 'venom', -1);
      },
    },
  },
});
