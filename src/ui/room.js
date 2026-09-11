// 방 화면들이 함께 쓰는 작은 조각
import { h } from './dom.js';

export function choice(ic, title, desc, onClick, disabled = false) {
  return h('button', { class: 'choice', onClick, disabled },
    h('span', { class: 'choice-ico' }, ic),
    h('span', { class: 'choice-t' }, title),
    h('span', { class: 'choice-d dim' }, desc));
}

export function stat(label, value) {
  return h('div', {}, h('dt', {}, label), h('dd', {}, String(value)));
}
