// 전투 화면. 엔진 행동 → 이벤트 연출(playEvents) → 상태에서 전부 다시 맞추기(syncAll).
// 손패는 "화면에 보이는 순서(S.shown)"를 따로 들고 이벤트대로 움직이고, 연출이 끝나면 상태와 맞춘다.
import { h } from '../dom.js';
import { app, persist, openOverlay, toast, motionScale } from '../app.js';
import { stageInfo, toStage, stageRect } from '../stage.js';
import { t, L } from '../../core/i18n.js';
import { playCard, flipCard, endTurn, choose, canPlay, canFlip, intentView, isBusy, usePotion } from '../../core/combat.js';
import { faceOf } from '../../core/cards.js';
import { enemyDef, potionDef } from '../../core/content.js';
import { statusDef } from '../../core/statuses.js';
import { KEYWORDS } from '../../core/keywords.js';
import { cardEl, refreshCard } from '../cardview.js';
import { enemyArt } from '../art/enemies.js';
import { heroArt } from '../art/portraits.js';
import { backdrop } from '../art/backgrounds.js';
import { icon } from '../art/icons.js';
import { mountHud } from '../hud.js';
import { attachTip, hideTip } from '../tooltip.js';
import { afterVictory, afterDefeat } from '../flow.js';
import { markSeen } from '../../core/meta.js';
import * as fx from '../fx.js';
import { sfx } from '../../audio/audio.js';

const ART = { sm: 120, md: 160, lg: 200, xl: 250 };
const INTENT_ICONS = {
  attack: ['sword'], attackDebuff: ['sword', 'arrowDown'], attackBlock: ['sword', 'shield'],
  block: ['shield'], buff: ['arrowUp'], debuff: ['arrowDown'], summon: ['plus'], special: ['eye'], unknown: ['question'],
};
const REASON = {
  energy: 'combat.noEnergy', unplayable: 'combat.unplayable', condition: 'combat.unplayable',
  noFlips: 'combat.noFlips', stuck: 'combat.stuck', busy: null, missing: null,
};

