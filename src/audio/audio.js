// 합성 효과음과 생성형 음악 — 에셋 파일 없이 WebAudio 로만 만든다.
// 브라우저 정책상 첫 사용자 입력 뒤에 AudioContext 를 연다. 오디오가 없는 환경에서는 조용히 아무것도 하지 않는다.

let ctx = null;
let sfxBus = null;
let musicBus = null;
let noiseBuf = null;
let vol = { sfx: 0.7, music: 0.45 };
let wanted = null;   // 재생하고 싶은 음악 트랙(컨텍스트가 열리기 전에도 기억)
let current = null;  // { name, stop() }

export function setVolumes(sfx, music) {
  vol = { sfx, music };
  if (!ctx) return;
  sfxBus.gain.setTargetAtTime(sfx, ctx.currentTime, 0.05);
  musicBus.gain.setTargetAtTime(music * 0.5, ctx.currentTime, 0.2);
}

export function unlockAudio() {
  if (ctx) {
    if (ctx.state === 'suspended' && !document.hidden) ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try {
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    comp.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = vol.sfx;
    sfxBus.connect(comp);
    musicBus = ctx.createGain();
    musicBus.gain.value = vol.music * 0.5;
    musicBus.connect(comp);
    const len = ctx.sampleRate;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (wanted) current = startMusic(wanted);
  } catch {
    ctx = null;
  }
}

export function suspendAudio(hidden) {
  if (!ctx) return;
  if (hidden) ctx.suspend();
  else ctx.resume();
}

// ── 효과음 ─────────────────────────────────────────────────────────────
function envelope(g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function tone({ type = 'sine', f = 440, f2 = null, t = 0, a = 0.005, d = 0.2, gain = 0.3, bus = sfxBus }) {
  const now = ctx.currentTime + t;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, now);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, now + a + d);
  const g = ctx.createGain();
  envelope(g, now, a, gain, d);
  o.connect(g);
  g.connect(bus);
  o.start(now);
  o.stop(now + a + d + 0.05);
}

function noise({ t = 0, a = 0.005, d = 0.15, gain = 0.3, type = 'bandpass', f = 1200, f2 = null, q = 1, bus = sfxBus }) {
  const now = ctx.currentTime + t;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const filt = ctx.createBiquadFilter();
  filt.type = type;
  filt.frequency.setValueAtTime(f, now);
  if (f2) filt.frequency.exponentialRampToValueAtTime(f2, now + a + d);
  filt.Q.value = q;
  const g = ctx.createGain();
  envelope(g, now, a, gain, d);
  src.connect(filt);
  filt.connect(g);
  g.connect(bus);
  src.start(now, Math.random() * 0.5);
  src.stop(now + a + d + 0.05);
}

const SFX = {
  click: () => tone({ f: 720, d: 0.05, gain: 0.06 }),
  draw: () => noise({ f: 2400, f2: 1400, d: 0.08, gain: 0.1, q: 0.8 }),
  play: () => { noise({ f: 900, f2: 2600, d: 0.12, gain: 0.12 }); tone({ type: 'triangle', f: 440, f2: 620, d: 0.12, gain: 0.07 }); },
  flip: () => {
    noise({ f: 700, f2: 3200, d: 0.2, gain: 0.14, q: 1.4 });
    tone({ f: 880, d: 0.25, gain: 0.045, t: 0.08 });
    tone({ f: 1320, d: 0.3, gain: 0.035, t: 0.1 });
  },
  hit: (p = 1) => {
    tone({ f: 140 * (1 + 0.1 * Math.random()), f2: 45, d: 0.16 + 0.06 * p, gain: 0.3 * p });
    noise({ type: 'lowpass', f: 1600, d: 0.07, gain: 0.18 * p });
  },
  block: () => { tone({ type: 'triangle', f: 1180, d: 0.22, gain: 0.09 }); tone({ f: 1770, d: 0.18, gain: 0.045 }); },
  venom: () => { for (let i = 0; i < 3; i++) tone({ f: 320 + Math.random() * 200, f2: 520, d: 0.06, gain: 0.07, t: i * 0.06 }); },
  buff: () => [523, 659, 784].forEach((f, i) => tone({ type: 'triangle', f, d: 0.14, gain: 0.07, t: i * 0.06 })),
  debuff: () => [494, 392, 311].forEach((f, i) => tone({ type: 'triangle', f, d: 0.14, gain: 0.07, t: i * 0.06 })),
  gold: () => { tone({ f: 1760, d: 0.1, gain: 0.07 }); tone({ f: 2349, d: 0.18, gain: 0.06, t: 0.06 }); },
  relic: () => [1046, 1318, 1568].forEach((f, i) => tone({ f, d: 0.6, gain: 0.06, t: i * 0.08 })),
  heal: () => [392, 523, 659].forEach((f, i) => tone({ f, d: 0.3, gain: 0.06, t: i * 0.07 })),
  death: () => { noise({ type: 'lowpass', f: 1200, f2: 200, d: 0.5, gain: 0.18 }); tone({ f: 220, f2: 70, d: 0.5, gain: 0.1 }); },
  turn: () => { tone({ f: 660, d: 0.35, gain: 0.05 }); tone({ f: 990, d: 0.3, gain: 0.025, t: 0.02 }); },
  victory: () => [523, 659, 784, 1046].forEach((f, i) => tone({ type: 'triangle', f, d: 0.5, gain: 0.09, t: i * 0.1 })),
  defeat: () => [220, 207, 185].forEach((f, i) => tone({ type: 'sawtooth', f, d: 0.8, gain: 0.04, t: i * 0.3 })),
  boss: () => {
    tone({ f: 82, d: 2.2, gain: 0.28 });
    tone({ f: 123, d: 1.8, gain: 0.1 });
    tone({ f: 207, d: 1.4, gain: 0.07 });
    noise({ type: 'lowpass', f: 400, d: 0.6, gain: 0.13 });
  },
  error: () => tone({ type: 'square', f: 150, d: 0.08, gain: 0.04 }),
};

