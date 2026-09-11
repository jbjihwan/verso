// 바보(The Fool) 카드 — 정체성: 뒤집기 엔진("뒤집힐 때", 추가 뒤집기, 이번 턴 뒤집힌 수, 역방향 수)
// 텍스트의 [[...]] 는 키워드 강조. calc 로 만든 표시용 값(hits 등)은 전투 중에만 존재한다.
const sfx = (n) => (n > 1 ? 's' : '');
const atk = (c, v) => c.attack(c.target, v.dmg);
const flipOne = { from: 'hand', count: 1, filter: 'flippable', prompt: 'flip' };

export const STATUSES = {
  tumbler: {
    kind: 'power', icon: 'feather', name: { ko: '재주꾼', en: 'Tumbler' },
    desc: { ko: (n) => `카드가 뒤집힐 때마다 방어도를 ${n} 얻습니다.`, en: (n) => `Whenever a card flips, gain ${n} Block.` },
    hooks: { flip(ctx, owner, n) { ctx.gainBlock('player', n); } },
  },
  acrobat: {
    kind: 'power', icon: 'star4', name: { ko: '곡예사', en: 'Acrobat' },
    desc: { ko: (n) => `카드가 뒤집힐 때마다 무작위 적에게 피해를 ${n} 줍니다.`, en: (n) => `Whenever a card flips, deal ${n} damage to a random enemy.` },
    hooks: { flip(ctx, owner, n) { const e = ctx.randomEnemy(); if (e) ctx.hit(e, n); } },
  },
  sleight: {
    kind: 'power', icon: 'flip', name: { ko: '손재주', en: 'Sleight of Hand' },
    desc: { ko: (n) => `턴을 시작할 때 뒤집기를 ${n}회 얻습니다.`, en: (n) => `At the start of your turn, gain ${n} Flip${sfx(n)}.` },
    hooks: { turnStart(ctx, owner, n) { ctx.flips(n); } },
  },
  palming: {
    kind: 'power', icon: 'shield', name: { ko: '감추기', en: 'Palming' },
    desc: { ko: (n) => `턴을 시작할 때 방어도를 ${n} 얻습니다.`, en: (n) => `At the start of your turn, gain ${n} Block.` },
    hooks: { turnStart(ctx, owner, n) { ctx.gainBlock('player', n); } },
  },
  infiniteJest: {
    kind: 'power', icon: 'bolt', name: { ko: '끝없는 농담', en: 'Infinite Jest' },
    desc: { ko: (n) => `역방향 면을 쓸 때마다 카드를 ${n}장 뽑습니다.`, en: (n) => `Whenever you play a Reversed face, draw ${n} card${sfx(n)}.` },
    hooks: { cardPlayed(ctx, owner, n, inst, face, fi) { if (fi === 1) ctx.draw(n); } },
  },
  ovation: {
    kind: 'power', icon: 'sun', name: { ko: '기립 박수', en: 'Standing Ovation' },
    desc: { ko: (n) => `정방향 면을 쓸 때마다 방어도를 ${2 * n} 얻습니다.`, en: (n) => `Whenever you play an Upright face, gain ${2 * n} Block.` },
    hooks: { cardPlayed(ctx, owner, n, inst, face, fi) { if (fi === 0) ctx.gainBlock('player', 2 * n); } },
  },
  hound: {
    kind: 'power', icon: 'sword', name: { ko: '충직한 사냥개', en: 'Loyal Hound' },
    desc: { ko: (n) => `턴이 끝날 때 무작위 적에게 피해를 ${n} 줍니다.`, en: (n) => `At the end of your turn, deal ${n} damage to a random enemy.` },
    hooks: { turnEnd(ctx, owner, n) { const e = ctx.randomEnemy(); if (e) ctx.hit(e, n); } },
  },
  guardDog: {
    kind: 'power', icon: 'castle', name: { ko: '집 지키는 개', en: 'Guard Dog' },
    desc: { ko: (n) => `턴이 끝날 때 방어도를 ${n} 얻습니다.`, en: (n) => `At the end of your turn, gain ${n} Block.` },
    hooks: { turnEnd(ctx, owner, n) { ctx.gainBlock('player', n); } },
  },
};

