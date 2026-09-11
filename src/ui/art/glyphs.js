// 카드·유물 문장(紋章). 100×100 좌표, 중심 (50,50). 선은 currentColor, .gf 는 채움.
import { svgMarkup } from '../dom.js';

const G = {
  sword: '<path d="M50 18l5 9v37h-10V27z"/><path d="M34 64h32M50 64v13"/><circle cx="50" cy="80" r="3.2"/>',
  shield: '<path d="M50 20l23 8v21c0 15-10 26-23 32-13-6-23-17-23-32V28z"/><path d="M50 30v42M36 44h28"/>',
  wheel: '<circle cx="50" cy="50" r="26"/><circle cx="50" cy="50" r="7"/><path d="M50 24v19M50 57v19M24 50h19M57 50h19M31.6 31.6l13.4 13.4M55 55l13.4 13.4M31.6 68.4L45 55M55 45l13.4-13.4"/>',
  coin: '<circle cx="50" cy="50" r="25"/><circle cx="50" cy="50" r="18"/><path d="M50 38l3.5 8.5 9 .7-6.9 5.8 2.2 8.8L50 57l-7.8 4.8 2.2-8.8-6.9-5.8 9-.7z"/>',
  bolt: '<path d="M57 17L33 54h17l-6 29 24-38H51z"/>',
  leaf: '<path d="M27 73c0-27 20-46 47-48 0 27-19 46-47 48z"/><path d="M27 73l35-35M44 56h12M52 48l-1-11"/>',
  sun: '<circle cx="50" cy="50" r="12"/><path d="M50 22v10M50 68v10M22 50h10M68 50h10M30 30l7 7M63 63l7 7M30 70l7-7M63 37l7-7"/>',
  moon: '<path d="M62 24a28 28 0 1 0 0 52 22 22 0 0 1 0-52z"/>',
  star: '<path d="M50 18l7 25 25 7-25 7-7 25-7-25-25-7 25-7z"/><path d="M50 36v28M36 50h28"/>',
  eye: '<path d="M18 50s13-18 32-18 32 18 32 18-13 18-32 18-32-18-32-18z"/><circle cx="50" cy="50" r="9"/><circle cx="50" cy="50" r="3.5" class="gf"/>',
  cup: '<path d="M33 26h34c0 20-8 30-17 30s-17-10-17-30z"/><path d="M50 56v17M38 77h24M36 34h28"/>',
  wand: '<path d="M30 76l32-40"/><path d="M66 18l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/><path d="M26 72l8 8"/>',
  key: '<circle cx="36" cy="36" r="12"/><path d="M45 45l30 30M64 64l-7 7M70 70l-6 6"/>',
  flame: '<path d="M50 18c9 13 20 22 20 38a20 20 0 0 1-40 0c0-10 6-15 9-22 2 7 5 10 8 10 0-9 1-17 3-26z"/><path d="M50 56c4 5 7 8 7 13a7 7 0 0 1-14 0c0-5 3-8 7-13z"/>',
  wave: '<path d="M18 38c8-8 16-8 24 0s16 8 24 0 12-6 16-4M18 52c8-8 16-8 24 0s16 8 24 0 12-6 16-4M18 66c8-8 16-8 24 0s16 8 24 0 12-6 16-4"/>',
  feather: '<path d="M74 22C50 24 34 40 30 64l-6 14"/><path d="M30 64c14 0 28-8 36-22M38 52h20M34 60l6-12"/>',
  mask: '<path d="M22 34c10-6 46-6 56 0 0 22-10 38-28 40-18-2-28-18-28-40z"/><path d="M34 44c4-4 10-4 12 1M54 45c2-5 8-5 12-1M40 62c6 4 14 4 20 0"/>',
  tower: '<path d="M36 80V36h28v44M32 36h36l-4-12h-4v6h-4v-6h-8v6h-4v-6h-4z"/><path d="M46 80v-12h8v12M57 22l-6 10h6l-6 10"/>',
  crown: '<path d="M22 38l14 12 14-22 14 22 14-12-6 34H28z"/><path d="M28 64h44"/>',
  skull: '<path d="M50 20a24 24 0 0 0-24 24c0 9 4 15 10 19v11h28V63c6-4 10-10 10-19a24 24 0 0 0-24-24z"/><circle cx="41" cy="45" r="5" class="gf"/><circle cx="59" cy="45" r="5" class="gf"/><path d="M45 74v-6M55 74v-6"/>',
  hand: '<path d="M38 78V46l-6-10a4 4 0 0 1 7-4l5 8V24a4 4 0 0 1 8 0v18-22a4 4 0 0 1 8 0v22-16a4 4 0 0 1 8 0v30c0 16-8 24-18 24-8 0-12-2-12-2z"/>',
  serpent: '<path d="M28 30c10-10 30-6 30 8S42 54 42 64s20 16 30 6"/><circle cx="28" cy="30" r="3" class="gf"/><path d="M72 70l6 4M72 70l2 7"/>',
  hourglass: '<path d="M32 20h36M32 80h36M36 20c0 18 14 20 14 30S36 62 36 80M64 20c0 18-14 20-14 30s14 12 14 30"/>',
  scales: '<path d="M50 20v58M36 78h28M24 32h52M24 32l-8 20h16zM76 32l-8 20h16z"/><path d="M16 52a8 4 0 0 0 16 0M68 52a8 4 0 0 0 16 0"/>',
  chain: '<rect x="20" y="40" width="28" height="20" rx="10"/><rect x="52" y="40" width="28" height="20" rx="10"/><path d="M40 50h20"/>',
  heart: '<path d="M50 76s-26-15-26-33c0-9 7-15 14-15 6 0 10 4 12 8 2-4 6-8 12-8 7 0 14 6 14 15 0 18-26 33-26 33z"/>',
  spiral: '<path d="M50 50c0-3 4-4 6-2 3 3 1 9-4 10-7 1-12-6-10-13 3-9 14-12 22-7 10 7 10 22 1 30-11 9-28 7-35-5-8-14-2-32 13-37"/>',
  crystal: '<path d="M50 18l16 20-16 44-16-44z"/><path d="M34 38h32M50 18v64"/>',
  mirror: '<ellipse cx="50" cy="42" rx="18" ry="22"/><path d="M50 64v16M40 80h20M42 32c3-4 8-6 12-5"/>',
  cards: '<rect x="24" y="26" width="30" height="42" rx="4" transform="rotate(-10 39 47)"/><rect x="46" y="30" width="30" height="42" rx="4" transform="rotate(10 61 51)"/>',
  arrow: '<path d="M22 78l52-52M74 26H56M74 26v18M22 78l6-14M22 78l14-6"/>',
  orb: '<circle cx="50" cy="50" r="24"/><path d="M34 44c6-10 20-12 28-4"/><circle cx="50" cy="50" r="9" class="gf"/>',
  bell: '<path d="M32 66c4-4 4-10 4-20a14 14 0 0 1 28 0c0 10 0 16 4 20z"/><path d="M28 66h44M46 72a4 4 0 0 0 8 0M50 22v10"/>',
  rune: '<path d="M40 20v60M40 30l20 14-20 14M60 56v24"/>',
  thorn: '<path d="M50 20v60M50 34l-12-8M50 46l12-8M50 58l-12-8M50 70l12-8"/>',
  drop: '<path d="M50 18c12 16 22 28 22 40a22 22 0 0 1-44 0c0-12 10-24 22-40z"/><path d="M40 60a10 10 0 0 0 8 10"/>',
  lemniscate: '<path d="M50 50c-6-9-12-14-19-14a14 14 0 0 0 0 28c7 0 13-5 19-14s12-14 19-14a14 14 0 0 1 0 28c-7 0-13-5-19-14z"/>',
  lantern: '<path d="M40 30h20l4 8v26l-4 8H40l-4-8V38z"/><path d="M44 22h12M50 22v-4M36 38h28M36 64h28"/><path d="M50 44c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9z" class="gf"/>',
  pentacle: '<circle cx="50" cy="50" r="26"/><path d="M50 26l14 42-36-26h44l-36 26z"/>',
  anchor: '<circle cx="50" cy="26" r="6"/><path d="M50 32v48M36 42h28M24 60c4 14 14 20 26 20s22-6 26-20M24 60l-4 6M76 60l4 6"/>',
  web: '<path d="M50 18v64M18 50h64M27 27l46 46M73 27L27 73"/><path d="M50 34l11 5 5 11-5 11-11 5-11-5-5-11 5-11z"/>',
  quill: '<path d="M26 78c10-26 26-44 50-56-4 20-16 36-40 44"/><path d="M26 78l14-26"/>',
  dagger: '<path d="M50 16l6 12v30h-12V28z"/><path d="M38 58h24M50 58v14"/><path d="M44 76h12"/>',
  crescent2: '<path d="M38 24a26 26 0 1 0 0 52 20 20 0 0 1 0-52zM62 76a26 26 0 1 0 0-52 20 20 0 0 1 0 52z"/>',
  bindle: '<path d="M22 80L68 28"/><path d="M60 22c10-7 24 0 22 13-2 13-19 17-27 9-6-6-4-16 5-22z"/><path d="M64 30l6-7"/>',
  dog: '<path d="M26 74c-4-16 4-30 18-33l8-14 5 13h9c9 0 15 7 15 15v4l-11 4-4 9c-2 7-9 9-15 7-6 7-18 5-25-5z"/><circle cx="60" cy="46" r="3" class="gf"/><path d="M78 58l7 2M40 60l-6 12"/>',
  curtain: '<path d="M16 22h68M20 22c0 20 8 40 22 58M80 22c0 20-8 40-22 58M42 80h16M30 22v7M50 22v7M70 22v7"/>',
  rope: '<path d="M12 64c22-10 54-10 76 0"/><circle cx="50" cy="26" r="6"/><path d="M50 32v20M36 42h28M44 52l-4 8M56 52l4 8"/>',
};

export function glyphMarkup(name) {
  return `<g class="glyph">${G[name] ?? G.star}</g>`;
}

export function glyph(name, cls = 'glyph-svg') {
  return svgMarkup(glyphMarkup(name), { viewBox: '0 0 100 100', cls });
}

export function hasGlyph(name) { return Object.prototype.hasOwnProperty.call(G, name); }
export const GLYPH_NAMES = Object.keys(G);
