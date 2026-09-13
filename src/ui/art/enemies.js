// 적 SVG. viewBox 0 0 200 200, 발은 y≈186. 색은 CSS 변수(막별 팔레트)로만 칠한다.
// 클래스: .s 그림자 · .b 몸 · .d 어두운 면 · .l 선 · .a 강조(불빛) · .al 강조 선 · .e 눈 · .m 금속/뼈
//        .o/.w 굵은 선으로 그린 몸(바깥선/속)
import { svgMarkup } from '../dom.js';

const shadow = (rx = 48) => `<ellipse class="s" cx="100" cy="188" rx="${rx}" ry="8"/>`;

const A = {
  // ── 1막 ──
  imp: `${shadow(40)}
    <path class="a" d="M100 40c-8 18-22 22-20 44 2-14 12-14 14-24 2 12 10 12 12 0 2 10 12 10 14 24 2-22-12-26-20-44z"/>
    <path class="b" d="M62 150c-4-40 10-68 38-68s42 28 38 68c-2 22-20 34-38 34s-36-12-38-34z"/>
    <path class="d" d="M76 176c6 6 14 8 24 8s18-2 24-8c-8 2-16 3-24 3s-16-1-24-3z"/>
    <path class="l" d="M64 136l-18-12M136 136l18-12M46 124l-4-8M154 124l4-8"/>
    <ellipse class="e" cx="88" cy="118" rx="7" ry="9"/><ellipse class="e" cx="112" cy="118" rx="7" ry="9"/>
    <path class="l" d="M86 142q14 10 28 0"/>`,
  torchbearer: `${shadow(52)}
    <path class="b" d="M58 188c2-58 8-96 42-118 34 22 40 60 42 118z"/>
    <path class="d" d="M74 98c4-34 48-34 52 0-6 14-46 14-52 0z"/>
    <ellipse class="e" cx="91" cy="92" rx="4" ry="5"/><ellipse class="e" cx="109" cy="92" rx="4" ry="5"/>
    <path class="l" d="M128 132l16-16M144 118l14-58"/>
    <path class="a" d="M158 58c-2-10 4-16 8-24 2 8 8 12 6 22-2 8-12 10-14 2z"/>
    <path class="l" d="M70 150h60" style="opacity:.5"/>`,
  beetle: `${shadow(50)}
    <path class="l" d="M52 150l-20 10M52 166l-16 18M148 150l20 10M148 166l16 18"/>
    <path class="b" d="M46 150c0-34 24-58 54-58s54 24 54 58c0 18-24 32-54 32s-54-14-54-32z"/>
    <path class="l" d="M100 96v84"/>
    <path class="d" d="M74 98c4-14 48-14 52 0z"/>
    <circle class="e" cx="90" cy="102" r="4"/><circle class="e" cx="110" cy="102" r="4"/>
    <path class="l" d="M90 92l-12-20M110 92l12-20"/>
    <path class="a" d="M76 70c-3-6 0-11 4-14 1 5 4 7 3 11-1 5-5 6-7 3zM124 70c3-6 0-11-4-14-1 5-4 7-3 11 1 5 5 6 7 3z"/>`,
  wisp: `${shadow(30)}
    <path class="a" d="M100 36c18 22 40 40 40 74 0 30-20 52-40 52s-40-22-40-52c0-20 10-32 18-46 4 12 10 18 16 18-2-16 0-32 6-46z" style="opacity:.85"/>
    <path class="b" d="M100 88c12 12 22 20 22 38 0 16-10 28-22 28s-22-12-22-28c0-16 10-26 22-38z"/>
    <circle class="e" cx="93" cy="126" r="4"/><circle class="e" cx="107" cy="126" r="4"/>`,
  thornling: `${shadow(52)}
    <path class="b" d="M52 184c-6-30 4-60 20-76-10-10-6-26 8-28 4-14 22-18 32-8 14-4 26 8 22 22 14 6 16 24 4 32 12 18 14 40 10 58z"/>
    <path class="l" d="M62 120l-22-8M140 116l22-10M74 90l-12-16M126 88l14-16M100 68v-20M58 150l-20 4M144 150l20 4M80 170l-16 10M120 170l16 10"/>
    <circle class="e" cx="88" cy="130" r="5"/><circle class="e" cx="114" cy="130" r="5"/>
    <path class="l" d="M86 152q14 8 28 0"/>
    <path class="al" d="M70 108c6-4 10-2 12 2M118 104c4-4 10-4 12 0"/>`,
  knightWands: `${shadow(58)}
    <path class="l" d="M130 122l40-90"/>
    <path class="a" d="M170 34c-2-10 4-16 8-24 2 8 8 12 6 22-2 8-12 10-14 2z"/>
    <path class="b" d="M66 186l6-72c2-20 14-34 28-34s26 14 28 34l6 72z"/>
    <path class="d" d="M80 72c0-18 8-30 20-30s20 12 20 30v12H80z"/>
    <path class="e" d="M84 62h32v4H84zM98 62h4v14h-4z"/>
    <path class="a" d="M100 42c-6-12 2-22 10-26 0 10 8 12 6 22-2 8-12 10-16 4z"/>
    <path class="m" d="M56 108h30v36c-6 9-24 9-30 0z"/>
    <path class="l" d="M71 114v24M62 126h18"/>`,
  queenWands: `${shadow(60)}
    <path class="l" d="M142 132l20-72"/>
    <path class="a" d="M162 58c-4-8 2-14 6-18 2 8 6 10 4 16-2 6-8 8-10 2z"/>
    <path class="b" d="M50 186c10-40 22-78 50-96 28 18 40 56 50 96z"/>
    <circle class="d" cx="100" cy="74" r="18"/>
    <path class="a" d="M82 58l6-16 6 10 6-14 6 14 6-10 6 16z"/>
    <circle class="e" cx="93" cy="75" r="3"/><circle class="e" cx="107" cy="75" r="3"/>
    <path class="l" d="M70 140c20 8 40 8 60 0" style="opacity:.6"/>`,
  chariot: `${shadow(84)}
    <path class="b" d="M44 150h112l-10-52H54z"/>
    <path class="m" d="M58 108h84v7H58z"/>
    <path class="d" d="M84 98c0-26 6-42 16-46 10 4 16 20 16 46z"/>
    <circle class="d" cx="100" cy="44" r="12"/>
    <path class="a" d="M86 38l6-14 8 10 8-10 6 14z"/>
    <circle class="e" cx="96" cy="45" r="2"/><circle class="e" cx="104" cy="45" r="2"/>
    <circle class="b" cx="62" cy="160" r="24"/><circle class="b" cx="138" cy="160" r="24"/>
    <path class="l" d="M62 136v48M38 160h48M45 143l34 34M79 143l-34 34M138 136v48M114 160h48M121 143l34 34M155 143l-34 34"/>
    <circle class="a" cx="100" cy="128" r="6"/>`,
  hermit: `${shadow(72)}
    <path class="l" d="M60 186l12-132"/>
    <path class="b" d="M62 186c4-60 16-106 44-122 26 14 36 62 36 122z"/>
    <path class="d" d="M82 98c2-32 44-36 48-2-8 16-40 18-48 2z"/>
    <ellipse class="e" cx="99" cy="90" rx="4" ry="3"/><ellipse class="e" cx="113" cy="90" rx="4" ry="3"/>
    <path class="l" d="M140 120l20 10M162 118v10"/>
    <path class="m" d="M150 128h24l2 32h-28z"/>
    <path class="a" d="M162 134c4 5 6 9 6 13a6 6 0 0 1-12 0c0-4 2-8 6-13z"/>`,

  // ── 2막 ──
  eel: `${shadow(64)}
    <path class="o" style="stroke-width:32" d="M26 170c42 0 44-60 84-60 34 0 40 44 66 28"/>
    <path class="w" style="stroke-width:26" d="M26 170c42 0 44-60 84-60 34 0 40 44 66 28"/>
    <path class="a" d="M98 104l8-18 10 16z" style="opacity:.85"/>
    <circle class="b" cx="178" cy="134" r="16"/>
    <circle class="e" cx="184" cy="128" r="4"/>
    <path class="l" d="M190 142l-7 4M185 147l-7 2"/>`,
  mimic: `${shadow(52)}
    <path class="l" d="M100 138v28"/>
    <path class="b" d="M72 186c8-12 48-12 56 0z"/>
    <path class="b" d="M56 74h88c0 44-18 66-44 66s-44-22-44-66z"/>
    <path class="d" d="M58 76h84v12H58z"/>
    <path class="l" d="M62 88l6 9 6-9 6 9 6-9 6 9 6-9 6 9 6-9 6 9 6-9 6 9 6-9"/>
    <path class="b" d="M50 72c0-18 22-30 50-30s50 12 50 30z"/>
    <ellipse class="e" cx="86" cy="60" rx="5" ry="4"/><ellipse class="e" cx="114" cy="60" rx="5" ry="4"/>
    <path class="m" d="M96 42h8v-8h-8z"/>`,
  wraith: `${shadow(40)}
    <path class="al" d="M36 178c10-6 22-6 32 0s22 6 32 0 22-6 32 0 22 6 32 0"/>
    <path class="b" d="M60 62c10-26 70-26 80 0 10 30 6 70 10 100-10-6-14 6-22 0-8 6-12-6-20 2-8-8-12 4-20-2-8 6-14-6-22 0 4-30 0-70-6-100z"/>
    <ellipse class="e" cx="88" cy="80" rx="6" ry="9"/><ellipse class="e" cx="112" cy="80" rx="6" ry="9"/>
    <path class="l" d="M88 108q12 8 24 0"/>`,
  coral: `${shadow(52)}
    <path class="l" d="M142 186L154 48"/>
    <path class="m" d="M154 46l-7 18h14z"/>
    <path class="b" d="M74 186l4-62c2-18 10-30 22-30s20 12 22 30l4 62z"/>
    <path class="l" d="M122 128l22-6"/>
    <circle class="b" cx="100" cy="80" r="16"/>
    <path class="al" d="M92 64l-8-22M100 62v-26M108 64l8-22M84 44l-7 4M116 44l7 4M100 42l-6-6M100 42l6-6"/>
    <circle class="e" cx="94" cy="82" r="3"/><circle class="e" cx="106" cy="82" r="3"/>`,
  lamprey: `${shadow(38)}
    <path class="l" d="M138 152c16 0 24 10 28 24"/>
    <path class="b" d="M60 150c0-30 18-46 40-46s40 16 40 46-18 34-40 34-40-4-40-34z"/>
    <circle class="d" cx="100" cy="144" r="20"/>
    <path class="l" d="M100 126v8M100 154v8M82 144h8M110 144h8M88 132l5 5M112 132l-5 5M88 156l5-5M112 156l-5-5"/>
    <circle class="e" cx="84" cy="118" r="3"/><circle class="e" cx="116" cy="118" r="3"/>`,
  knightCups: `${shadow(58)}
    <path class="b" d="M66 186l6-72c2-20 14-34 28-34s26 14 28 34l6 72z"/>
    <path class="d" d="M80 72c0-18 8-30 20-30s20 12 20 30v12H80z"/>
    <path class="e" d="M84 62h32v4H84zM98 62h4v14h-4z"/>
    <path class="al" d="M100 42c4-10 14-12 20-6M100 42c-4-12-14-14-20-6"/>
    <path class="l" d="M128 124l16-16"/>
    <path class="m" d="M136 88h28c0 16-7 22-14 22s-14-6-14-22z"/>
    <path class="l" d="M150 110v12M142 124h16"/>
    <path class="a" d="M140 92h20v4h-20z" style="opacity:.8"/>`,
  queenCups: `${shadow(60)}
    <path class="b" d="M48 186c10-42 24-80 52-98 28 18 42 56 52 98z"/>
    <path class="al" d="M56 170c14-6 30-6 44 0s30 6 44 0"/>
    <circle class="d" cx="100" cy="72" r="18"/>
    <path class="al" d="M82 58c4-10 10-14 18-14s14 4 18 14M88 52l-4-10M112 52l4-10M100 48v-12"/>
    <circle class="e" cx="93" cy="73" r="3"/><circle class="e" cx="107" cy="73" r="3"/>
    <path class="m" d="M86 118h28c0 14-7 20-14 20s-14-6-14-20z"/>
    <path class="l" d="M100 138v8M92 148h16"/>`,
  // 매달린 사람은 실제로 거꾸로 매달려 있다
  hangedMan: `
    <path class="l" d="M24 18h152M100 18v26"/>
    <path class="l" d="M92 44l-4 42M108 44l4 26M112 70l-22 14"/>
    <path class="b" d="M80 86h40l-6 60H86z"/>
    <path class="l" d="M82 96l-12 30M118 96l12 30"/>
    <circle class="al" cx="100" cy="164" r="26"/>
    <circle class="b" cx="100" cy="164" r="16"/>
    <circle class="e" cx="94" cy="168" r="3"/><circle class="e" cx="106" cy="168" r="3"/>
    <ellipse class="s" cx="100" cy="194" rx="36" ry="5"/>`,
  priestess: `${shadow(76)}
    <path class="b" d="M34 186V58h16v128zM150 186V58h16v128z"/>
    <path class="m" d="M30 58h24v8H30zM146 58h24v8h-24z"/>
    <path class="b" d="M66 186c6-52 16-88 34-98 18 10 28 46 34 98z"/>
    <circle class="d" cx="100" cy="74" r="16"/>
    <path class="a" d="M84 54a16 16 0 0 0 32 0 12 12 0 0 1-32 0z"/>
    <circle class="e" cx="94" cy="76" r="3"/><circle class="e" cx="106" cy="76" r="3"/>
    <path class="m" d="M86 128h28v22H86z"/>
    <path class="l" d="M90 136h20M90 142h14"/>`,

  // ── 3막 ──
  dancer: `${shadow(48)}
    <path class="b" d="M92 186l4-50-18-30 22-26 22 26-18 30 4 50z"/>
    <circle class="b" cx="100" cy="70" r="12"/>
    <path class="o" style="stroke-width:6" d="M58 92c10-22 28-28 42-20M142 92c-10-22-28-28-42-20"/>
    <path d="M58 92c10-22 28-28 42-20M142 92c-10-22-28-28-42-20" style="fill:none;stroke:var(--parchment-3);stroke-width:3;stroke-linecap:round"/>
    <circle class="e" cx="96" cy="70" r="2.5"/><circle class="e" cx="104" cy="70" r="2.5"/>
    <path class="al" d="M70 152c12 12 48 12 60 0"/>`,
  hawk: `${shadow(40)}
    <path class="b" d="M100 82c-30-30-62-30-86-14 24 0 42 14 58 30-10 4-18 14-20 26 12-8 30-10 48-10s36 2 48 10c-2-12-10-22-20-26 16-16 34-30 58-30-24-16-56-16-86 14z"/>
    <path class="d" d="M88 122c4 20 8 36 12 50 4-14 8-30 12-50z"/>
    <circle class="e" cx="100" cy="98" r="4"/>
    <path class="m" d="M100 102l-6 10h12z"/>
    <path class="al" d="M30 60c12-6 24-6 34 0M136 60c10-6 22-6 34 0"/>`,
  sentry: `${shadow(62)}
    <path class="b" d="M58 186l10-112h64l10 112z"/>
    <ellipse class="m" cx="100" cy="116" rx="28" ry="38"/>
    <ellipse class="a" cx="100" cy="116" rx="18" ry="28" style="opacity:.35"/>
    <path class="l" d="M86 100l10-8M104 136l12-10"/>
    <path class="d" d="M76 78c0-20 10-32 24-32s24 12 24 32z"/>
    <path class="e" d="M86 66h28v4H86z"/>`,
  golem: `${shadow(72)}
    <path class="b" d="M52 186l8-56-20-20 18-42 42-14 42 14 18 42-20 20 8 56z"/>
    <path class="l" d="M60 130l40-20 40 20M100 110V70M72 90l28-20 28 20"/>
    <path class="a" d="M92 98l8-14 8 14-8 10z"/>
    <circle class="e" cx="84" cy="86" r="4"/><circle class="e" cx="116" cy="86" r="4"/>
    <path class="m" d="M36 110l-14-8 6 16zM164 110l14-8-6 16z"/>`,
  oathbreaker: `${shadow(52)}
    <path class="l" d="M124 122l14-46M130 82h16"/>
    <path class="m" d="M138 76l10-32 7 3-8 29z"/>
    <path class="b" d="M70 186l6-80c2-14 12-24 24-24s22 10 24 24l6 80z"/>
    <circle class="d" cx="100" cy="66" r="16"/>
    <circle class="e" cx="94" cy="64" r="3"/><circle class="e" cx="107" cy="70" r="3"/>
    <path class="al" d="M84 56l32 20"/>
    <path class="l" d="M80 142h40" style="opacity:.5"/>`,
  knightSwords: `${shadow(58)}
    <path class="m" d="M142 112l30-84 7 3-27 83z"/>
    <path class="l" d="M134 104l18 8M144 110l-6 12"/>
    <path class="b" d="M66 186l6-72c2-20 14-34 28-34s26 14 28 34l6 72z"/>
    <path class="d" d="M80 72c0-18 8-30 20-30s20 12 20 30v12H80z"/>
    <path class="e" d="M84 62h32v4H84zM98 62h4v14h-4z"/>
    <path class="al" d="M100 42l-16-12M100 42l-4-18M100 42l8-16"/>
    <path class="l" d="M72 150l-18 20M128 150l18 20"/>`,
  kingSwords: `${shadow(84)}
    <path class="d" d="M44 186V70l20-22h72l20 22v116z"/>
    <path class="b" d="M62 186c4-42 16-72 38-82 22 10 34 40 38 82z"/>
    <circle class="b" cx="100" cy="86" r="16"/>
    <path class="a" d="M82 70l6-16 6 10 6-14 6 14 6-10 6 16z"/>
    <circle class="e" cx="94" cy="88" r="3"/><circle class="e" cx="106" cy="88" r="3"/>
    <path class="m" d="M97 26h6v96h-6z"/>
    <path class="l" d="M86 116h28"/>`,
  tower: `${shadow(74)}
    <path class="a" d="M156 8l-26 46h17l-22 42 38-52h-17l20-36z"/>
    <path class="b" d="M64 186V72h72v114z"/>
    <path class="b" d="M56 72h88l-8-18h-8v8h-10v-8h-12v8h-12v-8h-10v8h-8z"/>
    <path class="d" d="M86 186v-36h28v36z"/>
    <path class="e" d="M78 100h12v18H78zM110 120h12v18h-12z"/>
    <path class="l" d="M64 112l20 12M136 92l-16 16M84 150l-6 20"/>
    <path class="m" d="M44 40l10-12 10 12-10 6z" style="opacity:.8"/>`,
  justice: `${shadow(74)}
    <path class="b" d="M64 186c6-58 18-92 36-102 18 10 30 44 36 102z"/>
    <circle class="d" cx="100" cy="70" r="16"/>
    <path class="a" d="M86 56h28l-4-10H90z"/>
    <circle class="e" cx="94" cy="72" r="3"/><circle class="e" cx="106" cy="72" r="3"/>
    <path class="l" d="M84 112l-24-12M60 100v-10M38 90h44M38 90l-10 24M38 90l10 24M82 90l-10 24M82 90l10 24"/>
    <path class="m" d="M26 114h24a12 6 0 0 1-24 0zM70 114h24a12 6 0 0 1-24 0z"/>
    <path class="m" d="M140 36h6v80h-6z"/>
    <path class="l" d="M130 116h26M143 116v14"/>`,

  _generic: `${shadow(46)}
    <path class="b" d="M62 188c0-56 12-92 38-104 26 12 38 48 38 104z"/>
    <path class="d" d="M78 96c2-26 42-26 44 0-8 12-36 12-44 0z"/>
    <ellipse class="e" cx="92" cy="90" rx="4" ry="5"/><ellipse class="e" cx="108" cy="90" rx="4" ry="5"/>
    <path class="l" d="M82 150h36" style="opacity:.5"/>`,
};

export function hasEnemyArt(key) { return Object.prototype.hasOwnProperty.call(A, key); }

export function enemyArt(key) {
  return svgMarkup(A[key] ?? A._generic, { viewBox: '0 0 200 200', cls: 'foe-svg' });
}