export const CARDS = [
  // ── 시작 카드 ──────────────────────────────────────────────────────────
  {
    id: 'somersault', pool: 'fool', rarity: 'basic', art: 'wheel',
    faces: [
      {
        name: { ko: '공중제비', en: 'Somersault' }, type: 'skill', cost: 1, target: 'self',
        vals: { blk: 6 }, upg: { blk: 9 }, tips: ['flip'],
        text: {
          ko: (v) => `방어도를 ${v.blk} 얻습니다. 손패의 카드 1장을 [[뒤집습니다]].`,
          en: (v) => `Gain ${v.blk} Block. [[Flip]] a card in your hand.`,
        },
        play: (c, v) => { c.block(v.blk); c.choose(flipOne, 'flip'); },
        resume: { flip: (c, v, picked) => { for (const i of picked) c.flip(i); } },
      },
      {
        name: { ko: '구르기', en: 'Tumble' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 8 }, upg: { dmg: 11 },
        text: { ko: (v) => `피해를 ${v.dmg} 줍니다.`, en: (v) => `Deal ${v.dmg} damage.` },
        play: atk,
      },
    ],
  },
  {
    id: 'wager', pool: 'fool', rarity: 'basic', art: 'coin',
    faces: [
      {
        name: { ko: '내기', en: 'Wager' }, type: 'skill', cost: 0, target: 'self',
        vals: { n: 1 }, upg: { n: 2 }, tips: ['flip'],
        text: {
          ko: (v) => `[[뒤집기]]를 1회 얻습니다. 카드를 ${v.n}장 뽑습니다.`,
          en: (v) => `Gain 1 [[Flip]]. Draw ${v.n} card${sfx(v.n)}.`,
        },
        play: (c, v) => { c.flips(1); c.draw(v.n); },
      },
      {
        name: { ko: '배당', en: 'Payout' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 3 }, upg: { dmg: 4 },
        calc: (cs, v) => { v.hits = cs.cnt.flips; },
        text: {
          ko: (v) => `이번 턴에 뒤집힌 카드 1장마다 피해를 ${v.dmg} 줍니다.${v.hits != null ? ` (${v.hits}회)` : ''}`,
          en: (v) => `Deal ${v.dmg} damage for each card flipped this turn.${v.hits != null ? ` (${v.hits}×)` : ''}`,
        },
        play: (c, v) => c.attack(c.target, v.dmg, v.hits ?? c.cs.cnt.flips),
      },
    ],
  },

  // ── 일반 12 ────────────────────────────────────────────────────────────
  {
    id: 'pirouette', pool: 'fool', rarity: 'common', art: 'spiral',
    faces: [
      {
        name: { ko: '피루엣', en: 'Pirouette' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 8 }, upg: { dmg: 11 },
        text: { ko: (v) => `피해를 ${v.dmg} 줍니다.`, en: (v) => `Deal ${v.dmg} damage.` },
        play: atk,
      },
      {
        name: { ko: '회오리', en: 'Whirl' }, type: 'attack', cost: 1, target: 'all',
        vals: { dmg: 4 }, upg: { dmg: 6 },
        text: { ko: (v) => `모든 적에게 피해를 ${v.dmg} 줍니다.`, en: (v) => `Deal ${v.dmg} damage to ALL enemies.` },
        play: (c, v) => c.attackAll(v.dmg),
      },
    ],
  },
  {
    id: 'cartwheel', pool: 'fool', rarity: 'common', art: 'wheel',
    onFlip: {
      vals: { n: 2 }, upg: { n: 3 },
      text: { ko: (v) => `뒤집힐 때: 방어도를 ${v.n} 얻습니다.`, en: (v) => `On flip: gain ${v.n} Block.` },
      run: (c, v) => c.gainBlock('player', v.n),
    },
    faces: [
      {
        name: { ko: '옆돌기', en: 'Cartwheel' }, type: 'skill', cost: 1, target: 'self',
        vals: { blk: 7 }, upg: { blk: 10 },
        text: { ko: (v) => `방어도를 ${v.blk} 얻습니다.`, en: (v) => `Gain ${v.blk} Block.` },
        play: (c, v) => c.block(v.blk),
      },
      {
        name: { ko: '공중돌기', en: 'Handspring' }, type: 'skill', cost: 1, target: 'self',
        vals: { blk: 4 }, upg: { blk: 6 },
        text: { ko: (v) => `방어도를 ${v.blk} 얻습니다. 카드를 1장 뽑습니다.`, en: (v) => `Gain ${v.blk} Block. Draw 1 card.` },
        play: (c, v) => { c.block(v.blk); c.draw(1); },
      },
    ],
  },
  {
    id: 'jest', pool: 'fool', rarity: 'common', art: 'mask',
    faces: [
      {
        name: { ko: '익살', en: 'Jest' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 6, wk: 1 }, upg: { dmg: 8, wk: 2 }, tips: ['weak'],
        text: {
          ko: (v) => `피해를 ${v.dmg} 줍니다. [[약화]]를 ${v.wk} 부여합니다.`,
          en: (v) => `Deal ${v.dmg} damage. Apply ${v.wk} [[Weak]].`,
        },
        play: (c, v) => { c.attack(c.target, v.dmg); c.apply(c.target, 'weak', v.wk); },
      },
      {
        name: { ko: '야유', en: 'Jeer' }, type: 'skill', cost: 1, target: 'enemy',
        vals: { ex: 2 }, upg: { ex: 3 }, tips: ['exposed'],
        text: { ko: (v) => `[[취약]]을 ${v.ex} 부여합니다.`, en: (v) => `Apply ${v.ex} [[Exposed]].` },
        play: (c, v) => c.apply(c.target, 'exposed', v.ex),
      },
    ],
  },
  {
    id: 'coinToss', pool: 'fool', rarity: 'common', art: 'coin',
    faces: [
      {
        name: { ko: '앞면', en: 'Heads' }, type: 'skill', cost: 0, target: 'self',
        vals: { blk: 3 }, upg: { blk: 5 }, tips: ['flip'],
        text: {
          ko: (v) => `[[뒤집기]]를 1회 얻습니다. 방어도를 ${v.blk} 얻습니다.`,
          en: (v) => `Gain 1 [[Flip]]. Gain ${v.blk} Block.`,
        },
        play: (c, v) => { c.flips(1); c.block(v.blk); },
      },
      {
        name: { ko: '뒷면', en: 'Tails' }, type: 'attack', cost: 0, target: 'none',
        vals: { dmg: 5 }, upg: { dmg: 8 },
        text: { ko: (v) => `무작위 적에게 피해를 ${v.dmg} 줍니다.`, en: (v) => `Deal ${v.dmg} damage to a random enemy.` },
        play: (c, v) => c.attackRandom(v.dmg),
      },
    ],
  },
  {
    id: 'pratfall', pool: 'fool', rarity: 'common', art: 'bell',
    faces: [
      {
        name: { ko: '엉덩방아', en: 'Pratfall' }, type: 'attack', cost: 2, target: 'enemy',
        vals: { dmg: 16 }, upg: { dmg: 21 },
        text: { ko: (v) => `피해를 ${v.dmg} 줍니다.`, en: (v) => `Deal ${v.dmg} damage.` },
        play: atk,
      },
      {
        name: { ko: '툭툭 털기', en: 'Dust Off' }, type: 'skill', cost: 0, target: 'self',
        vals: { blk: 4 }, upg: { blk: 6 },
        text: { ko: (v) => `방어도를 ${v.blk} 얻습니다.`, en: (v) => `Gain ${v.blk} Block.` },
        play: (c, v) => c.block(v.blk),
      },
    ],
  },
  {
    id: 'mirrorStep', pool: 'fool', rarity: 'common', art: 'mirror',
    faces: [
      {
        name: { ko: '거울 걸음', en: 'Mirror Step' }, type: 'skill', cost: 1, target: 'self',
        vals: { blk: 5 }, upg: { blk: 7 }, tips: ['flip'],
        text: {
          ko: (v) => `방어도를 ${v.blk} 얻습니다. 손패의 모든 카드를 [[뒤집습니다]].`,
          en: (v) => `Gain ${v.blk} Block. [[Flip]] every card in your hand.`,
        },
        play: (c, v) => { c.block(v.blk); c.flipHand(); },
      },
      {
        name: { ko: '반사', en: 'Reflection' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 3 }, upg: { dmg: 4 },
        calc: (cs, v) => { v.hits = cs.piles.hand.filter((i) => i.rev).length; },
        text: {
          ko: (v) => `손패의 역방향 카드 1장마다 피해를 ${v.dmg} 줍니다.${v.hits != null ? ` (${v.hits}회)` : ''}`,
          en: (v) => `Deal ${v.dmg} damage for each Reversed card in your hand.${v.hits != null ? ` (${v.hits}×)` : ''}`,
        },
        play: (c, v) => c.attack(c.target, v.dmg, v.hits ?? c.countRev('hand')),
      },
    ],
  },
  {
    id: 'bindle', pool: 'fool', rarity: 'common', art: 'bindle',
    faces: [
      {
        name: { ko: '봇짐', en: 'Bindle' }, type: 'skill', cost: 1, target: 'self',
        vals: { n: 2 }, upg: { n: 3 },
        text: { ko: (v) => `카드를 ${v.n}장 뽑습니다.`, en: (v) => `Draw ${v.n} cards.` },
        play: (c, v) => c.draw(v.n),
      },
      {
        name: { ko: '짐 풀기', en: 'Unpack' }, type: 'skill', cost: 0, target: 'self',
        vals: { n: 1 }, upg: { n: 2 }, tips: ['flip'],
        text: {
          ko: (v) => `카드를 ${v.n}장 뽑습니다. [[뒤집기]]를 1회 얻습니다.`,
          en: (v) => `Draw ${v.n} card${sfx(v.n)}. Gain 1 [[Flip]].`,
        },
        play: (c, v) => { c.draw(v.n); c.flips(1); },
      },
    ],
  },
  {
    id: 'headstand', pool: 'fool', rarity: 'common', art: 'hand',
    onFlip: {
      vals: { n: 3 }, upg: { n: 4 },
      text: { ko: (v) => `뒤집힐 때: 무작위 적에게 피해를 ${v.n} 줍니다.`, en: (v) => `On flip: deal ${v.n} damage to a random enemy.` },
      run: (c, v) => { const e = c.randomEnemy(); if (e) c.hit(e, v.n); },
    },
    faces: [
      {
        name: { ko: '물구나무', en: 'Headstand' }, type: 'skill', cost: 1, target: 'self',
        vals: { blk: 6 }, upg: { blk: 9 },
        text: { ko: (v) => `방어도를 ${v.blk} 얻습니다.`, en: (v) => `Gain ${v.blk} Block.` },
        play: (c, v) => c.block(v.blk),
      },
      {
        name: { ko: '뒤엎기', en: 'Upend' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 7 }, upg: { dmg: 10 },
        text: { ko: (v) => `피해를 ${v.dmg} 줍니다.`, en: (v) => `Deal ${v.dmg} damage.` },
        play: atk,
      },
    ],
  },
  {
    id: 'flourish', pool: 'fool', rarity: 'common', art: 'feather',
    faces: [
      {
        name: { ko: '꾸밈 동작', en: 'Flourish' }, type: 'skill', cost: 1, target: 'self',
        vals: { n: 2 }, upg: { n: 3 }, tips: ['flip'],
        text: {
          ko: (v) => `[[뒤집기]]를 ${v.n}회 얻습니다. 카드를 1장 뽑습니다.`,
          en: (v) => `Gain ${v.n} [[Flips]]. Draw 1 card.`,
        },
        play: (c, v) => { c.flips(v.n); c.draw(1); },
      },
      {
        name: { ko: '인사', en: 'Bow' }, type: 'skill', cost: 0, target: 'self',
        vals: { blk: 4 }, upg: { blk: 6 },
        text: { ko: (v) => `방어도를 ${v.blk} 얻습니다.`, en: (v) => `Gain ${v.blk} Block.` },
        play: (c, v) => c.block(v.blk),
      },
    ],
  },
  {
    id: 'slapstick', pool: 'fool', rarity: 'common', art: 'quill',
    faces: [
      {
        name: { ko: '슬랩스틱', en: 'Slapstick' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 4 }, upg: { dmg: 5 },
        text: { ko: (v) => `피해를 ${v.dmg}씩 2번 줍니다.`, en: (v) => `Deal ${v.dmg} damage twice.` },
        play: (c, v) => c.attack(c.target, v.dmg, 2),
      },
      {
        name: { ko: '파이 던지기', en: 'Custard Pie' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 7 }, upg: { dmg: 9 }, tips: ['weak'],
        text: {
          ko: (v) => `피해를 ${v.dmg} 줍니다. [[약화]]를 1 부여합니다.`,
          en: (v) => `Deal ${v.dmg} damage. Apply 1 [[Weak]].`,
        },
        play: (c, v) => { c.attack(c.target, v.dmg); c.apply(c.target, 'weak', 1); },
      },
    ],
  },
  {
    id: 'wanderlust', pool: 'fool', rarity: 'common', art: 'lantern',
    faces: [
      {
        name: { ko: '방랑벽', en: 'Wanderlust' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 9 }, upg: { dmg: 12 },
        text: { ko: (v) => `피해를 ${v.dmg} 줍니다.`, en: (v) => `Deal ${v.dmg} damage.` },
        play: atk,
      },
      {
        name: { ko: '쉼터', en: 'Wayside' }, type: 'skill', cost: 1, target: 'self',
        vals: { blk: 6 }, upg: { blk: 8 }, tips: ['flip'],
        text: {
          ko: (v) => `방어도를 ${v.blk} 얻습니다. [[뒤집기]]를 1회 얻습니다.`,
          en: (v) => `Gain ${v.blk} Block. Gain 1 [[Flip]].`,
        },
        play: (c, v) => { c.block(v.blk); c.flips(1); },
      },
    ],
  },
  {
    id: 'tossUp', pool: 'fool', rarity: 'common', art: 'orb',
    faces: [
      {
        name: { ko: '공중 던지기', en: 'Toss Up' }, type: 'skill', cost: 1, upgCost: 0, target: 'self',
        vals: {},
        text: { ko: () => '버린 더미의 카드 1장을 손으로 가져옵니다.', en: () => 'Put a card from your discard pile into your hand.' },
        play: (c) => c.choose({ from: 'discard', count: 1, prompt: 'pick' }, 'take'),
        resume: { take: (c, v, picked) => { for (const i of picked) c.moveToHand(i); } },
      },
      {
        name: { ko: '받기', en: 'Catch' }, type: 'skill', cost: 0, target: 'self',
        vals: { blk: 3 }, upg: { blk: 5 },
        text: { ko: (v) => `방어도를 ${v.blk} 얻습니다. 카드를 1장 뽑습니다.`, en: (v) => `Gain ${v.blk} Block. Draw 1 card.` },
        play: (c, v) => { c.block(v.blk); c.draw(1); },
      },
    ],
  },

  // ── 고급 10 ────────────────────────────────────────────────────────────
  {
    id: 'tumbler', pool: 'fool', rarity: 'uncommon', lock: 'A', art: 'lemniscate',
    faces: [
      {
        name: { ko: '재주꾼', en: 'Tumbler' }, type: 'power', cost: 1, target: 'self',
        vals: { n: 1 }, upg: { n: 2 }, tips: ['tumbler'],
        text: { ko: (v) => `카드가 뒤집힐 때마다 방어도를 ${v.n} 얻습니다.`, en: (v) => `Whenever a card flips, gain ${v.n} Block.` },
        play: (c, v) => c.apply('player', 'tumbler', v.n),
      },
      {
        name: { ko: '곡예사', en: 'Acrobat' }, type: 'power', cost: 1, target: 'self',
        vals: { n: 1 }, upg: { n: 2 }, tips: ['acrobat'],
        text: { ko: (v) => `카드가 뒤집힐 때마다 무작위 적에게 피해를 ${v.n} 줍니다.`, en: (v) => `Whenever a card flips, deal ${v.n} damage to a random enemy.` },
        play: (c, v) => c.apply('player', 'acrobat', v.n),
      },
    ],
  },
  {
    id: 'coinRain', pool: 'fool', rarity: 'uncommon', art: 'pentacle',
    faces: [
      {
        name: { ko: '동전 비', en: 'Coin Rain' }, type: 'attack', cost: 1, target: 'none',
        vals: { dmg: 3, times: 4 }, upg: { times: 5 },
        text: {
          ko: (v) => `무작위 적에게 피해를 ${v.dmg}씩 ${v.times}번 줍니다.`,
          en: (v) => `Deal ${v.dmg} damage to a random enemy ${v.times} times.`,
        },
        play: (c, v) => c.attackRandom(v.dmg, v.times),
      },
      {
        name: { ko: '팁 항아리', en: 'Tip Jar' }, type: 'skill', cost: 1, target: 'self',
        vals: { per: 3 }, upg: { per: 4 },
        calc: (cs, v) => { v.blkT = v.per * cs.cnt.flips; },
        text: {
          ko: (v) => `이번 턴에 뒤집힌 카드 1장마다 방어도를 ${v.per} 얻습니다.${v.blkT != null ? ` (${v.blkT})` : ''}`,
          en: (v) => `Gain ${v.per} Block for each card flipped this turn.${v.blkT != null ? ` (${v.blkT})` : ''}`,
        },
        play: (c, v) => c.block(v.blkT ?? v.per * c.cs.cnt.flips),
      },
    ],
  },
  {
    id: 'topsyTurvy', pool: 'fool', rarity: 'uncommon', art: 'crescent2',
    faces: [
      {
        name: { ko: '뒤죽박죽', en: 'Topsy-Turvy' }, type: 'skill', cost: 1, upgCost: 0, target: 'self',
        vals: {}, tips: ['flip'],
        text: {
          ko: () => '손패의 모든 카드를 [[뒤집습니다]]. 카드를 1장 뽑습니다.',
          en: () => '[[Flip]] every card in your hand. Draw 1 card.',
        },
        play: (c) => { c.flipHand(); c.draw(1); },
      },
      {
        name: { ko: '곤두박질', en: 'Headlong' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 6 }, upg: { dmg: 8 },
        calc: (cs, v) => { if (cs.cnt.flips >= 3) v.dmg *= 2; },
        text: {
          ko: (v) => `피해를 ${v.dmg} 줍니다. 이번 턴에 카드가 3장 이상 뒤집혔다면 피해가 2배입니다.`,
          en: (v) => `Deal ${v.dmg} damage. Double if 3 or more cards were flipped this turn.`,
        },
        play: atk,
      },
    ],
  },
  {
    id: 'swagger', pool: 'fool', rarity: 'uncommon', art: 'crown',
    faces: [
      {
        name: { ko: '으스대기', en: 'Swagger' }, type: 'skill', cost: 1, target: 'self',
        vals: { n: 2 }, upg: { n: 3 }, kw: ['vanish'], tips: ['might'],
        text: { ko: (v) => `[[힘]]을 ${v.n} 얻습니다.`, en: (v) => `Gain ${v.n} [[Might]].` },
        play: (c, v) => c.apply('player', 'might', v.n),
      },
      {
        name: { ko: '비틀거리게 하기', en: 'Stagger' }, type: 'skill', cost: 1, target: 'all',
        vals: { n: 1 }, upg: { n: 2 }, tips: ['weak', 'exposed'],
        text: {
          ko: (v) => `모든 적에게 [[약화]]와 [[취약]]을 ${v.n}씩 부여합니다.`,
          en: (v) => `Apply ${v.n} [[Weak]] and ${v.n} [[Exposed]] to ALL enemies.`,
        },
        play: (c, v) => { c.applyAll('weak', v.n); c.applyAll('exposed', v.n); },
      },
    ],
  },
  {
    id: 'sleight', pool: 'fool', rarity: 'uncommon', art: 'cards',
    faces: [
      {
        name: { ko: '손재주', en: 'Sleight of Hand' }, type: 'power', cost: 1, upgCost: 0, target: 'self',
        vals: {}, tips: ['sleight'],
        text: { ko: () => '턴을 시작할 때 [[뒤집기]]를 1회 얻습니다.', en: () => 'At the start of your turn, gain 1 [[Flip]].' },
        play: (c) => c.apply('player', 'sleight', 1),
      },
      {
        name: { ko: '감추기', en: 'Palming' }, type: 'power', cost: 1, target: 'self',
        vals: { n: 3 }, upg: { n: 5 }, tips: ['palming'],
        text: { ko: (v) => `턴을 시작할 때 방어도를 ${v.n} 얻습니다.`, en: (v) => `At the start of your turn, gain ${v.n} Block.` },
        play: (c, v) => c.apply('player', 'palming', v.n),
      },
    ],
  },
  {
    id: 'fallingStar', pool: 'fool', rarity: 'uncommon', art: 'star',
    faces: [
      {
        name: { ko: '떨어지는 별', en: 'Falling Star' }, type: 'attack', cost: 2, target: 'enemy',
        vals: { dmg: 18 }, upg: { dmg: 24 },
        text: { ko: (v) => `피해를 ${v.dmg} 줍니다.`, en: (v) => `Deal ${v.dmg} damage.` },
        play: atk,
      },
      {
        name: { ko: '소원', en: 'Wish' }, type: 'skill', cost: 0, target: 'self',
        vals: { n: 2 }, upg: { n: 3 }, kw: ['vanish'],
        text: { ko: (v) => `카드를 ${v.n}장 뽑습니다.`, en: (v) => `Draw ${v.n} cards.` },
        play: (c, v) => c.draw(v.n),
      },
    ],
  },
  {
    id: 'dogsBark', pool: 'fool', rarity: 'uncommon', art: 'dog',
    faces: [
      {
        name: { ko: '짖기', en: 'Bark' }, type: 'skill', cost: 1, target: 'all',
        vals: { blk: 4 }, upg: { blk: 7 }, tips: ['weak'],
        text: {
          ko: (v) => `모든 적에게 [[약화]]를 1 부여합니다. 방어도를 ${v.blk} 얻습니다.`,
          en: (v) => `Apply 1 [[Weak]] to ALL enemies. Gain ${v.blk} Block.`,
        },
        play: (c, v) => { c.applyAll('weak', 1); c.block(v.blk); },
      },
      {
        name: { ko: '물기', en: 'Bite' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 7 }, upg: { dmg: 9 }, tips: ['weak'],
        text: {
          ko: (v) => `피해를 ${v.dmg} 줍니다. 대상이 [[약화]] 상태면 한 번 더 줍니다.`,
          en: (v) => `Deal ${v.dmg} damage. If the target is [[Weak]], do it again.`,
        },
        play: (c, v) => c.attack(c.target, v.dmg, (c.target.st.weak ?? 0) > 0 ? 2 : 1),
      },
    ],
  },
  {
    id: 'encore', pool: 'fool', rarity: 'uncommon', lock: 'A', art: 'curtain',
    faces: [
      {
        name: { ko: '앙코르', en: 'Encore' }, type: 'skill', cost: 1, upgCost: 0, target: 'self',
        vals: {},
        text: {
          ko: () => '이번 턴에 마지막으로 쓴 카드를 손으로 되돌립니다. 그 카드는 이번 턴에 비용이 0입니다.',
          en: () => 'Return the last card you played this turn to your hand. It costs 0 this turn.',
        },
        play: (c) => {
          const f = c.cs.flags;
          if (f.lastPlayedTurn !== c.cs.turn) return;
          const inst = c.cs.piles.discard.find((i) => i.uid === f.lastPlayed);
          if (inst && c.moveToHand(inst)) inst.free = true;
        },
      },
      {
        name: { ko: '커튼콜', en: 'Curtain Call' }, type: 'skill', cost: 1, upgCost: 0, target: 'self',
        vals: {}, tips: ['retain', 'flip'],
        text: {
          ko: () => '이번 턴에는 손패가 [[보존]]됩니다. [[뒤집기]]를 1회 얻습니다.',
          en: () => '[[Retain]] your hand this turn. Gain 1 [[Flip]].',
        },
        play: (c) => { for (const i of c.cs.piles.hand) i.retainOnce = true; c.flips(1); },
      },
    ],
  },
  {
    id: 'tightrope', pool: 'fool', rarity: 'uncommon', lock: 'B', art: 'rope',
    faces: [
      {
        name: { ko: '균형', en: 'Balance' }, type: 'skill', cost: 1, target: 'self',
        vals: { blk: 10 }, upg: { blk: 13 }, kw: ['steady'],
        text: { ko: (v) => `방어도를 ${v.blk} 얻습니다.`, en: (v) => `Gain ${v.blk} Block.` },
        play: (c, v) => c.block(v.blk),
      },
      {
        name: { ko: '건너기', en: 'Crossing' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 10 }, upg: { dmg: 13 }, kw: ['steady'],
        text: { ko: (v) => `피해를 ${v.dmg} 줍니다.`, en: (v) => `Deal ${v.dmg} damage.` },
        play: atk,
      },
    ],
  },
  {
    id: 'fortune', pool: 'fool', rarity: 'uncommon', lock: 'B', art: 'eye',
    faces: [
      {
        name: { ko: '점괘', en: 'Fortune' }, type: 'skill', cost: 1, upgCost: 0, target: 'self',
        vals: {}, kw: ['vanish'],
        text: {
          ko: () => '무작위 바보 카드 3장 중 1장을 손에 넣습니다. 그 카드는 이번 턴에 비용이 0입니다.',
          en: () => 'Choose 1 of 3 random Fool cards to add to your hand. It costs 0 this turn.',
        },
        play: (c) => c.choose({ from: 'discover', count: 1, options: c.discoverOptions('fool', 3), prompt: 'discover' }, 'take'),
        resume: { take: (c, v, ids) => { for (const id of ids) { const inst = c.addCard(id, 'hand'); inst.free = true; } } },
      },
      {
        name: { ko: '흉조', en: 'Ill Omen' }, type: 'skill', cost: 1, target: 'enemy',
        vals: { n: 2 }, upg: { n: 3 }, tips: ['weak', 'exposed'],
        text: {
          ko: (v) => `[[약화]]와 [[취약]]을 ${v.n}씩 부여합니다.`,
          en: (v) => `Apply ${v.n} [[Weak]] and ${v.n} [[Exposed]].`,
        },
        play: (c, v) => { c.apply(c.target, 'weak', v.n); c.apply(c.target, 'exposed', v.n); },
      },
    ],
  },

  // ── 희귀 4 ─────────────────────────────────────────────────────────────
  {
    id: 'grandFinale', pool: 'fool', rarity: 'rare', lock: 'B', art: 'sun',
    faces: [
      {
        name: { ko: '그랜드 피날레', en: 'Grand Finale' }, type: 'attack', cost: 2, target: 'all',
        vals: { dmg: 5 }, upg: { dmg: 7 },
        calc: (cs, v) => { v.hits = cs.cnt.flips; },
        text: {
          ko: (v) => `이번 턴에 뒤집힌 카드 1장마다 모든 적에게 피해를 ${v.dmg} 줍니다.${v.hits != null ? ` (${v.hits}회)` : ''}`,
          en: (v) => `Deal ${v.dmg} damage to ALL enemies for each card flipped this turn.${v.hits != null ? ` (${v.hits}×)` : ''}`,
        },
        play: (c, v) => { const n = v.hits ?? c.cs.cnt.flips; if (n > 0) c.attackAll(v.dmg, n); },
      },
      {
        name: { ko: '서곡', en: 'Overture' }, type: 'skill', cost: 0, target: 'self',
        vals: { n: 2 }, upg: { n: 3 }, tips: ['flip'],
        text: { ko: (v) => `[[뒤집기]]를 ${v.n}회 얻습니다.`, en: (v) => `Gain ${v.n} [[Flips]].` },
        play: (c, v) => c.flips(v.n),
      },
    ],
  },
  {
    id: 'infiniteJest', pool: 'fool', rarity: 'rare', art: 'rune',
    faces: [
      {
        name: { ko: '끝없는 농담', en: 'Infinite Jest' }, type: 'power', cost: 2, upgCost: 1, target: 'self',
        vals: {}, tips: ['infiniteJest'],
        text: { ko: () => '역방향 면을 쓸 때마다 카드를 1장 뽑습니다.', en: () => 'Whenever you play a Reversed face, draw 1 card.' },
        play: (c) => c.apply('player', 'infiniteJest', 1),
      },
      {
        name: { ko: '기립 박수', en: 'Standing Ovation' }, type: 'power', cost: 2, upgCost: 1, target: 'self',
        vals: {}, tips: ['ovation'],
        text: { ko: () => '정방향 면을 쓸 때마다 방어도를 2 얻습니다.', en: () => 'Whenever you play an Upright face, gain 2 Block.' },
        play: (c) => c.apply('player', 'ovation', 1),
      },
    ],
  },
  {
    id: 'dogsLoyalty', pool: 'fool', rarity: 'rare', lock: 'A', art: 'dog',
    faces: [
      {
        name: { ko: '충직한 사냥개', en: 'Loyal Hound' }, type: 'power', cost: 1, target: 'self',
        vals: { n: 5 }, upg: { n: 7 }, tips: ['hound'],
        text: { ko: (v) => `턴이 끝날 때 무작위 적에게 피해를 ${v.n} 줍니다.`, en: (v) => `At the end of your turn, deal ${v.n} damage to a random enemy.` },
        play: (c, v) => c.apply('player', 'hound', v.n),
      },
      {
        name: { ko: '집 지키는 개', en: 'Guard Dog' }, type: 'power', cost: 1, target: 'self',
        vals: { n: 5 }, upg: { n: 7 }, tips: ['guardDog'],
        text: { ko: (v) => `턴이 끝날 때 방어도를 ${v.n} 얻습니다.`, en: (v) => `At the end of your turn, gain ${v.n} Block.` },
        play: (c, v) => c.apply('player', 'guardDog', v.n),
      },
    ],
  },
  {
    id: 'leapOfFaith', pool: 'fool', rarity: 'rare', art: 'arrow',
    faces: [
      {
        name: { ko: '신념의 도약', en: 'Leap of Faith' }, type: 'skill', cost: 1, upgCost: 0, target: 'self',
        vals: {}, kw: ['vanish'],
        text: { ko: () => '에너지를 2 얻습니다.', en: () => 'Gain 2 Energy.' },
        play: (c) => c.energy(2),
      },
      {
        name: { ko: '자유낙하', en: 'Freefall' }, type: 'attack', cost: 'X', target: 'enemy',
        vals: { dmg: 7 }, upg: { dmg: 9 },
        text: { ko: (v) => `피해를 ${v.dmg}씩 X번 줍니다.`, en: (v) => `Deal ${v.dmg} damage X times.` },
        play: (c, v) => c.attack(c.target, v.dmg, v.x ?? 0),
      },
    ],
  },
];
