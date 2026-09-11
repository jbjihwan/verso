// 마법사(The Magician) 카드 — 정체성: 정방향으로 충전을 모으고 역방향으로 방출한다. 독.
// 방출 카드의 calc 는 v.n(지금 가진 충전)을 채워 표시값을 미리 계산한다.
const sfx = (n) => (n > 1 ? 's' : '');
const charge = (cs) => cs.player.st.charge ?? 0;
const paren = (x) => (x != null ? ` (${x})` : '');

export const STATUSES = {
  chargedField: {
    kind: 'power', icon: 'bolt', name: { ko: '충전 결계', en: 'Charged Field' },
    desc: { ko: (n) => `턴을 시작할 때 충전을 ${n} 얻습니다.`, en: (n) => `At the start of your turn, gain ${n} Charge.` },
    hooks: { turnStart(ctx, owner, n) { ctx.charge(n); } },
  },
  resonance: {
    kind: 'power', icon: 'shield', name: { ko: '공명', en: 'Resonance' },
    desc: { ko: (n) => `방출할 때마다 방어도를 ${n} 얻습니다.`, en: (n) => `Whenever you Discharge, gain ${n} Block.` },
    hooks: { discharged(ctx, owner, n) { ctx.gainBlock('player', n); } },
  },
  plague: {
    kind: 'power', icon: 'drop', name: { ko: '역병', en: 'Plague' },
    desc: { ko: (n) => `턴이 끝날 때 모든 적에게 독을 ${n} 부여합니다.`, en: (n) => `At the end of your turn, apply ${n} Venom to ALL enemies.` },
    hooks: { turnEnd(ctx, owner, n) { ctx.applyAll('venom', n); } },
  },
  mastery: {
    kind: 'power', icon: 'star4', name: { ko: '비전 통달', en: 'Arcane Mastery' },
    desc: { ko: (n) => `턴이 끝날 때 모든 적에게 지닌 충전만큼 피해를 ${n > 1 ? `${n}번 ` : ''}줍니다.`, en: (n) => `At the end of your turn, deal damage equal to your Charge to ALL enemies${n > 1 ? ` ${n} times` : ''}.` },
    hooks: {
      turnEnd(ctx, owner, n) {
        const c = owner.st.charge ?? 0;
        if (c <= 0) return;
        for (let i = 0; i < n; i++) for (const e of ctx.enemiesAlive()) ctx.hit(e, c);
      },
    },
  },
  grandDesign: {
    kind: 'power', icon: 'sun', name: { ko: '대설계', en: 'Grand Design' },
    desc: { ko: (n) => `충전을 3 이상 방출할 때마다 에너지를 ${n} 얻습니다.`, en: (n) => `Whenever you Discharge 3 or more Charge, gain ${n} Energy.` },
    hooks: { discharged(ctx, owner, n, spent) { if (spent >= 3) ctx.energy(n); } },
  },
  infinityLoop: {
    kind: 'power', icon: 'flip', name: { ko: '무한의 고리', en: 'Infinity Loop' },
    desc: { ko: (n) => `카드가 뒤집힐 때마다 충전을 ${n} 얻습니다.`, en: (n) => `Whenever a card flips, gain ${n} Charge.` },
    hooks: { flip(ctx, owner, n) { ctx.charge(n); } },
  },
  cascade: {
    kind: 'power', icon: 'deck', name: { ko: '연쇄', en: 'Cascade' },
    desc: { ko: (n) => `방출할 때마다 카드를 ${n}장 뽑습니다.`, en: (n) => `Whenever you Discharge, draw ${n} card${sfx(n)}.` },
    hooks: { discharged(ctx, owner, n) { ctx.draw(n); } },
  },
};

// 방출: 충전을 모두 쓰고 소모량 n 을 돌려준다
const spend = (c) => c.discharge();

