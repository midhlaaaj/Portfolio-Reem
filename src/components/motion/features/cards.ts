import { engine } from '../engine';

/** Folder tab nudges up on hover (6px) and sits higher (10px) once the card has lifted into view. */
export function tabPos(tab: HTMLElement) {
  const lifted = tab.dataset.lift === '1';
  const up = tab.dataset.hover === '1' || lifted;
  tab.style.transform = up ? `translate3d(0,${lifted ? -10 : -6}px,0)` : 'translate3d(0,0,0)';
}

function cardHover(card: Element, on: boolean) {
  if (engine.touch) return;
  const tab = card.querySelector<HTMLElement>('[data-card-tab]');
  const cover = card.querySelector<HTMLElement>('[data-card-cover]');
  if (tab) {
    tab.dataset.hover = on ? '1' : '0';
    tabPos(tab);
  }
  if (cover) cover.style.transform = on ? 'scale(1.04)' : 'scale(1)';
}

type CursorApi = { setLabel(label: string): void };
let cursorApi: CursorApi | null = null;
let hovered: Element | null = null;
let label = '';
let lightboxOpen = false;

export const cursor = {
  register(api: CursorApi | null) {
    cursorApi = api;
  },
  setLightbox(open: boolean) {
    lightboxOpen = open;
    hoverAt(engine.target);
  },
};

/** Card hover (cover zoom, tab lift) and the custom cursor's label (View, Open, Drag, Play) for whatever is under the pointer. */
export function hoverAt(target: Element | null) {
  const card = target?.closest('[data-fcard]') ?? null;
  if (card !== hovered) {
    if (hovered) cardHover(hovered, false);
    if (card) cardHover(card, true);
    hovered = card;
  }
  const holder = target?.closest<HTMLElement>('[data-cursor]') ?? null;
  let next = holder?.dataset.cursor ?? '';
  if (engine.cursorFilter) next = engine.cursorFilter(next, holder);
  if (lightboxOpen) next = '';
  if (next !== label) {
    label = next;
    cursorApi?.setLabel(next);
  }
}
