// 타이틀: 로고 자체가 양면 카드다 — 위는 VERSO(뒷면), 거꾸로 인쇄된 아래는 RECTO(앞면).
import { h, svgMarkup } from '../dom.js';
import { app, goMenu, enterRun, openOverlay, updateSettings, abandonRun } from '../app.js';
import { t, L, getLang } from '../../core/i18n.js';
import { levelProgress } from '../../core/meta.js';
import { CHARACTERS } from '../../core/data/characters.js';

// 점대칭 해·달 문장(태극 형태): 180° 돌려도 같은 그림이 된다.
function medallion() {
  let rays = '';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r1 = 31, r2 = i % 2 ? 36 : 39;
    rays += `<line x1="${50 + Math.cos(a) * r1}" y1="${50 + Math.sin(a) * r1}" x2="${50 + Math.cos(a) * r2}" y2="${50 + Math.sin(a) * r2}"/>`;
  }
  return `
    <circle cx="50" cy="50" r="46" style="fill:none;stroke:var(--gold-deep);stroke-width:1.4"/>
    <circle cx="50" cy="50" r="42.5" style="fill:none;stroke:var(--line-card);stroke-width:1"/>
    <g style="stroke:var(--gold-deep);stroke-width:1.6;stroke-linecap:round">${rays}</g>
    <path d="M50 22a28 28 0 0 1 0 56a14 14 0 0 1 0-28a14 14 0 0 0 0-28z" style="fill:var(--gold)"/>
    <path d="M50 78a28 28 0 0 1 0-56a14 14 0 0 1 0 28a14 14 0 0 0 0 28z" style="fill:var(--card-ink)"/>
    <circle cx="50" cy="36" r="4.2" style="fill:var(--card-ink)"/>
    <circle cx="50" cy="64" r="4.2" style="fill:var(--gold)"/>`;
}

function face(word, gloss, side) {
  return h('div', { class: `tface ${side}` },
    h('span', { class: 'tnum' }, 'XXII'),
    h('span', { class: 'tword' }, word),
    h('span', { class: 'tgloss' }, gloss));
}

function menuItem(label, sub, onClick, cls = '') {
  return h('button', { class: `menu-item ${cls}`, onClick },
    h('span', { class: 'label' }, label),
    sub ? h('span', { class: 'sub' }, sub) : null);
}

export function mount(root) {
  const run = app.run;
  const ko = getLang() === 'ko';

  // 처음엔 RECTO 가 위(뒤집힌 상태)였다가 곧 VERSO 로 돌아선다.
  const card = h('button', {
    class: 'tcard rev',
    'aria-label': 'VERSO',
    onClick: () => card.classList.toggle('rev'),
  },
  face('VERSO', ko ? '뒷면' : 'the reverse side', 'a'),
  face('RECTO', ko ? '앞면' : 'the front side', 'b'),
  h('div', { class: 'tmedal' }, svgMarkup(medallion())));

  const items = [];
  if (run) {
    items.push(menuItem(t('title.continue'),
      t('title.runInfo', { char: L(CHARACTERS[run.char]?.name), act: run.act, floor: run.floor }),
      () => enterRun(), 'primary'));
  }
  items.push(menuItem(t('title.newRun'), '', () => {
    if (!app.run) return goMenu('charselect');
    openOverlay('confirm', {
      title: t('title.abandonTitle'),
      body: t('title.abandonBody'),
      okLabel: t('title.abandonOk'),
      danger: true,
      onOk: () => { abandonRun({ silent: true }); goMenu('charselect'); },
    });
  }, run ? '' : 'primary'));
  items.push(menuItem(t('title.compendium'), '', () => goMenu('compendium')));
  items.push(menuItem(t('title.settings'), '', () => openOverlay('settings')));

  const lp = levelProgress(app.meta.insight ?? 0);
  const metaLine = h('div', { class: 'title-meta' },
    h('div', { class: 'title-meta-row' },
      h('span', { class: 'lv' }, t('title.level', { level: lp.level })),
      h('span', { class: 'num dim' }, lp.next == null
        ? t('title.maxLevel', { cur: app.meta.insight })
        : t('title.insight', { cur: app.meta.insight, next: lp.next }))),
    h('div', { class: 'bar' }, h('i', { style: { transform: `scaleX(${lp.frac})` } })));

  const lang = h('div', { class: 'title-lang seg', role: 'group', 'aria-label': t('settings.lang') },
    ['ko', 'en'].map((l) => h('button', {
      'aria-pressed': String(getLang() === l),
      onClick: () => updateSettings({ lang: l }),
    }, l === 'ko' ? '한국어' : 'English')));

  root.append(
    h('div', { class: 'title-card-wrap' }, card),
    h('div', { class: 'title-side' },
      h('h1', { class: 'title-tagline' }, t('title.tagline')),
      h('p', { class: 'title-sub' }, t('title.sub')),
      h('nav', { class: 'title-menu' }, items),
      metaLine),
    lang,
    h('div', { class: 'title-version' }, 'VERSO v0.1'));

  const timer = setTimeout(() => card.classList.remove('rev'), 700);
  return { unmount() { clearTimeout(timer); } };
}