export function mount(root) {
  const run = app.run;
  const cs0 = run.combat;
  if (!cs0) { setTimeout(() => afterVictory(app), 0); return {}; }

  const S = {
    cards: new Map(), foes: new Map(), shown: [], limbo: null,
    sel: null, hover: null, hot: null, kbTarget: null,
    busy: false, drag: null, pick: null, ended: false, alive: true,
    disp: {}, count: { draw: 0, discard: 0, vanish: 0 }, flipsAhead: new Map(),
  };

  root.classList.add(`act-${run.act}`);
  for (const e of cs0.enemies) markSeen(app.meta, 'enemies', e.id);

  // ── 뼈대 ──────────────────────────────────────────────────────────────
  const hud = mountHud(root, app, {
    onPotion: (slot) => openOverlay('potion', {
      slot,
      onUse: !S.busy && !S.ended && !run.combat?.pending ? (s) => beginPotion(s) : null,
      onChange: () => hud.update(),
    }),
  });
  const field = h('div', { class: 'field' });
  field.addEventListener('pointerdown', (e) => { if (e.target === field) deselect(); });
  const hero = buildHero();
  const handEl = h('div', { class: 'hand' });
  const fxLayer = h('div', { class: 'fx-layer' });
  const canvas = h('canvas', { class: 'fx-canvas' });
  const promptEl = h('div', { class: 'prompt', hidden: true, 'aria-live': 'polite' });
  const bannerEl = h('div', { class: 'banner', hidden: true });
  const flipBtn = h('button', { class: 'flipbtn', 'aria-label': t('combat.flip'), hidden: true, onClick: () => S.sel && doFlip(S.sel) }, icon('flip'));
  flipBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
  const confirmBtn = h('button', { class: 'btn primary confirm-pick', hidden: true, onClick: () => confirmPick() }, t('combat.confirmPick'));

  const orb = h('div', { class: 'orb num', role: 'status', 'aria-label': t('combat.energy') });
  const coinN = h('b', { class: 'num' });
  const coin = h('div', { class: 'coin', 'aria-label': t('combat.flips') }, icon('flip'), coinN);
  attachTip(orb, () => [{ title: t('combat.energy'), body: '' }]);
  attachTip(coin, () => [{ title: L(KEYWORDS.flip.name), body: L(KEYWORDS.flip.desc) }]);
  const endBtn = h('button', { class: 'btn primary endturn', onClick: () => doEndTurn() }, t('combat.endTurn'));
  const piles = {
    draw: pileBtn('draw', 'deck'),
    discard: pileBtn('discard', 'deck'),
    vanish: pileBtn('vanish', 'flame'),
  };

  root.append(field, hero.el, handEl, orb, coin, endBtn, piles.draw, piles.discard, piles.vanish,
    promptEl, confirmBtn, flipBtn, fxLayer, canvas, bannerEl);
  field.append(hero.el);

  const g0 = stageInfo();
  fx.bindCanvas(canvas, g0.w, g0.h);
  field.prepend(backdrop(run.act, g0.w, g0.h));

  // ── 기하 ──────────────────────────────────────────────────────────────
  // 세로형은 위에서부터 띠로 나눈다: 상단 바 · 적 · 가운데 · 캐릭터 · 조작 줄 · 손패
  function geo() {
    const { w: W, h: H, portrait } = stageInfo();
    const cw = portrait ? 148 : 156;
    const ch = Math.round(cw * 1.42);
    if (!portrait) {
      return {
        W, H, portrait, cw, ch,
        handCx: W / 2, handY: H - ch / 2 + 34, handMaxW: Math.min(W - 470, 940),
        playX: W / 2, playY: 282,
        foeBase: 438, foeL: W * 0.4, foeR: W - 24,
        heroX: Math.max(170, W * 0.19), heroBase: 438, heroArt: 190,
      };
    }
    const handTop = H - ch - 12;
    const ctrlTop = handTop - 82;
    const heroArt = H < 1000 ? 96 : 116;
    const heroBase = ctrlTop - 72;
    const foeBase = Math.round(Math.min(Math.max(H * 0.37, 300), 470, heroBase - heroArt - 86));
    return {
      W, H, portrait, cw, ch,
      handCx: W / 2, handY: H - ch / 2 - 12, handMaxW: W - 24,
      playX: W / 2, playY: Math.round((foeBase + 80 + heroBase - heroArt) / 2),
      foeBase, foeL: 10, foeR: W - 10,
      heroX: 88, heroBase, heroArt,
    };
  }

  function slots(n) {
    const g = geo();
    const gap = n > 1 ? Math.min(g.cw * 0.9, (g.handMaxW - g.cw) / (n - 1)) : 0;
    const step = n > 1 ? Math.min(4.5, 26 / n) : 0;
    return Array.from({ length: n }, (_, i) => {
      const o = i - (n - 1) / 2;
      return { x: g.handCx + o * gap, y: g.handY + o * o * (g.portrait ? 1.6 : 2.6), r: o * step };
    });
  }

  function place(el, x, y, r, s) {
    const g = geo();
    el.style.transform = `translate(${x - g.cw / 2}px, ${y - g.ch / 2}px) rotate(${r}deg) scale(${s})`;
    el._pos = { x, y, sc: s };
  }

  function relayout() {
    const g = geo();
    const sl = slots(S.shown.length);
    S.shown.forEach((uid, i) => {
      const el = S.cards.get(uid);
      if (!el || (S.drag && S.drag.el === el && S.drag.moved)) return;
      const s = sl[i];
      const lifted = uid === S.sel || uid === S.hover;
      el.style.zIndex = String(lifted ? 200 : 20 + i);
      if (lifted) {
        const sc = g.portrait ? 1.36 : 1.22;
        const w = g.cw * sc;
        const hh = g.ch * sc;
        const x = Math.max(w / 2 + 8, Math.min(g.W - w / 2 - 8, s.x));
        place(el, x, g.H - hh / 2 - 8, 0, sc);
      } else {
        place(el, s.x, s.y, s.r, 1);
      }
    });
    positionFlipBtn();
  }

  function placeLimbo(el) {
    const g = geo();
    el.style.zIndex = '300';
    place(el, g.playX, g.playY, 0, g.portrait ? 1.15 : 1.02);
  }

  function pileCenter(kind) {
    const r = stageRect(piles[kind]);
    return { x: r.cx, y: r.cy };
  }

  // ── 카드 요소 ─────────────────────────────────────────────────────────
  function findInst(uid) {
    const cs = run.combat;
    if (cs.limbo?.uid === uid) return cs.limbo;
    for (const p of Object.values(cs.piles)) {
      const i = p.find((x) => x.uid === uid);
      if (i) return i;
    }
    return null;
  }

  function makeCard(inst, { fromPile = false, rev } = {}) {
    const shownInst = rev == null ? inst : { ...inst, rev };
    const el = cardEl(shownInst, { run });
    el.style.setProperty('--cw', `${geo().cw}px`);
    el.addEventListener('pointerdown', (e) => onCardDown(e, inst.uid));
    el.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || S.drag || S.busy || S.pick || S.ended) return;
      S.hover = inst.uid;
      relayout();
    });
    el.addEventListener('pointerleave', () => {
      if (S.hover === inst.uid) { S.hover = null; relayout(); }
    });
    el.addEventListener('contextmenu', (e) => { e.preventDefault(); inspect(inst.uid); });
    handEl.append(el);
    S.cards.set(inst.uid, el);
    if (fromPile) {
      const p = pileCenter('draw');
      el.style.transition = 'none';
      place(el, p.x, p.y, 0, 0.3);
      el.style.opacity = '0';
      void el.offsetWidth;
      el.style.transition = '';
      el.style.opacity = '';
    }
    return el;
  }

  function refreshHand() {
    const cs = run.combat;
    const p = cs.pending;
    for (const inst of cs.piles.hand) {
      const el = S.cards.get(inst.uid);
      if (!el) continue;
      const opt = !!(S.pick && p?.options.includes(inst.uid));
      refreshCard(el, inst, {
        run,
        target: S.sel === inst.uid ? (S.hot ?? S.kbTarget) : null,
        can: !S.pick && !S.ended && canPlay(run, inst.uid).ok,
        opt, picked: !!S.pick?.set.has(inst.uid), dim: !!S.pick && !opt,
      });
      el.classList.toggle('sel', S.sel === inst.uid);
    }
    if (cs.limbo) {
      const el = S.cards.get(cs.limbo.uid);
      if (el) refreshCard(el, cs.limbo, { run });
    }
  }

  function flyAway(el, to, ms) {
    const d = ms * motionScale();
    if (d <= 0) { el.remove(); return Promise.resolve(); }
    el.classList.add('leaving');
    el.style.transition = `transform ${d}ms var(--ease-in), opacity ${d}ms var(--ease-in)`;
    place(el, to.x, to.y, 0, 0.2);
    el.style.opacity = '0';
    return new Promise((r) => setTimeout(() => { el.remove(); r(); }, d));
  }

  // ── 적 · 플레이어 ─────────────────────────────────────────────────────
  function hpBar() {
    const fill = h('i');
    const txt = h('span', { class: 'num' });
    const blkN = h('b', { class: 'num' });
    const blk = h('div', { class: 'blk' }, icon('shieldFill'), blkN);
    const bar = h('div', { class: 'hpbar' }, fill, txt);
    const el = h('div', { class: 'hpwrap' }, blk, bar);
    const cur = { hp: 0, max: 1, block: 0 };
    return {
      el,
      set(hp, max, block) {
        if (hp != null) cur.hp = Math.max(0, hp);
        if (max != null) cur.max = Math.max(1, max);
        if (block != null) cur.block = block;
        fill.style.transform = `scaleX(${cur.hp / cur.max})`;
        txt.textContent = `${cur.hp}/${cur.max}`;
        blk.classList.toggle('on', cur.block > 0);
        blkN.textContent = String(cur.block);
        bar.classList.toggle('blocked', cur.block > 0);
      },
    };
  }

  function renderSts(box, st, passive) {
    box.replaceChildren();
    if (passive) {
      const chip = h('span', { class: 'st st-passive', tabindex: '0' }, icon('eye'));
      attachTip(chip, () => [{ title: L(passive.name), body: L(passive.desc) }]);
      box.append(chip);
    }
    for (const [id, n] of Object.entries(st ?? {})) {
      const d = statusDef(id);
      const chip = h('span', { class: `st st-${d.kind}`, tabindex: '0' }, icon(d.icon), d.flag ? null : h('b', { class: 'num' }, String(n)));
      attachTip(chip, () => [{ title: L(d.name), body: L(d.desc, n) }]);
      box.append(chip);
    }
  }

  function buildHero() {
    const g = geo();
    const art = h('div', { class: 'hero-art' }, heroArt(run.char));
    const hp = hpBar();
    const sts = h('div', { class: 'sts' });
    const body = h('div', { class: 'foe-body' }, art, h('div', { class: 'foe-info' }, hp.el, sts));
    const el = h('div', { class: 'hero', style: { '--art': `${g.heroArt}px` } }, body);
    return { el, body, art, hp, sts };
  }

  function positionHero() {
    const g = geo();
    hero.el.style.setProperty('--art', `${g.heroArt}px`);
    hero.el.style.transform = `translate(${g.heroX}px, ${g.heroBase}px)`;
  }

  function findFoe(uid) { return run.combat.enemies.find((e) => e.uid === uid); }
  function aliveFoes() { return run.combat.enemies.filter((e) => !e.dead); }

  function buildFoe(e) {
    const def = enemyDef(e.id);
    const size = ART[def.size ?? 'md'];
    const intent = h('div', { class: 'foe-intent', tabindex: '0' });
    const art = h('div', { class: 'foe-art' }, enemyArt(def.art));
    const ring = h('div', { class: 'foe-ring' });
    const hp = hpBar();
    const sts = h('div', { class: 'sts' });
    const info = h('div', { class: 'foe-info' }, hp.el, sts, h('div', { class: 'foe-name' }, L(def.name)));
    const body = h('div', { class: 'foe-body' }, intent, art, ring, info);
    const el = h('div', { class: `foe size-${def.size ?? 'md'}`, dataset: { uid: e.uid }, style: { '--art': `${size}px` } }, body);
    el.addEventListener('pointerdown', (ev) => onFoeDown(ev, e.uid));
    el.addEventListener('pointerenter', (ev) => { if (ev.pointerType === 'mouse' && S.sel && needsTarget(S.sel)) setHot(e.uid); });
    el.addEventListener('pointerleave', () => { if (S.hot === e.uid && !S.drag) setHot(null); });
    attachTip(intent, () => intentTip(e.uid));
    field.append(el);
    const rec = { el, body, art, intent, hp, sts, size, dying: false };
    S.foes.set(e.uid, rec);
    return rec;
  }

  function updateFoe(rec, e) {
    rec.hp.set(e.hp, e.maxHp, e.block);
    renderSts(rec.sts, S.disp[e.uid] ?? e.st, enemyDef(e.id).passive);
    renderIntent(rec, e);
    rec.el.classList.toggle('stance-1', e.stance === 1);
  }

  function renderIntent(rec, e) {
    const v = intentView(run, e);
    rec.intent.replaceChildren();
    rec.intent.hidden = !v || S.ended;
    if (!v) return;
    rec.intent.className = `foe-intent k-${v.kind}`;
    for (const n of INTENT_ICONS[v.kind] ?? ['question']) rec.intent.append(icon(n));
    if (v.dmg != null) rec.intent.append(h('span', { class: 'num' }, v.times > 1 ? `${v.dmg}×${v.times}` : String(v.dmg)));
  }

  function intentTip(uid) {
    const e = findFoe(uid);
    const v = e && intentView(run, e);
    if (!v) return [];
    const m = enemyDef(e.id).moves[e.move];
    const dmg = v.dmg != null
      ? (v.times > 1 ? t('intent.dmgTimes', { dmg: v.dmg, times: v.times }) : t('intent.dmg', { dmg: v.dmg }))
      : '';
    const body = [dmg, m?.desc ? L(m.desc) : ''].filter(Boolean).join(' · ');
    return [{ title: t(`intent.${v.kind}`), body }];
  }

  function layoutFoes() {
    const g = geo();
    const list = run.combat.enemies.filter((e) => S.foes.has(e.uid) && !S.foes.get(e.uid).dying);
    const widths = list.map((e) => Math.max(ART[enemyDef(e.id).size ?? 'md'], 150));
    const gap = 26;
    const total = widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, list.length - 1);
    const avail = g.foeR - g.foeL;
    const tallest = Math.max(0, ...list.map((e) => ART[enemyDef(e.id).size ?? 'md']));
    // 세로형에서 큰 적이 상단 바를 가리지 않도록 높이도 맞춘다(상단 바 100 + 의도 44)
    const vfit = g.portrait && tallest ? Math.min(1, (g.foeBase - 144) / tallest) : 1;
    const sc = Math.min(1, avail / Math.max(1, total), vfit);
    let x = g.foeL + (avail - total * sc) / 2;
    list.forEach((e, i) => {
      const w = widths[i] * sc;
      const rec = S.foes.get(e.uid);
      rec.el.style.transform = `translate(${x + w / 2}px, ${g.foeBase}px) scale(${sc})`;
      x += w + gap * sc;
    });
  }

  function entRec(ref) { return ref === 'player' ? hero : S.foes.get(ref); }

  function artCenter(rec) {
    const r = stageRect(rec.art);
    return { x: r.cx, y: r.y + r.h * 0.42 };
  }

  function foeAt(p) {
    for (const [uid, rec] of S.foes) {
      if (rec.dying) continue;
      const r = stageRect(rec.art);
      if (p.x >= r.x - 24 && p.x <= r.x + r.w + 24 && p.y >= r.y - 40 && p.y <= r.y + r.h + 60) return findFoe(uid);
    }
    return null;
  }

  // ── 조작 계층 ─────────────────────────────────────────────────────────
  function pileBtn(kind, ic) {
    const b = h('button', { class: `pile ${kind}`, 'aria-label': t(`combat.${kind}`), onClick: () => openPile(kind) },
      icon(ic), h('b', { class: 'num' }, '0'));
    attachTip(b, () => [{ title: t(`combat.${kind}`), body: '' }]);
    return b;
  }

  function updatePiles() {
    for (const k of ['draw', 'discard', 'vanish']) piles[k].querySelector('b').textContent = String(Math.max(0, S.count[k]));
    piles.vanish.hidden = S.count.vanish <= 0;
  }

  function setEnergy(n, max) {
    orb.textContent = `${n}/${max}`;
    orb.classList.toggle('empty', n <= 0);
  }

  function setFlips(n) {
    coinN.textContent = String(n);
    coin.classList.toggle('empty', n <= 0);
  }

  function syncControls() {
    const cs = run.combat;
    setEnergy(cs.player.energy, cs.player.maxEnergy);
    setFlips(cs.player.flips);
    endBtn.disabled = S.busy || S.ended || !!cs.pending;
    updatePiles();
  }

  function positionFlipBtn() {
    const uid = S.sel;
    const el = uid && S.cards.get(uid);
    const cs = run.combat;
    const inst = uid && findInst(uid);
    const show = !!el && !!el._pos && !S.busy && !S.pick && !S.ended && !(S.drag && S.drag.moved)
      && S.shown.includes(uid) && cs.player.flips > 0 && !inst?.stuck;
    flipBtn.hidden = !show;
    if (!show) return;
    const g = geo();
    const w = g.cw * el._pos.sc;
    const hh = g.ch * el._pos.sc;
    flipBtn.style.transform = `translate(${el._pos.x + w / 2 - 30}px, ${el._pos.y - hh / 2 - 26}px)`;
  }

  function needsTarget(uid) {
    const inst = findInst(uid);
    return !!inst && faceOf(inst).target === 'enemy';
  }

  function promptText(p) { return t(`prompt.${p?.prompt ?? 'pick'}`); }

  function updatePrompt() {
    const p = run.combat?.pending;
    let txt = '';
    if (p && p.kind === 'hand') txt = promptText(p);
    else if (S.potionSlot != null) txt = t('combat.pickTarget');
    else if (S.sel && needsTarget(S.sel) && aliveFoes().length > 1 && !S.ended) txt = t('combat.pickTarget');
    promptEl.textContent = txt;
    promptEl.hidden = !txt;
  }

  function markTargets() {
    const aim = !!S.sel && needsTarget(S.sel);
    for (const [uid, rec] of S.foes) {
      rec.el.classList.toggle('targetable', aim);
      rec.el.classList.toggle('hot', aim && (S.hot ?? S.kbTarget) === uid);
    }
  }

  function setHot(uid) {
    if (S.hot === uid) return;
    S.hot = uid;
    markTargets();
    const el = S.sel && S.cards.get(S.sel);
    const inst = S.sel && findInst(S.sel);
    if (el && inst) refreshCard(el, inst, { run, target: uid ?? S.kbTarget, can: canPlay(run, inst.uid).ok });
    if (el) el.classList.add('sel');
  }

  // ── 동기화 ────────────────────────────────────────────────────────────
  function syncAll({ skipHand = false } = {}) {
    const cs = run.combat;
    S.disp = { player: { ...cs.player.st } };
    for (const e of cs.enemies) S.disp[e.uid] = { ...e.st };
    S.count = { draw: cs.piles.draw.length, discard: cs.piles.discard.length, vanish: cs.piles.vanish.length };

    if (!skipHand) {
      const hand = cs.piles.hand.map((i) => i.uid);
      const keep = new Set(hand);
      if (cs.limbo) keep.add(cs.limbo.uid);
      for (const [uid, el] of S.cards) if (!keep.has(uid)) { el.remove(); S.cards.delete(uid); }
      for (const inst of cs.piles.hand) if (!S.cards.has(inst.uid)) makeCard(inst);
      S.shown = hand;
      if (cs.limbo) {
        const el = S.cards.get(cs.limbo.uid) ?? makeCard(cs.limbo);
        S.limbo = cs.limbo.uid;
        placeLimbo(el);
      } else S.limbo = null;
      if (S.sel && !hand.includes(S.sel)) S.sel = null;
      for (const el of S.cards.values()) el.style.setProperty('--cw', `${geo().cw}px`);
      refreshHand();
      relayout();
    }

    for (const [uid, rec] of S.foes) {
      const e = findFoe(uid);
      if ((!e || e.dead) && !rec.dying) { rec.el.remove(); S.foes.delete(uid); }
    }
    for (const e of aliveFoes()) updateFoe(S.foes.get(e.uid) ?? buildFoe(e), e);
    layoutFoes();

    const p = cs.player;
    hero.hp.set(p.hp, p.maxHp, p.block);
    renderSts(hero.sts, S.disp.player);
    positionHero();
    syncControls();
    hud.update();
    updatePrompt();
    markTargets();
  }

  // ── 입력 ──────────────────────────────────────────────────────────────
  function onCardDown(e, uid) {
    if (S.ended || e.button === 2) return;
    e.preventDefault();
    e.stopPropagation();
    hideTip();
    const el = S.cards.get(uid);
    if (!el || !S.shown.includes(uid)) return;
    const p = toStage(e.clientX, e.clientY);
    const d = { uid, el, id: e.pointerId, x0: p.x, y0: p.y, moved: false, long: false };
    d.timer = setTimeout(() => { if (!d.moved) { d.long = true; inspect(uid); } }, 480);
    S.drag = d;
    try { el.setPointerCapture(e.pointerId); } catch { /* 일부 브라우저 */ }
    el.onpointermove = (ev) => onCardMove(ev, d);
    el.onpointerup = (ev) => onCardUp(ev, d);
    el.onpointercancel = () => { clearTimeout(d.timer); endDrag(d); relayout(); };
  }

  function onCardMove(ev, d) {
    if (ev.pointerId !== d.id) return;
    const p = toStage(ev.clientX, ev.clientY);
    if (!d.moved) {
      if (Math.hypot(p.x - d.x0, p.y - d.y0) < 12 || S.busy || S.pick || d.long) return;
      d.moved = true;
      clearTimeout(d.timer);
      S.sel = d.uid;
      S.hover = null;
      d.el.classList.add('dragging', 'sel');
      flipBtn.hidden = true;
      updatePrompt();
      markTargets();
    }
    const g = geo();
    place(d.el, p.x, p.y - g.ch * 0.3, 0, 1.05);
    if (needsTarget(d.uid)) setHot(foeAt(p)?.uid ?? null);
  }

  function onCardUp(ev, d) {
    if (ev.pointerId !== d.id) return;
    clearTimeout(d.timer);
    const p = toStage(ev.clientX, ev.clientY);
    const moved = d.moved;
    endDrag(d);
    if (d.long) return;
    if (!moved) { onCardTap(d.uid); return; }
    const g = geo();
    if (needsTarget(d.uid)) {
      const foe = foeAt(p);
      if (foe) { doPlay(d.uid, foe.uid); return; }
    } else if (p.y < g.H - g.ch * 0.9) { doPlay(d.uid); return; }
    setHot(null);
    relayout();
  }

  function endDrag(d) {
    d.el.onpointermove = null;
    d.el.onpointerup = null;
    d.el.onpointercancel = null;
    d.el.classList.remove('dragging');
    if (S.drag === d) S.drag = null;
  }

  function onCardTap(uid) {
    if (S.busy || S.ended) return;
    if (S.pick) { togglePick(uid); return; }
    if (S.sel !== uid) { select(uid); return; }
    if (!needsTarget(uid)) { doPlay(uid); return; }
    const alive = aliveFoes();
    if (alive.length === 1) { doPlay(uid, alive[0].uid); return; }
    if (S.kbTarget && findFoe(S.kbTarget) && !findFoe(S.kbTarget).dead) { doPlay(uid, S.kbTarget); return; }
    toast(t('combat.pickTarget'));
  }

  function onFoeDown(ev, uid) {
    if (S.busy || S.ended) return;
    ev.stopPropagation();
    if (S.potionSlot != null) { doPotion(S.potionSlot, uid); return; }
    if (S.sel && needsTarget(S.sel) && !S.pick) { doPlay(S.sel, uid); return; }
    S.kbTarget = uid;
    markTargets();
  }

  function select(uid) {
    S.sel = uid;
    S.hover = null;
    S.hot = null;
    refreshHand();
    relayout();
    updatePrompt();
    markTargets();
  }

  function deselect() {
    if (S.pick || S.busy) return;
    if (!S.sel && !S.hot && S.potionSlot == null) return;
    S.potionSlot = null;
    S.sel = null;
    S.hot = null;
    refreshHand();
    relayout();
    updatePrompt();
    markTargets();
  }

  function cycleTarget(dir) {
    const alive = aliveFoes();
    if (!alive.length) return;
    const i = alive.findIndex((e) => e.uid === (S.hot ?? S.kbTarget));
    const next = alive[(i + dir + alive.length) % alive.length];
    S.kbTarget = next.uid;
    setHot(next.uid);
  }

  function inspect(uid) {
    const inst = findInst(uid);
    if (inst) openOverlay('inspect', { inst, run });
  }

  function openPile(kind) {
    const list = run.combat.piles[kind].slice();
    // 뽑을 더미는 순서를 드러내지 않는다
    if (kind === 'draw') list.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : Number(a.rev) - Number(b.rev)));
    openOverlay('deck', { title: t(`combat.${kind}`), cards: list, run: null });
  }

  // ── 선택(pending) ─────────────────────────────────────────────────────
  function enterPending() {
    const p = run.combat?.pending;
    if (!p) return;
    S.sel = null;
    if (p.kind === 'hand') {
      S.pick = { set: new Set() };
      confirmBtn.hidden = !(p.count > 1 || p.min < p.count);
      refreshHand();
      relayout();
      updatePrompt();
      syncControls();
      return;
    }
    const cards = p.kind === 'discover'
      ? p.options.map((id) => ({ uid: id, id, up: 0, rev: false }))
      : p.options.map((uid) => findInst(uid)).filter(Boolean);
    openOverlay('pick', { title: promptText(p), cards, count: p.count, min: p.min, run, dismissable: false, onPick: (ids) => doChoose(ids) });
  }

  function togglePick(uid) {
    const p = run.combat?.pending;
    if (!p || !p.options.includes(uid)) return;
    if (p.count === 1 && p.min === 1) { doChoose([uid]); return; }
    if (S.pick.set.has(uid)) S.pick.set.delete(uid);
    else if (S.pick.set.size < p.count) S.pick.set.add(uid);
    refreshHand();
  }

  function confirmPick() {
    const p = run.combat?.pending;
    if (!p || !S.pick || S.pick.set.size < p.min) return;
    doChoose([...S.pick.set]);
  }

  async function doChoose(ids) {
    S.pick = null;
    confirmBtn.hidden = true;
    const ev = choose(run, ids);
    if (!ev.length && run.combat?.pending) { enterPending(); return; }
    persist();
    await playEvents(ev);
    if (!S.alive) return;   // 연출 도중 전투가 끝나 화면이 바뀌었을 수 있다
    if (run.combat?.pending) enterPending();
  }

  // ── 행동 ──────────────────────────────────────────────────────────────
  async function doPlay(uid, targetUid) {
    if (S.busy || S.ended) return;
    const chk = canPlay(run, uid);
    if (!chk.ok) {
      const key = REASON[chk.reason];
      if (key) toast(t(key));
      sfx('error');
      fx.pulse(S.cards.get(uid), 'nope', 360);
      relayout();
      return;
    }
    S.sel = null;
    S.hot = null;
    S.hover = null;
    markTargets();
    const ev = playCard(run, uid, targetUid);
    if (!ev.length) { relayout(); return; }
    persist();
    await playEvents(ev);
    if (!S.alive) return;   // 연출 도중 전투가 끝나 화면이 바뀌었을 수 있다
    if (run.combat?.pending) enterPending();
  }

  async function doFlip(uid) {
    if (S.busy || S.ended) return;
    const chk = canFlip(run, uid);
    if (!chk.ok) {
      const key = REASON[chk.reason];
      if (key) toast(t(key));
      return;
    }
    const ev = flipCard(run, uid);
    persist();
    await playEvents(ev);
  }

  async function doEndTurn() {
    if (S.busy || S.ended || isBusy(run)) return;
    S.sel = null;
    S.hover = null;
    S.hot = null;
    markTargets();
    const ev = endTurn(run);
    persist();
    await playEvents(ev);
  }

  // 물약: 대상이 필요하고 적이 여럿이면 적을 누를 때까지 기다린다
  function beginPotion(slot) {
    const id = run.potions[slot];
    if (!id || S.busy || S.ended) return;
    const alive = aliveFoes();
    if (potionDef(id).target === 'enemy' && alive.length > 1) {
      S.sel = null;
      S.potionSlot = slot;
      refreshHand();
      relayout();
      updatePrompt();
      for (const rec of S.foes.values()) rec.el.classList.add('targetable');
      return;
    }
    doPotion(slot, alive[0]?.uid);
  }

  async function doPotion(slot, targetUid) {
    S.potionSlot = null;
    const ev = usePotion(run, slot, targetUid);
    markTargets();
    if (!ev.length) { updatePrompt(); return; }
    persist();
    await playEvents(ev);
  }

  // ── 연출 ──────────────────────────────────────────────────────────────
  async function banner(text, ms) {
    bannerEl.textContent = text;
    bannerEl.style.animationDuration = `${Math.max(1, ms * motionScale())}ms`;
    bannerEl.hidden = false;
    fx.pulse(bannerEl, 'show', ms);
    await fx.wait(ms);
    bannerEl.hidden = true;
  }

  function statusFloat(rec, ref, id, delta) {
    const d = statusDef(id);
    const c = artCenter(rec);
    fx.floatText(fxLayer, c.x, c.y - 46, `${L(d.name)}${d.flag ? '' : ` ${delta}`}`, `st ${d.kind === 'debuff' ? 'debuff' : 'buff'}`);
  }

  const H = {
    turn: async (ev) => {
      if (ev.side === 'player') { sfx('turn'); await banner(t('combat.yourTurn'), 620); }
      else await banner(t('combat.enemyTurn'), 480);
    },
    energy: (ev) => { setEnergy(ev.value, run.combat.player.maxEnergy); fx.pulse(orb, 'pop', 300); },
    flips: (ev) => { setFlips(ev.value); fx.pulse(coin, 'pop', 300); },
    draw: async (ev) => {
      const inst = findInst(ev.uid);
      if (!inst) return;
      const ahead = S.flipsAhead.get(ev.uid) ?? 0;
      const rev0 = ahead % 2 ? !inst.rev : inst.rev;
      if (!S.cards.has(ev.uid)) makeCard(inst, { fromPile: ev.from !== 'other', rev: rev0 });
      if (ev.from !== 'other') S.count.draw--;
      updatePiles();
      if (!S.shown.includes(ev.uid)) S.shown.push(ev.uid);
      sfx('draw');
      relayout();
      await fx.wait(85);
    },
    shuffle: async (ev) => {
      S.count.draw += ev.count;
      S.count.discard = 0;
      updatePiles();
      fx.pulse(piles.draw, 'pop', 400);
      sfx('draw');
      await fx.wait(200);
    },
    play: async (ev) => {
      const el = S.cards.get(ev.uid);
      if (!el) return;
      S.shown = S.shown.filter((u) => u !== ev.uid);
      S.limbo = ev.uid;
      el.classList.remove('sel', 'can', 'dragging');
      placeLimbo(el);
      sfx('play');
      relayout();
      await fx.wait(210);
      if (ev.type === 'attack') fx.pulse(hero.body, 'lunge-r', 320);
    },
    flip: async (ev) => {
      const n = S.flipsAhead.get(ev.uid) ?? 0;
      if (n) S.flipsAhead.set(ev.uid, n - 1);
      const el = S.cards.get(ev.uid);
      if (!el) return;
      el.classList.toggle('rev', ev.rev);
      sfx('flip');
      const r = stageRect(el);
      fx.burst('flip', r.cx, r.cy);
      await fx.wait(ev.manual ? 320 : 220);
    },
    onFlip: (ev) => fx.pulse(S.cards.get(ev.uid), 'glow', 500),
    discard: async (ev) => {
      S.count.discard++;
      updatePiles();
      const el = S.cards.get(ev.uid);
      if (!el) return;
      S.shown = S.shown.filter((u) => u !== ev.uid);
      if (S.limbo === ev.uid) S.limbo = null;
      S.cards.delete(ev.uid);
      const fly = flyAway(el, pileCenter('discard'), ev.played ? 260 : 220);
      if (ev.endTurn) { await fx.wait(45); return; }
      relayout();
      await fly;
    },
    vanish: async (ev) => {
      S.count.vanish++;
      updatePiles();
      const el = S.cards.get(ev.uid);
      if (!el) return;
      S.shown = S.shown.filter((u) => u !== ev.uid);
      if (S.limbo === ev.uid) S.limbo = null;
      S.cards.delete(ev.uid);
      const r = stageRect(el);
      fx.burst('vanish', r.cx, r.cy);
      el.classList.add('vanishing');
      setTimeout(() => el.remove(), 520 * motionScale());
      relayout();
      await fx.wait(260);
    },
    powerUsed: async (ev) => {
      const el = S.cards.get(ev.uid);
      if (!el) return;
      if (S.limbo === ev.uid) S.limbo = null;
      S.cards.delete(ev.uid);
      const r = stageRect(el);
      fx.burst('gold', r.cx, r.cy);
      el.classList.add('powering');
      setTimeout(() => el.remove(), 560 * motionScale());
      await fx.wait(320);
    },
    addCard: async (ev) => {
      const inst = findInst(ev.uid);
      if (!inst || S.cards.has(ev.uid)) return;
      const el = makeCard(inst);
      const g = geo();
      el.style.transition = 'none';
      place(el, g.playX, g.playY, 0, 0.6);
      el.style.opacity = '0';
      void el.offsetWidth;
      el.style.transition = '';
      el.style.opacity = '';
      place(el, g.playX, g.playY, 0, 0.95);
      await fx.wait(300);
      if (ev.where === 'hand') {
        S.shown.push(ev.uid);
        relayout();
      } else {
        const pile = ev.where === 'discard' ? 'discard' : 'draw';
        S.cards.delete(ev.uid);
        await flyAway(el, pileCenter(pile), 240);
        S.count[pile]++;
        updatePiles();
      }
    },
    damage: async (ev) => {
      const tgt = entRec(ev.target);
      if (!tgt) return;
      if (ev.attack && ev.src && ev.src !== 'player') {
        const src = S.foes.get(ev.src);
        if (src) { fx.pulse(src.body, geo().portrait ? 'lunge-d' : 'lunge-l', 320); await fx.wait(110); }
      }
      const c = artCenter(tgt);
      if (ev.loss > 0) {
        sfx('hit', Math.min(1.6, 0.6 + ev.loss / 20));
        fx.floatText(fxLayer, c.x, c.y, String(ev.loss), 'dmg');
        fx.burst('hit', c.x, c.y);
        fx.pulse(tgt.body, 'hit', 300);
        fx.shake(tgt.body);
      } else if (ev.blocked > 0) {
        sfx('block');
        fx.floatText(fxLayer, c.x, c.y, t('fx.blocked'), 'blk');
        fx.burst('block', c.x, c.y);
      }
      tgt.hp.set(ev.hp, null, ev.block);
      if (ev.target === 'player') hud.setHp(ev.hp);
      await fx.wait(ev.thorns ? 150 : 230);
    },
    hpLoss: async (ev) => {
      const tgt = entRec(ev.target);
      if (!tgt) return;
      const c = artCenter(tgt);
      sfx('venom');
      fx.floatText(fxLayer, c.x, c.y, String(ev.amount), 'venom');
      fx.pulse(tgt.body, 'hit', 300);
      tgt.hp.set(ev.hp, null, null);
      if (ev.target === 'player') hud.setHp(ev.hp);
      await fx.wait(200);
    },
    heal: async (ev) => {
      const tgt = entRec(ev.target);
      if (!tgt) return;
      const c = artCenter(tgt);
      sfx('heal');
      fx.floatText(fxLayer, c.x, c.y, `+${ev.amount}`, 'heal');
      fx.burst('heal', c.x, c.y);
      tgt.hp.set(ev.hp, ev.maxHp ?? null, null);
      if (ev.target === 'player') hud.setHp(ev.hp, ev.maxHp);
      await fx.wait(180);
    },
    block: async (ev) => {
      const tgt = entRec(ev.target);
      if (!tgt) return;
      tgt.hp.set(null, null, ev.block);
      if (ev.reset) return;
      const c = artCenter(tgt);
      sfx('block');
      fx.floatText(fxLayer, c.x, c.y - 20, `+${ev.amount}`, 'blk');
      await fx.wait(150);
    },
    status: async (ev) => {
      const tgt = entRec(ev.target);
      if (!tgt) return;
      const st = (S.disp[ev.target] ??= {});
      if (ev.stacks) st[ev.id] = ev.stacks; else delete st[ev.id];
      const passive = ev.target === 'player' ? null : enemyDef(findFoe(ev.target)?.id ?? '')?.passive;
      renderSts(tgt.sts, st, passive);
      if (ev.negated) { statusFloat(tgt, ev.target, 'ward', ''); await fx.wait(150); return; }
      if (ev.delta > 0) {
        sfx(statusDef(ev.id).kind === 'debuff' ? 'debuff' : 'buff');
        statusFloat(tgt, ev.target, ev.id, ev.delta);
        await fx.wait(140);
      }
    },
    enemyMove: async (ev) => {
      const rec = S.foes.get(ev.uid);
      if (!rec) return;
      fx.pulse(rec.intent, 'acting', 400);
      await fx.wait(170);
    },
    intent: (ev) => {
      const rec = S.foes.get(ev.uid);
      const e = findFoe(ev.uid);
      if (rec && e) renderIntent(rec, e);
    },
    death: async (ev) => {
      const rec = S.foes.get(ev.uid);
      if (!rec) return;
      rec.dying = true;
      const c = artCenter(rec);
      fx.burst('death', c.x, c.y);
      sfx('death');
      rec.el.classList.add('dying');
      setTimeout(() => { rec.el.remove(); S.foes.delete(ev.uid); if (S.alive) layoutFoes(); }, 650 * motionScale());
      await fx.wait(ev.fled ? 120 : 360);
    },
    summon: async (ev) => {
      const e = findFoe(ev.uid);
      if (!e || S.foes.has(e.uid)) return;
      const rec = buildFoe(e);
      updateFoe(rec, e);
      fx.pulse(rec.body, 'arrive', 500);
      layoutFoes();
      await fx.wait(320);
    },
    stance: async (ev) => {
      const rec = S.foes.get(ev.uid);
      if (!rec) return;
      fx.pulse(rec.art, 'spin', 650);
      setTimeout(() => rec.el.classList.toggle('stance-1', ev.stance === 1), 260 * motionScale());
      await fx.wait(460);
    },
    stuck: (ev) => {
      const el = S.cards.get(ev.uid);
      if (el) { el.classList.add('stuck'); fx.pulse(el, 'nope', 360); }
    },
    announce: async (ev) => {
      const rec = S.foes.get(ev.uid);
      if (!rec) return;
      const c = artCenter(rec);
      fx.floatText(fxLayer, c.x, c.y - 80, L(ev.text), 'announce');
      await fx.wait(420);
    },
    relic: (ev) => { hud.flashRelic(ev.id); sfx('relic'); },
    potion: async () => { hud.update(); await fx.wait(150); },
    handFull: () => toast(t('combat.handFull')),
    victory: async () => {
      S.ended = true;
      for (const rec of S.foes.values()) rec.intent.hidden = true;
      sfx('victory');
      await banner(t('combat.victory'), 900);
      if (S.alive) afterVictory(app);
    },
    defeat: async () => {
      S.ended = true;
      sfx('defeat');
      await fx.wait(400);
      showDefeat();
    },
  };

  async function playEvents(events) {
    S.busy = true;
    syncControls();
    positionFlipBtn();
    S.flipsAhead = new Map();
    for (const e of events) if (e.t === 'flip') S.flipsAhead.set(e.uid, (S.flipsAhead.get(e.uid) ?? 0) + 1);
    for (const e of events) {
      if (!S.alive) return;
      const fn = H[e.t];
      if (!fn) continue;
      try { await fn(e); } catch (err) { console.error('fx', e, err); }
    }
    if (!S.alive) return;
    S.busy = false;
    if (!S.ended) syncAll();
    else syncControls();
  }

  function showDefeat() {
    const card = h('div', { class: 'endcard lost', role: 'dialog' },
      h('h2', {}, t('combat.defeat')),
      h('button', { class: 'btn primary', onClick: () => afterDefeat(app) }, t('common.continue')));
    root.append(card);
    card.querySelector('button').focus({ preventScroll: true });
  }

  // ── 키보드 ────────────────────────────────────────────────────────────
  function onKey(e) {
    if (S.ended || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (S.busy) return;
    if (/^[0-9]$/.test(k)) {
      const uid = S.shown[k === '0' ? 9 : Number(k) - 1];
      if (!uid) return;
      e.preventDefault();
      if (S.pick) togglePick(uid);
      else if (S.sel === uid) onCardTap(uid);
      else select(uid);
      return;
    }
    if (k === 'f' || k === 'F') { if (S.sel) doFlip(S.sel); return; }
    if (k === 'e' || k === 'E') { doEndTurn(); return; }
    if (k === 'ArrowLeft' || k === 'ArrowRight') { e.preventDefault(); cycleTarget(k === 'ArrowLeft' ? -1 : 1); return; }
    if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      if (S.pick) confirmPick();
      else if (S.sel) onCardTap(S.sel);
      return;
    }
    if (k === 'Escape') deselect();
  }

  // ── 시작 ──────────────────────────────────────────────────────────────
  const initial = app.fxQueue;
  app.fxQueue = null;
  if (cs0.phase === 'won') {
    syncAll();
    S.ended = true;
    setTimeout(() => S.alive && afterVictory(app), 0);
  } else if (cs0.phase === 'lost') {
    syncAll();
    S.ended = true;
    showDefeat();
  } else if (initial?.length) {
    syncAll({ skipHand: true });
    S.count.draw = cs0.piles.draw.length + initial.filter((e) => e.t === 'draw' && e.from !== 'other').length;
    updatePiles();
    (async () => {
      if (run.fight?.kind === 'boss') {
        const def = enemyDef(cs0.enemies[0].id);
        sfx('boss');
        await banner(`${def.numeral ? `${def.numeral} · ` : ''}${L(def.name)}`, 1400);
      }
      await playEvents(initial);
      if (!S.alive) return;
      if (run.combat?.pending) enterPending();
      if (!app.meta.flags?.tutorial && !run.debug) {
        openOverlay('tutorial', { onClose: () => { app.meta.flags.tutorial = true; persist(); } });
      }
    })();
  } else {
    syncAll();
    if (cs0.pending) enterPending();
  }

  return {
    onKey,
    unmount() {
      S.alive = false;
      fx.unbindCanvas();
      hideTip();
    },
  };
}
