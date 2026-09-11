// 작은 DOM 도우미. h('div', { class: 'x', onClick: fn }, child, ...)

const SVGNS = 'http://www.w3.org/2000/svg';

export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  setAttrs(el, attrs, false);
  append(el, children);
  return el;
}

export function svgEl(tag, attrs, ...children) {
  const el = document.createElementNS(SVGNS, tag);
  setAttrs(el, attrs, true);
  append(el, children);
  return el;
}

// 문자열로 만든 SVG 내부 마크업을 <svg> 로 감싼다(아트 모듈이 문자열을 돌려준다).
export function svgMarkup(inner, { viewBox = '0 0 100 100', cls = '', label } = {}) {
  const el = document.createElementNS(SVGNS, 'svg');
  el.setAttribute('viewBox', viewBox);
  if (cls) el.setAttribute('class', cls);
  if (label) { el.setAttribute('role', 'img'); el.setAttribute('aria-label', label); }
  else el.setAttribute('aria-hidden', 'true');
  el.innerHTML = inner;
  return el;
}

export function clear(el) {
  while (el.firstChild) el.firstChild.remove();
}

function setAttrs(el, attrs, isSvg) {
  if (!attrs) return;
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') {
      if (isSvg) el.setAttribute('class', v); else el.className = v;
    } else if (k === 'style' && typeof v === 'object') {
      for (const [sk, sv] of Object.entries(v)) {
        if (sv == null) continue;
        if (sk.startsWith('--')) el.style.setProperty(sk, sv); else el.style[sk] = sv;
      }
    } else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'text') {
      el.textContent = v;
    } else if (k === 'html') {
      el.innerHTML = v;
    } else if (k === 'dataset') {
      Object.assign(el.dataset, v);
    } else {
      el.setAttribute(k, v === true ? '' : v);
    }
  }
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : String(c));
  }
}