export const CARDS = [
  // ── 시작 카드 ──────────────────────────────────────────────────────────
  {
    id: 'spark', pool: 'magician', rarity: 'basic', art: 'bolt',
    faces: [
      {
        name: { ko: '불꽃', en: 'Spark' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 5, ch: 2 }, upg: { dmg: 7 }, tips: ['charge'],
        text: {
          ko: (v) => `피해를 ${v.dmg} 줍니다. [[충전]]을 ${v.ch} 얻습니다.`,
          en: (v) => `Deal ${v.dmg} damage. Gain ${v.ch} [[Charge]].`,
        },
        play: (c, v) => { c.attack(c.target, v.dmg); c.charge(v.ch); },
      },
      {
        name: { ko: '섬광', en: 'Flare' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 4 }, upg: { dmg: 5 }, kw: ['discharge'], tips: ['charge'],
        calc: (cs, v) => { v.n = charge(cs); },
        text: {
          ko: (v) => `[[방출]]: 충전 1마다 피해를 ${v.dmg} 줍니다.${v.n != null ? ` (${v.n}회)` : ''}`,
          en: (v) => `[[Discharge]]: deal ${v.dmg} damage for each Charge.${v.n != null ? ` (${v.n}×)` : ''}`,
        },
        play: (c, v) => { const n = spend(c); if (n > 0) c.attack(c.target, v.dmg, n); },
      },
    ],
  },
  {
    id: 'nightshade', pool: 'magician', rarity: 'basic', art: 'leaf',
    faces: [
      {
        name: { ko: '독초', en: 'Nightshade' }, type: 'skill', cost: 1, target: 'enemy',
        vals: { ven: 4 }, upg: { ven: 6 }, tips: ['venom'],
        text: { ko: (v) => `[[독]]을 ${v.ven} 부여합니다.`, en: (v) => `Apply ${v.ven} [[Venom]].` },
        play: (c, v) => c.apply(c.target, 'venom', v.ven),
      },
      {
        name: { ko: '시듦', en: 'Wither' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 5, ch: 2 }, upg: { dmg: 7 }, tips: ['venom', 'charge'],
        text: {
          ko: (v) => `피해를 ${v.dmg} 줍니다. 대상에게 [[독]]이 있으면 [[충전]]을 ${v.ch} 얻습니다.`,
          en: (v) => `Deal ${v.dmg} damage. If the target has [[Venom]], gain ${v.ch} [[Charge]].`,
        },
        play: (c, v) => {
          const had = (c.target.st.venom ?? 0) > 0;
          c.attack(c.target, v.dmg);
          if (had) c.charge(v.ch);
        },
      },
    ],
  },

  // ── 일반 12 ────────────────────────────────────────────────────────────
  {
    id: 'arcaneBolt', pool: 'magician', rarity: 'common', art: 'bolt',
    faces: [
      {
        name: { ko: '비전 화살', en: 'Arcane Bolt' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 7 }, upg: { dmg: 10 }, tips: ['charge'],
        text: { ko: (v) => `피해를 ${v.dmg} 줍니다. [[충전]]을 1 얻습니다.`, en: (v) => `Deal ${v.dmg} damage. Gain 1 [[Charge]].` },
        play: (c, v) => { c.attack(c.target, v.dmg); c.charge(1); },
      },
      {
        name: { ko: '비전 폭발', en: 'Arcane Burst' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { base: 5, per: 3 }, upg: { base: 7, per: 4 }, kw: ['discharge'],
        calc: (cs, v) => { v.dmg = v.base + v.per * charge(cs); },
        text: {
          ko: (v) => `[[방출]]: 피해를 ${v.base} 주고, 충전 1마다 ${v.per} 더 줍니다.${paren(v.dmg, true)}`,
          en: (v) => `[[Discharge]]: deal ${v.base} damage, plus ${v.per} per Charge.${paren(v.dmg)}`,
        },
        play: (c, v) => { const n = spend(c); c.attack(c.target, v.base + v.per * n); },
      },
    ],
  },
  {
    id: 'wardSigil', pool: 'magician', rarity: 'common', art: 'pentacle',
    faces: [
      {
        name: { ko: '수호 문양', en: 'Ward Sigil' }, type: 'skill', cost: 1, target: 'self',
        vals: { blk: 6 }, upg: { blk: 9 }, tips: ['charge'],
        text: { ko: (v) => `방어도를 ${v.blk} 얻습니다. [[충전]]을 1 얻습니다.`, en: (v) => `Gain ${v.blk} Block. Gain 1 [[Charge]].` },
        play: (c, v) => { c.block(v.blk); c.charge(1); },
      },
      {
        name: { ko: '문양 해방', en: 'Sigil Release' }, type: 'skill', cost: 1, target: 'self',
        vals: { per: 4 }, upg: { per: 5 }, kw: ['discharge'],
        calc: (cs, v) => { v.blkT = v.per * charge(cs); },
        text: {
          ko: (v) => `[[방출]]: 충전 1마다 방어도를 ${v.per} 얻습니다.${paren(v.blkT, true)}`,
          en: (v) => `[[Discharge]]: gain ${v.per} Block for each Charge.${paren(v.blkT)}`,
        },
        play: (c, v) => { const n = spend(c); if (n > 0) c.block(v.per * n); },
      },
    ],
  },
  {
    id: 'toxicMist', pool: 'magician', rarity: 'common', art: 'drop',
    faces: [
      {
        name: { ko: '독안개', en: 'Toxic Mist' }, type: 'skill', cost: 1, target: 'all',
        vals: { ven: 2 }, upg: { ven: 3 }, tips: ['venom'],
        text: { ko: (v) => `모든 적에게 [[독]]을 ${v.ven} 부여합니다.`, en: (v) => `Apply ${v.ven} [[Venom]] to ALL enemies.` },
        play: (c, v) => c.applyAll('venom', v.ven),
      },
      {
        name: { ko: '독기 분출', en: 'Miasma' }, type: 'attack', cost: 1, target: 'all',
        vals: { dmg: 4 }, upg: { dmg: 6 },
        text: { ko: (v) => `모든 적에게 피해를 ${v.dmg} 줍니다.`, en: (v) => `Deal ${v.dmg} damage to ALL enemies.` },
        play: (c, v) => c.attackAll(v.dmg),
      },
    ],
  },
  {
    id: 'focus', pool: 'magician', rarity: 'common', art: 'eye',
    faces: [
      {
        name: { ko: '집중', en: 'Focus' }, type: 'skill', cost: 0, target: 'self',
        vals: { ch: 2 }, upg: { ch: 3 }, tips: ['charge'],
        text: { ko: (v) => `[[충전]]을 ${v.ch} 얻습니다.`, en: (v) => `Gain ${v.ch} [[Charge]].` },
        play: (c, v) => c.charge(v.ch),
      },
      {
        name: { ko: '흩뿌리기', en: 'Scatter' }, type: 'attack', cost: 0, target: 'none',
        vals: { dmg: 2 }, upg: { dmg: 3 }, kw: ['discharge'],
        calc: (cs, v) => { v.n = charge(cs); },
        text: {
          ko: (v) => `[[방출]]: 충전 1마다 무작위 적에게 피해를 ${v.dmg} 줍니다.${v.n != null ? ` (${v.n}회)` : ''}`,
          en: (v) => `[[Discharge]]: deal ${v.dmg} damage to a random enemy for each Charge.${v.n != null ? ` (${v.n}×)` : ''}`,
        },
        play: (c, v) => { const n = spend(c); if (n > 0) c.attackRandom(v.dmg, n); },
      },
    ],
  },
  {
    id: 'venomDart', pool: 'magician', rarity: 'common', art: 'dagger',
    faces: [
      {
        name: { ko: '독침', en: 'Venom Dart' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 4, ven: 3 }, upg: { dmg: 5, ven: 4 }, tips: ['venom'],
        text: {
          ko: (v) => `피해를 ${v.dmg} 줍니다. [[독]]을 ${v.ven} 부여합니다.`,
          en: (v) => `Deal ${v.dmg} damage. Apply ${v.ven} [[Venom]].`,
        },
        play: (c, v) => { c.attack(c.target, v.dmg); c.apply(c.target, 'venom', v.ven); },
      },
      {
        name: { ko: '연속 찌르기', en: 'Twin Sting' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 4 }, upg: { dmg: 6 },
        text: { ko: (v) => `피해를 ${v.dmg}씩 2번 줍니다.`, en: (v) => `Deal ${v.dmg} damage twice.` },
        play: (c, v) => c.attack(c.target, v.dmg, 2),
      },
    ],
  },
  {
    id: 'manaShield', pool: 'magician', rarity: 'common', art: 'shield',
    faces: [
      {
        name: { ko: '마나 방패', en: 'Mana Shield' }, type: 'skill', cost: 1, target: 'self',
        vals: { blk: 8 }, upg: { blk: 11 },
        text: { ko: (v) => `방어도를 ${v.blk} 얻습니다.`, en: (v) => `Gain ${v.blk} Block.` },
        play: (c, v) => c.block(v.blk),
      },
      {
        name: { ko: '마나 흡수', en: 'Mana Draw' }, type: 'skill', cost: 1, target: 'self',
        vals: { blk: 5 }, upg: { blk: 7 }, tips: ['charge'],
        text: { ko: (v) => `방어도를 ${v.blk} 얻습니다. [[충전]]을 2 얻습니다.`, en: (v) => `Gain ${v.blk} Block. Gain 2 [[Charge]].` },
        play: (c, v) => { c.block(v.blk); c.charge(2); },
      },
    ],
  },
  {
    id: 'incantation', pool: 'magician', rarity: 'common', art: 'quill',
    faces: [
      {
        name: { ko: '주문', en: 'Incantation' }, type: 'skill', cost: 1, target: 'self',
        vals: { n: 2 }, upg: { n: 3 }, tips: ['charge'],
        text: { ko: (v) => `카드를 ${v.n}장 뽑습니다. [[충전]]을 1 얻습니다.`, en: (v) => `Draw ${v.n} cards. Gain 1 [[Charge]].` },
        play: (c, v) => { c.draw(v.n); c.charge(1); },
      },
      {
        name: { ko: '낭송', en: 'Recital' }, type: 'skill', cost: 1, upgCost: 0, target: 'self',
        vals: { max: 4 }, kw: ['discharge'],
        calc: (cs, v) => { v.n = Math.min(v.max, charge(cs)); },
        text: {
          ko: (v) => `[[방출]]: 충전 1마다 카드를 1장 뽑습니다(최대 ${v.max}장).${v.n != null ? ` (${v.n})` : ''}`,
          en: (v) => `[[Discharge]]: draw 1 card for each Charge (up to ${v.max}).${v.n != null ? ` (${v.n})` : ''}`,
        },
        play: (c, v) => { const n = spend(c); if (n > 0) c.draw(Math.min(v.max, n)); },
      },
    ],
  },
  {
    id: 'hex', pool: 'magician', rarity: 'common', art: 'rune',
    faces: [
      {
        name: { ko: '주술', en: 'Hex' }, type: 'skill', cost: 1, target: 'enemy',
        vals: { wk: 2 }, upg: { wk: 3 }, tips: ['weak', 'charge'],
        text: { ko: (v) => `[[약화]]를 ${v.wk} 부여합니다. [[충전]]을 1 얻습니다.`, en: (v) => `Apply ${v.wk} [[Weak]]. Gain 1 [[Charge]].` },
        play: (c, v) => { c.apply(c.target, 'weak', v.wk); c.charge(1); },
      },
      {
        name: { ko: '저주', en: 'Malediction' }, type: 'skill', cost: 1, target: 'enemy',
        vals: { base: 2, per: 2 }, upg: { per: 3 }, kw: ['discharge'], tips: ['venom'],
        calc: (cs, v) => { v.venT = v.base + v.per * charge(cs); },
        text: {
          ko: (v) => `[[방출]]: [[독]]을 ${v.base} 부여하고, 충전 1마다 ${v.per} 더 부여합니다.${paren(v.venT, true)}`,
          en: (v) => `[[Discharge]]: apply ${v.base} [[Venom]], plus ${v.per} per Charge.${paren(v.venT)}`,
        },
        play: (c, v) => { const n = spend(c); c.apply(c.target, 'venom', v.base + v.per * n); },
      },
    ],
  },
  {
    id: 'spellbook', pool: 'magician', rarity: 'common', art: 'moon',
    faces: [
      {
        name: { ko: '주문서', en: 'Spellbook' }, type: 'skill', cost: 1, target: 'self',
        vals: { ch: 3 }, upg: { ch: 4 }, tips: ['charge'],
        text: { ko: (v) => `[[충전]]을 ${v.ch} 얻습니다.`, en: (v) => `Gain ${v.ch} [[Charge]].` },
        play: (c, v) => c.charge(v.ch),
      },
      {
        name: { ko: '책장 폭풍', en: 'Page Storm' }, type: 'attack', cost: 1, target: 'all',
        vals: { per: 2 }, upg: { per: 3 }, kw: ['discharge'],
        calc: (cs, v) => { v.dmg = v.per * charge(cs); },
        text: {
          ko: (v) => `[[방출]]: 충전 1마다 모든 적에게 피해를 ${v.per} 줍니다.${paren(v.dmg, true)}`,
          en: (v) => `[[Discharge]]: deal ${v.per} damage to ALL enemies for each Charge.${paren(v.dmg)}`,
        },
        play: (c, v) => { const n = spend(c); if (n > 0) c.attackAll(v.per * n); },
      },
    ],
  },
  {
    id: 'nettle', pool: 'magician', rarity: 'common', art: 'leaf',
    faces: [
      {
        name: { ko: '쐐기풀', en: 'Nettle' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 6, ven: 2 }, upg: { dmg: 8, ven: 3 }, tips: ['venom'],
        text: {
          ko: (v) => `피해를 ${v.dmg} 줍니다. [[독]]을 ${v.ven} 부여합니다.`,
          en: (v) => `Deal ${v.dmg} damage. Apply ${v.ven} [[Venom]].`,
        },
        play: (c, v) => { c.attack(c.target, v.dmg); c.apply(c.target, 'venom', v.ven); },
      },
      {
        name: { ko: '가시 울타리', en: 'Bramble' }, type: 'skill', cost: 1, target: 'all',
        vals: { blk: 3 }, upg: { blk: 5 }, tips: ['weak'],
        text: {
          ko: (v) => `모든 적에게 [[약화]]를 1 부여합니다. 방어도를 ${v.blk} 얻습니다.`,
          en: (v) => `Apply 1 [[Weak]] to ALL enemies. Gain ${v.blk} Block.`,
        },
        play: (c, v) => { c.applyAll('weak', 1); c.block(v.blk); },
      },
    ],
  },
  {
    id: 'candleFlame', pool: 'magician', rarity: 'common', art: 'flame',
    faces: [
      {
        name: { ko: '촛불', en: 'Candle Flame' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 9 }, upg: { dmg: 12 },
        text: { ko: (v) => `피해를 ${v.dmg} 줍니다.`, en: (v) => `Deal ${v.dmg} damage.` },
        play: (c, v) => c.attack(c.target, v.dmg),
      },
      {
        name: { ko: '불씨 붙이기', en: 'Kindle' }, type: 'skill', cost: 0, target: 'self',
        vals: { ch: 1 }, upg: { ch: 2 }, tips: ['charge'],
        text: { ko: (v) => `[[충전]]을 ${v.ch} 얻습니다.`, en: (v) => `Gain ${v.ch} [[Charge]].` },
        play: (c, v) => c.charge(v.ch),
      },
    ],
  },
  {
    id: 'mirrorWard', pool: 'magician', rarity: 'common', art: 'mirror',
    onFlip: {
      vals: { n: 1 }, upg: { n: 2 },
      text: { ko: (v) => `뒤집힐 때: 충전을 ${v.n} 얻습니다.`, en: (v) => `On flip: gain ${v.n} Charge.` },
      run: (c, v) => c.charge(v.n),
    },
    faces: [
      {
        name: { ko: '거울 결계', en: 'Mirror Ward' }, type: 'skill', cost: 1, target: 'self',
        vals: { blk: 5 }, upg: { blk: 8 },
        text: { ko: (v) => `방어도를 ${v.blk} 얻습니다.`, en: (v) => `Gain ${v.blk} Block.` },
        play: (c, v) => c.block(v.blk),
      },
      {
        name: { ko: '거울 파편', en: 'Mirror Shard' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 6 }, upg: { dmg: 9 },
        text: { ko: (v) => `피해를 ${v.dmg} 줍니다.`, en: (v) => `Deal ${v.dmg} damage.` },
        play: (c, v) => c.attack(c.target, v.dmg),
      },
    ],
  },

  // ── 고급 10 ────────────────────────────────────────────────────────────
  {
    id: 'catalyst', pool: 'magician', rarity: 'uncommon', lock: 'A', art: 'crystal',
    faces: [
      {
        name: { ko: '촉매', en: 'Catalyst' }, type: 'skill', cost: 1, upgCost: 0, target: 'enemy',
        vals: {}, kw: ['vanish'], tips: ['venom'],
        text: { ko: () => '대상의 [[독]]을 2배로 만듭니다.', en: () => "Double the target's [[Venom]]." },
        play: (c) => { const n = c.target.st.venom ?? 0; if (n > 0) c.apply(c.target, 'venom', n); },
      },
      {
        name: { ko: '반응', en: 'Reaction' }, type: 'skill', cost: 1, target: 'enemy',
        vals: { ven: 4 }, upg: { ven: 6 }, tips: ['venom'],
        text: { ko: (v) => `[[독]]을 ${v.ven} 부여합니다.`, en: (v) => `Apply ${v.ven} [[Venom]].` },
        play: (c, v) => c.apply(c.target, 'venom', v.ven),
      },
    ],
  },
  {
    id: 'venomBurst', pool: 'magician', rarity: 'uncommon', art: 'drop',
    faces: [
      {
        name: { ko: '독 폭발', en: 'Venom Burst' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { mult: 1 }, upg: { mult: 1.5 }, tips: ['venom'],
        calc: (cs, v, inst, tgt) => { v.dmg = tgt ? Math.floor((tgt.st.venom ?? 0) * v.mult) : null; },
        text: {
          ko: (v) => `대상의 [[독]]${v.mult > 1 ? '의 1.5배' : ''}만큼 피해를 줍니다.${paren(v.dmg, true)}`,
          en: (v) => `Deal damage equal to ${v.mult > 1 ? '1.5× ' : ''}the target's [[Venom]].${paren(v.dmg)}`,
        },
        play: (c, v) => c.attack(c.target, Math.floor((c.target.st.venom ?? 0) * v.mult)),
      },
      {
        name: { ko: '감염', en: 'Infect' }, type: 'skill', cost: 1, target: 'enemy',
        vals: { ven: 3 }, upg: { ven: 4 }, tips: ['venom'],
        text: { ko: (v) => `[[독]]을 ${v.ven} 부여합니다. 카드를 1장 뽑습니다.`, en: (v) => `Apply ${v.ven} [[Venom]]. Draw 1 card.` },
        play: (c, v) => { c.apply(c.target, 'venom', v.ven); c.draw(1); },
      },
    ],
  },
  {
    id: 'chargedField', pool: 'magician', rarity: 'uncommon', art: 'orb',
    faces: [
      {
        name: { ko: '충전 결계', en: 'Charged Field' }, type: 'power', cost: 1, target: 'self',
        vals: { n: 1 }, upg: { n: 2 }, tips: ['chargedField'],
        text: { ko: (v) => `턴을 시작할 때 [[충전]]을 ${v.n} 얻습니다.`, en: (v) => `At the start of your turn, gain ${v.n} [[Charge]].` },
        play: (c, v) => c.apply('player', 'chargedField', v.n),
      },
      {
        name: { ko: '공명', en: 'Resonance' }, type: 'power', cost: 1, target: 'self',
        vals: { n: 3 }, upg: { n: 5 }, tips: ['resonance'],
        text: { ko: (v) => `[[방출]]할 때마다 방어도를 ${v.n} 얻습니다.`, en: (v) => `Whenever you [[Discharge]], gain ${v.n} Block.` },
        play: (c, v) => c.apply('player', 'resonance', v.n),
      },
    ],
  },
  {
    id: 'thunderclap', pool: 'magician', rarity: 'uncommon', art: 'bolt',
    faces: [
      {
        name: { ko: '천둥', en: 'Thunderclap' }, type: 'attack', cost: 2, target: 'all',
        vals: { dmg: 8 }, upg: { dmg: 11 }, tips: ['weak'],
        text: {
          ko: (v) => `모든 적에게 피해를 ${v.dmg} 주고 [[약화]]를 1 부여합니다.`,
          en: (v) => `Deal ${v.dmg} damage and apply 1 [[Weak]] to ALL enemies.`,
        },
        play: (c, v) => { c.attackAll(v.dmg); c.applyAll('weak', 1); },
      },
      {
        name: { ko: '정전기', en: 'Static' }, type: 'skill', cost: 1, target: 'all',
        vals: { ex: 2 }, upg: { ex: 3 }, tips: ['exposed', 'charge'],
        text: {
          ko: (v) => `모든 적에게 [[취약]]을 ${v.ex} 부여합니다. [[충전]]을 1 얻습니다.`,
          en: (v) => `Apply ${v.ex} [[Exposed]] to ALL enemies. Gain 1 [[Charge]].`,
        },
        play: (c, v) => { c.applyAll('exposed', v.ex); c.charge(1); },
      },
    ],
  },
  {
    id: 'arcaneMirror', pool: 'magician', rarity: 'uncommon', lock: 'B', art: 'mirror',
    faces: [
      {
        name: { ko: '비전 거울', en: 'Arcane Mirror' }, type: 'skill', cost: 1, target: 'self',
        vals: {}, upgCost: 0, tips: ['flip', 'charge'],
        text: {
          ko: () => '손패의 모든 카드를 [[뒤집고]], 뒤집힌 카드 1장마다 [[충전]]을 1 얻습니다.',
          en: () => '[[Flip]] every card in your hand. Gain 1 [[Charge]] for each card flipped.',
        },
        play: (c) => { const n = c.flipHand(); c.charge(n); },
      },
      {
        name: { ko: '굴절', en: 'Refraction' }, type: 'skill', cost: 1, target: 'self',
        vals: { ch: 2 }, upg: { ch: 3 }, tips: ['flip', 'charge'],
        text: {
          ko: (v) => `[[뒤집기]]를 1회 얻습니다. [[충전]]을 ${v.ch} 얻습니다.`,
          en: (v) => `Gain 1 [[Flip]]. Gain ${v.ch} [[Charge]].`,
        },
        play: (c, v) => { c.flips(1); c.charge(v.ch); },
      },
    ],
  },
  {
    id: 'overcharge', pool: 'magician', rarity: 'uncommon', art: 'star',
    faces: [
      {
        name: { ko: '과충전', en: 'Overcharge' }, type: 'skill', cost: 0, target: 'self',
        vals: { ch: 4 }, upg: { ch: 5 }, tips: ['charge'],
        text: {
          ko: (v) => `[[충전]]을 ${v.ch} 얻습니다. 손에 [[현기증]]을 1장 넣습니다.`,
          en: (v) => `Gain ${v.ch} [[Charge]]. Add a [[Vertigo]] to your hand.`,
        },
        play: (c, v) => { c.charge(v.ch); c.addCard('vertigo', 'hand'); },
      },
      {
        name: { ko: '방전', en: 'Overload' }, type: 'attack', cost: 2, target: 'enemy',
        vals: { per: 4 }, upg: { per: 5 }, kw: ['discharge'],
        calc: (cs, v) => { v.dmg = v.per * charge(cs); },
        text: {
          ko: (v) => `[[방출]]: 충전 1마다 피해를 ${v.per} 줍니다.${paren(v.dmg, true)}`,
          en: (v) => `[[Discharge]]: deal ${v.per} damage for each Charge, in one hit.${paren(v.dmg)}`,
        },
        play: (c, v) => { const n = spend(c); if (n > 0) c.attack(c.target, v.per * n); },
      },
    ],
  },
  {
    id: 'plague', pool: 'magician', rarity: 'uncommon', lock: 'A', art: 'skull',
    faces: [
      {
        name: { ko: '역병', en: 'Plague' }, type: 'power', cost: 2, upgCost: 1, target: 'self',
        vals: {}, tips: ['plague'],
        text: { ko: () => '턴이 끝날 때 모든 적에게 [[독]]을 1 부여합니다.', en: () => 'At the end of your turn, apply 1 [[Venom]] to ALL enemies.' },
        play: (c) => c.apply('player', 'plague', 1),
      },
      {
        name: { ko: '마름병', en: 'Blight' }, type: 'skill', cost: 1, target: 'all',
        vals: { ven: 2 }, upg: { ven: 3 }, tips: ['venom', 'charge'],
        text: {
          ko: (v) => `모든 적에게 [[독]]을 ${v.ven} 부여합니다. [[충전]]을 1 얻습니다.`,
          en: (v) => `Apply ${v.ven} [[Venom]] to ALL enemies. Gain 1 [[Charge]].`,
        },
        play: (c, v) => { c.applyAll('venom', v.ven); c.charge(1); },
      },
    ],
  },
  {
    id: 'leyLine', pool: 'magician', rarity: 'uncommon', art: 'lemniscate',
    faces: [
      {
        name: { ko: '지맥', en: 'Ley Line' }, type: 'skill', cost: 1, target: 'self',
        vals: { ch: 2 }, upg: { ch: 3 }, tips: ['charge'],
        text: {
          ko: (v) => `다음 턴에 에너지를 1 더 얻습니다. [[충전]]을 ${v.ch} 얻습니다.`,
          en: (v) => `Next turn, gain 1 extra Energy. Gain ${v.ch} [[Charge]].`,
        },
        play: (c, v) => { c.player.nextEnergy += 1; c.charge(v.ch); },
      },
      {
        name: { ko: '끌어 쓰기', en: 'Tap the Line' }, type: 'skill', cost: 0, target: 'self',
        vals: { per: 2 }, kw: ['discharge'],
        calc: (cs, v) => { v.en = Math.min(3, Math.floor(charge(cs) / v.per)); },
        text: {
          ko: (v) => `[[방출]]: 충전 ${v.per}마다 에너지를 1 얻습니다(최대 3).${paren(v.en, true)}`,
          en: (v) => `[[Discharge]]: gain 1 Energy for every ${v.per} Charge (up to 3).${paren(v.en)}`,
        },
        upg: { per: 1 },
        play: (c, v) => { const n = spend(c); const e = Math.min(3, Math.floor(n / v.per)); if (e > 0) c.energy(e); },
      },
    ],
  },
  {
    id: 'runeCircle', pool: 'magician', rarity: 'uncommon', art: 'wheel',
    faces: [
      {
        name: { ko: '룬의 원', en: 'Rune Circle' }, type: 'skill', cost: 1, target: 'self',
        vals: { blk: 7 }, upg: { blk: 9 }, tips: ['charge'],
        text: { ko: (v) => `방어도를 ${v.blk} 얻습니다. [[충전]]을 2 얻습니다.`, en: (v) => `Gain ${v.blk} Block. Gain 2 [[Charge]].` },
        play: (c, v) => { c.block(v.blk); c.charge(2); },
      },
      {
        name: { ko: '룬 파열', en: 'Rune Rupture' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 10 }, upg: { dmg: 13 }, kw: ['discharge'],
        calc: (cs, v) => { v.hits = charge(cs) >= 3 ? 2 : 1; },
        text: {
          ko: (v) => `[[방출]]: 피해를 ${v.dmg} 줍니다. 충전을 3 이상 썼다면 한 번 더 줍니다.`,
          en: (v) => `[[Discharge]]: deal ${v.dmg} damage. If you spent 3 or more Charge, do it twice.`,
        },
        play: (c, v) => { const n = spend(c); c.attack(c.target, v.dmg, n >= 3 ? 2 : 1); },
      },
    ],
  },
  {
    id: 'starfall', pool: 'magician', rarity: 'uncommon', lock: 'B', art: 'star',
    faces: [
      {
        name: { ko: '별똥비', en: 'Starfall' }, type: 'attack', cost: 2, target: 'none',
        vals: { dmg: 3, times: 6 }, upg: { times: 8 },
        text: {
          ko: (v) => `무작위 적에게 피해를 ${v.dmg}씩 ${v.times}번 줍니다.`,
          en: (v) => `Deal ${v.dmg} damage to a random enemy ${v.times} times.`,
        },
        play: (c, v) => c.attackRandom(v.dmg, v.times),
      },
      {
        name: { ko: '소원 빌기', en: 'Wish Upon' }, type: 'skill', cost: 1, target: 'self',
        vals: { ch: 3 }, upg: { ch: 4 }, tips: ['charge'],
        text: { ko: (v) => `[[충전]]을 ${v.ch} 얻습니다. 카드를 1장 뽑습니다.`, en: (v) => `Gain ${v.ch} [[Charge]]. Draw 1 card.` },
        play: (c, v) => { c.charge(v.ch); c.draw(1); },
      },
    ],
  },

  // ── 희귀 4 ─────────────────────────────────────────────────────────────
  {
    id: 'arcaneMastery', pool: 'magician', rarity: 'rare', art: 'crown',
    faces: [
      {
        name: { ko: '비전 통달', en: 'Arcane Mastery' }, type: 'power', cost: 2, upgCost: 1, target: 'self',
        vals: {}, tips: ['mastery', 'charge'],
        text: {
          ko: () => '턴이 끝날 때 모든 적에게 지닌 [[충전]]만큼 피해를 줍니다.',
          en: () => 'At the end of your turn, deal damage equal to your [[Charge]] to ALL enemies.',
        },
        play: (c) => c.apply('player', 'mastery', 1),
      },
      {
        name: { ko: '대설계', en: 'Grand Design' }, type: 'power', cost: 2, upgCost: 1, target: 'self',
        vals: {}, tips: ['grandDesign'],
        text: {
          ko: () => '충전을 3 이상 [[방출]]할 때마다 에너지를 1 얻습니다.',
          en: () => 'Whenever you [[Discharge]] 3 or more Charge, gain 1 Energy.',
        },
        play: (c) => c.apply('player', 'grandDesign', 1),
      },
    ],
  },
  {
    id: 'supernova', pool: 'magician', rarity: 'rare', lock: 'B', art: 'sun',
    faces: [
      {
        name: { ko: '초신성', en: 'Supernova' }, type: 'attack', cost: 'X', target: 'all',
        vals: { dmg: 6 }, upg: { dmg: 8 }, tips: ['charge'],
        text: {
          ko: (v) => `모든 적에게 피해를 ${v.dmg}씩 X번 줍니다. [[충전]]을 X 얻습니다.`,
          en: (v) => `Deal ${v.dmg} damage to ALL enemies X times. Gain X [[Charge]].`,
        },
        play: (c, v) => { const x = v.x ?? 0; if (x > 0) { c.attackAll(v.dmg, x); c.charge(x); } },
      },
      {
        name: { ko: '붕괴', en: 'Collapse' }, type: 'attack', cost: 2, target: 'all',
        vals: { per: 5 }, upg: { per: 7 }, kw: ['discharge'],
        calc: (cs, v) => { v.dmg = v.per * charge(cs); },
        text: {
          ko: (v) => `[[방출]]: 충전 1마다 모든 적에게 피해를 ${v.per} 줍니다.${paren(v.dmg, true)}`,
          en: (v) => `[[Discharge]]: deal ${v.per} damage to ALL enemies for each Charge.${paren(v.dmg)}`,
        },
        play: (c, v) => { const n = spend(c); if (n > 0) c.attackAll(v.per * n); },
      },
    ],
  },
  {
    id: 'deathcap', pool: 'magician', rarity: 'rare', lock: 'A', art: 'serpent',
    faces: [
      {
        name: { ko: '광대버섯', en: 'Deathcap' }, type: 'skill', cost: 1, target: 'enemy',
        vals: { ven: 10 }, upg: { ven: 14 }, kw: ['vanish'], tips: ['venom'],
        text: { ko: (v) => `[[독]]을 ${v.ven} 부여합니다.`, en: (v) => `Apply ${v.ven} [[Venom]].` },
        play: (c, v) => c.apply(c.target, 'venom', v.ven),
      },
      {
        name: { ko: '포자 터뜨리기', en: 'Spore Bloom' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { mult: 2 }, upg: { mult: 3 }, tips: ['venom'],
        calc: (cs, v, inst, tgt) => { v.dmg = tgt ? (tgt.st.venom ?? 0) * v.mult : null; },
        text: {
          ko: (v) => `대상의 [[독]]의 ${v.mult}배만큼 피해를 줍니다.${paren(v.dmg, true)}`,
          en: (v) => `Deal damage equal to ${v.mult}× the target's [[Venom]].${paren(v.dmg)}`,
        },
        play: (c, v) => c.attack(c.target, (c.target.st.venom ?? 0) * v.mult),
      },
    ],
  },
  {
    id: 'infinityLoop', pool: 'magician', rarity: 'rare', art: 'lemniscate',
    faces: [
      {
        name: { ko: '무한의 고리', en: 'Infinity Loop' }, type: 'power', cost: 2, upgCost: 1, target: 'self',
        vals: {}, tips: ['infinityLoop', 'charge'],
        text: { ko: () => '카드가 뒤집힐 때마다 [[충전]]을 1 얻습니다.', en: () => 'Whenever a card flips, gain 1 [[Charge]].' },
        play: (c) => c.apply('player', 'infinityLoop', 1),
      },
      {
        name: { ko: '연쇄', en: 'Cascade' }, type: 'power', cost: 2, upgCost: 1, target: 'self',
        vals: {}, tips: ['cascade'],
        text: { ko: () => '[[방출]]할 때마다 카드를 2장 뽑습니다.', en: () => 'Whenever you [[Discharge]], draw 2 cards.' },
        play: (c) => c.apply('player', 'cascade', 2),
      },
    ],
  },
];