export function sfx(name, power) {
  if (!ctx || ctx.state !== 'running' || vol.sfx <= 0) return;
  try { SFX[name]?.(power); } catch { /* 오디오 오류로 게임을 멈추지 않는다 */ }
}

// ── 음악 ───────────────────────────────────────────────────────────────
// 1막 D 도리안 · 2막 A 에올리안(+딜레이) · 3막 E 프리지안 · 보스는 빠른 박동
const TRACKS = {
  title: { root: 50, steps: [0, 2, 3, 5, 7, 9, 10], bpm: 52, wave: 'sine' },
  act1: { root: 50, steps: [0, 2, 3, 5, 7, 9, 10], bpm: 64, wave: 'triangle' },
  act2: { root: 57, steps: [0, 2, 3, 5, 7, 8, 10], bpm: 58, wave: 'sine', delay: true },
  act3: { root: 52, steps: [0, 1, 3, 5, 7, 8, 10], bpm: 70, wave: 'triangle' },
  boss: { root: 45, steps: [0, 1, 3, 5, 6, 8, 10], bpm: 100, wave: 'triangle', pulse: true },
};
const hz = (n) => 440 * 2 ** ((n - 69) / 12);

export function playMusic(name) {
  wanted = name;
  if (!ctx || current?.name === name) return;
  current?.stop();
  current = startMusic(name);
}

export function stopMusic() {
  wanted = null;
  current?.stop();
  current = null;
}

function note(f, t, dur, type, dest, gain) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = f;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2200;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lp);
  lp.connect(g);
  g.connect(dest);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function kick(t, dest) {
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.16, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  o.connect(g);
  g.connect(dest);
  o.start(t);
  o.stop(t + 0.25);
}

function startMusic(name) {
  const T = TRACKS[name];
  if (!T) return null;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, ctx.currentTime);
  out.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 2.5);
  out.connect(musicBus);

  let notes = out;
  if (T.delay) {
    const dl = ctx.createDelay(1);
    dl.delayTime.value = 0.42;
    const fb = ctx.createGain();
    fb.gain.value = 0.35;
    dl.connect(fb);
    fb.connect(dl);
    dl.connect(out);
    notes = ctx.createGain();
    notes.connect(out);
    notes.connect(dl);
  }

  // 드론: 근음 + 5도, 저역 통과 필터를 느린 LFO 로 흔든다
  const drone = [0, 7].map((iv, i) => {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = hz(T.root - 12 + iv);
    o.detune.value = i ? 6 : -6;
    return o;
  });
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 380;
  lp.Q.value = 0.7;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 160;
  lfo.connect(lfoGain);
  lfoGain.connect(lp.frequency);
  const dg = ctx.createGain();
  dg.gain.value = 0.07;
  for (const o of drone) o.connect(lp);
  lp.connect(dg);
  dg.connect(out);
  for (const o of drone) o.start();
  lfo.start();

  // 아르페지오: 음계에서 결정적 의사난수로 고른다(같은 트랙은 늘 같은 흐름)
  const beat = 60 / T.bpm / 2;
  let seed = [...name].reduce((a, c) => a + c.charCodeAt(0), 7);
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let next = ctx.currentTime + 0.4;
  let step = 0;
  const timer = setInterval(() => {
    if (ctx.state !== 'running') return;
    if (next < ctx.currentTime - 0.1) next = ctx.currentTime + 0.05;   // 탭이 쉬었다 돌아오면 밀린 음을 몰아 치지 않는다
    while (next < ctx.currentTime + 0.4) {
      if (rnd() < 0.6) {
        const deg = T.steps[Math.floor(rnd() * T.steps.length)];
        note(hz(T.root + deg + (rnd() < 0.3 ? 12 : 0)), next, beat * 1.8, T.wave, notes, 0.05);
      }
      if (step % 8 === 0) note(hz(T.root - 12), next, beat * 7, 'sine', out, 0.07);
      if (T.pulse && step % 2 === 0) kick(next, out);
      next += beat;
      step++;
    }
  }, 100);

  return {
    name,
    stop() {
      clearInterval(timer);
      const t = ctx.currentTime;
      out.gain.cancelScheduledValues(t);
      out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), t);
      out.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      setTimeout(() => {
        try { for (const o of drone) o.stop(); lfo.stop(); out.disconnect(); } catch { /* 이미 멈춤 */ }
      }, 1400);
    },
  };
}
