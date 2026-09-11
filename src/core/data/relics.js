// 유물 정의. hooks(ctx, rs, ...): rs 는 이 유물의 런 단위 상태(카운터 등, run.rs[id]).
// mod: 숫자(energy/flips/draw/potency/xBonus/cardChoices/restHeal/noRest) 또는 보정 함수(dmgOut/debuffOut/shopPrice).
// onPickup(run): 얻는 순간 한 번. onLethal(ctx, rs) → true 면 죽음을 막았다.
import { int } from '../rng.js';

const R = (id, rarity, art, name, desc, rest = {}) => ({ id, rarity, art, name, desc, ...rest });

export const RELICS = [
  // ── 시작 ───────────────────────────────────────────────────────────────
  R('wornCoin', 'starter', 'coin', { ko: '닳은 동전', en: 'Worn Coin' },
    { ko: '무료 뒤집기를 쓸 때마다 방어도를 3 얻습니다.', en: 'Whenever you use a free Flip, gain 3 Block.' },
    { char: 'fool', hooks: { manualFlip(ctx) { ctx.gainBlock('player', 3); } } }),
  R('silverWand', 'starter', 'wand', { ko: '은빛 지팡이', en: 'Silver Wand' },
    { ko: '전투를 시작할 때 충전을 2 얻습니다.', en: 'Start each combat with 2 Charge.' },
    { char: 'magician', hooks: { combatStart(ctx) { ctx.charge(2); } } }),

  // ── 일반 8 ─────────────────────────────────────────────────────────────
  R('emberHeart', 'common', 'heart', { ko: '잿불 심장', en: 'Ember Heart' },
    { ko: '전투에서 이기면 체력을 6 회복합니다.', en: 'After winning a combat, heal 6 HP.' },
    { hooks: { victory(ctx) { ctx.heal('player', 6); } } }),
  R('oldMap', 'common', 'rune', { ko: '귀퉁이 접힌 지도', en: 'Dog-Eared Map' },
    { ko: '매 전투 첫 턴에 뒤집기를 1회 더 얻습니다.', en: 'Gain 1 extra Flip on the first turn of each combat.' },
    { hooks: { combatStart(ctx) { ctx.player.nextFlips += 1; } } }),
  R('ironThimble', 'common', 'shield', { ko: '쇠 골무', en: 'Iron Thimble' },
    { ko: '매 전투 첫 턴에 방어도를 6 얻습니다.', en: 'Gain 6 Block on the first turn of each combat.' },
    { hooks: { turnStart(ctx) { if (ctx.cs.turn === 1) ctx.gainBlock('player', 6); } } }),
  R('scribeQuill', 'common', 'quill', { ko: '서기의 깃펜', en: "Scribe's Quill" },
    { ko: '카드를 4장 쓸 때마다 카드를 1장 뽑습니다.', en: 'Every 4th card you play draws a card.' },
    {
      hooks: {
        cardPlayed(ctx, rs) {
          rs.counter = ((rs.counter ?? 0) + 1) % 4;
          if (rs.counter === 0) ctx.draw(1);
        },
      },
    }),
  R('redThread', 'common', 'web', { ko: '붉은 실', en: 'Red Thread' },
    { ko: '전투를 시작할 때 모든 적에게 취약을 1 부여합니다.', en: 'At the start of each combat, apply 1 Exposed to ALL enemies.' },
    { hooks: { combatStart(ctx) { ctx.applyAll('exposed', 1); } } }),
  R('brassBell', 'common', 'bell', { ko: '놋쇠 종', en: 'Brass Bell' },
    { ko: '전투를 시작할 때 힘을 1 얻습니다.', en: 'Start each combat with 1 Might.' },
    { hooks: { combatStart(ctx) { ctx.apply('player', 'might', 1); } } }),
  R('candleStub', 'common', 'flame', { ko: '타다 남은 초', en: 'Candle Stub' },
    { ko: '성소에서 휴식하면 체력을 10 더 회복합니다.', en: 'Resting at a Sanctuary heals 10 more HP.' },
    { mod: { restHeal: 10 } }),
  R('pilgrimSandal', 'common', 'feather', { ko: '순례자의 샌들', en: "Pilgrim's Sandal" },
    { ko: '얻을 때 최대 체력이 8 늘어납니다.', en: 'When picked up, raise your Max HP by 8.' },
    { onPickup(run) { run.maxHp += 8; run.hp += 8; } }),

  // ── 고급 6 ─────────────────────────────────────────────────────────────
  R('handMirror', 'uncommon', 'mirror', { ko: '손거울', en: 'Hand Mirror' },
    { ko: '매 턴 처음으로 카드가 뒤집힐 때 카드를 1장 뽑습니다.', en: 'The first time a card flips each turn, draw 1 card.' },
    {
      hooks: {
        flip(ctx, rs) {
          const key = `${ctx.run.floor}:${ctx.cs.turn}`;
          if (rs.key === key) return;
          rs.key = key;
          ctx.draw(1);
        },
      },
    }),
  R('venomVial', 'uncommon', 'drop', { ko: '독 약병', en: 'Venom Vial' },
    { ko: '독을 부여할 때마다 1 더 부여합니다.', en: 'Whenever you apply Venom, apply 1 more.' },
    { char: 'magician', mod: { debuffOut: (run, n, info) => (info.id === 'venom' ? n + 1 : n) } }),
  R('tidyScales', 'uncommon', 'scales', { ko: '단정한 저울', en: 'Tidy Scales' },
    { ko: '턴이 끝날 때 남은 에너지 1마다 방어도를 2 얻습니다.', en: 'At the end of your turn, gain 2 Block for each unspent Energy.' },
    { lock: 'B', hooks: { turnEnd(ctx) { const e = ctx.player.energy; if (e > 0) ctx.gainBlock('player', 2 * e); } } }),
  R('ravenFeather', 'uncommon', 'feather', { ko: '까마귀 깃털', en: 'Raven Feather' },
    { ko: '적이 쓰러질 때마다 에너지를 1 얻고 카드를 1장 뽑습니다.', en: 'Whenever an enemy dies, gain 1 Energy and draw 1 card.' },
    {
      lock: 'A',
      hooks: {
        enemyDied(ctx) {
          if (!ctx.enemiesAlive().some((e) => !e.minion)) return;
          ctx.energy(1);
          ctx.draw(1);
        },
      },
    }),
  R('waxSeal', 'uncommon', 'pentacle', { ko: '밀랍 인장', en: 'Wax Seal' },
    { ko: '전투를 시작할 때 수호를 1 얻습니다.', en: 'Start each combat with 1 Ward.' },
    { lock: 'B', hooks: { combatStart(ctx) { ctx.apply('player', 'ward', 1); } } }),
  R('hermitLantern', 'uncommon', 'lantern', { ko: '은둔자의 등불', en: "Hermit's Lantern" },
    { ko: '매 전투 첫 턴에 에너지를 1 더 얻습니다.', en: 'Gain 1 extra Energy on the first turn of each combat.' },
    { lock: 'A', hooks: { combatStart(ctx) { ctx.player.nextEnergy += 1; } } }),

  // ── 희귀 4 ─────────────────────────────────────────────────────────────
  R('wheelPin', 'rare', 'wheel', { ko: '수레바퀴 핀', en: 'Wheel Pin' },
    { ko: '매 턴 무료 뒤집기를 1회 더 얻습니다.', en: 'Gain 1 extra free Flip each turn.' },
    { mod: { flips: 1 } }),
  R('phoenixPlume', 'rare', 'flame', { ko: '불사조 깃', en: 'Phoenix Plume' },
    { ko: '죽음에 이르는 피해를 받으면 대신 최대 체력의 30%로 되살아납니다. 한 번만.', en: 'When you would die, heal to 30% of your Max HP instead. Works once.' },
    {
      onLethal(ctx, rs) {
        if (rs.used) return false;
        rs.used = true;
        const p = ctx.cs.player;
        p.hp = Math.max(1, Math.floor(p.maxHp * 0.3));
        ctx.ev({ t: 'heal', target: 'player', amount: p.hp, hp: p.hp });
        return true;
      },
    }),
  R('silveredDeck', 'rare', 'cards', { ko: '은박 카드', en: 'Silvered Deck' },
    { ko: '버린 더미를 섞어 뽑을 더미로 만들 때마다 뒤집기를 1회 얻습니다.', en: 'Whenever you shuffle your discard pile into your draw pile, gain 1 Flip.' },
    { lock: 'A', hooks: { shuffle(ctx) { ctx.flips(1); } } }),
  R('crownOfStars', 'rare', 'crown', { ko: '별의 관', en: 'Crown of Stars' },
    { ko: '매 턴 세 번째로 쓰는 카드가 에너지를 1 줍니다.', en: 'The 3rd card you play each turn gives 1 Energy.' },
    { lock: 'B', hooks: { cardPlayed(ctx) { if (ctx.cs.cnt.played === 3) ctx.energy(1); } } }),

  // ── 보스 5 ─────────────────────────────────────────────────────────────
  R('brokenHourglass', 'boss', 'hourglass', { ko: '깨진 모래시계', en: 'Broken Hourglass' },
    { ko: '매 턴 에너지를 1 더 얻습니다. 매 턴 카드를 1장 덜 뽑습니다.', en: 'Gain 1 Energy each turn. Draw 1 fewer card each turn.' },
    { mod: { energy: 1, draw: -1 } }),
  R('twinMask', 'boss', 'mask', { ko: '쌍둥이 가면', en: 'Twin Mask' },
    { ko: '매 턴 에너지를 1 더 얻습니다. 더 이상 무료 뒤집기를 얻지 못합니다.', en: 'Gain 1 Energy each turn. You no longer get a free Flip.' },
    { mod: { energy: 1, flips: -1 } }),
  R('blackSun', 'boss', 'sun', { ko: '검은 태양', en: 'Black Sun' },
    { ko: '매 턴 에너지를 1 더 얻습니다. 적이 힘 1을 가지고 전투를 시작합니다.', en: 'Gain 1 Energy each turn. Enemies start combat with 1 Might.' },
    { mod: { energy: 1 }, hooks: { combatStart(ctx) { for (const e of ctx.enemiesAlive()) ctx.apply(e, 'might', 1); } } }),
  R('pilgrimStaff', 'boss', 'wand', { ko: '순례자의 지팡이', en: "Pilgrim's Staff" },
    { ko: '매 턴 카드를 1장 더 뽑습니다. 성소에서 휴식할 수 없습니다.', en: 'Draw 1 extra card each turn. You can no longer rest at Sanctuaries.' },
    { mod: { draw: 1, noRest: 1 } }),
  R('moonlitCharm', 'boss', 'moon', { ko: '달빛 부적', en: 'Moonlit Charm' },
    { ko: '매 턴 에너지를 1 더 얻습니다. 카드를 뽑은 뒤 손패의 무작위 카드 1장이 뒤집힙니다.', en: 'Gain 1 Energy each turn. After you draw, a random card in your hand flips.' },
    {
      mod: { energy: 1 },
      hooks: {
        afterDraw(ctx) {
          const hand = ctx.cs.piles.hand;
          if (hand.length) ctx.flip(hand[int(ctx.rng, 0, hand.length - 1)]);
        },
      },
    }),

  // ── 상점 3 ─────────────────────────────────────────────────────────────
  R('merchantScale', 'shop', 'scales', { ko: '상인의 저울', en: "Merchant's Scale" },
    { ko: '상점 가격이 20% 싸집니다.', en: 'Shop prices are 20% lower.' },
    { mod: { shopPrice: (run, p) => p * 0.8 } }),
  R('potionBelt', 'shop', 'orb', { ko: '물약 허리띠', en: 'Potion Belt' },
    { ko: '물약 칸이 2개 늘어납니다.', en: 'Gain 2 extra potion slots.' },
    { onPickup(run) { run.potions.push(null, null); } }),
  R('cardSleeve', 'shop', 'cards', { ko: '비단 카드집', en: 'Silk Card Sleeve' },
    { ko: '카드 보상에서 고를 수 있는 카드가 1장 늘어납니다.', en: 'Card rewards offer 1 more choice.' },
    { mod: { cardChoices: 1 } }),
];
