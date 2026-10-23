import { gsap, ScrollTrigger } from '../gsap';
import { BP, clamp, engine, mul, scrollToY, seg } from '../engine';

declare global {
  interface Window {
    __t0?: number;
  }
}

type Deck = { rank: number; out: number };

const OUT = gsap.parseEase('rfOut');
const IO = gsap.parseEase('rfIo');

/**
 * Home hero: the folder rises and the name reveals (once per session), then as you scroll the folder opens, its three
 * papers spread out under "A little bit of everything.", and the featured project folders stack and darken.
 * The maths is the design's, driven by one scroll progress value that eases toward the real one.
 */
export function setupHero(): () => void {
  const q = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s);
  const wrap = q('[data-hero-wrap]');
  const stage = q('[data-stage]');
  const anchor = q('[data-fold-anchor]');
  const sink = q('[data-fold-sink]');
  const intro = q('[data-fold-intro]');
  const tilt = q('[data-fold-tilt]');
  const tab = q('[data-fold-tab]');
  const front = q('[data-fold-front]');
  const shadow = q('[data-fold-shadow]');
  const back = q('[data-fold-back]');
  const pl = q('[data-paper="l"]');
  const pr = q('[data-paper="r"]');
  const pm = q('[data-paper="m"]');
  const name = q('[data-hero-name]');
  const n0 = q('[data-name-line="0"]');
  const n1 = q('[data-name-line="1"]');
  const ui = q('[data-hero-ui]');
  const blob = q('[data-hero-light]');
  const spread = q('[data-spread-ui]');
  const reel = q<HTMLVideoElement>('[data-showreel]');
  const spreadLines = Array.from(document.querySelectorAll<HTMLElement>('[data-spread-line]'));
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-card]'));
  const shades = cards.map((c) => Array.from(c.querySelectorAll<HTMLElement>('[data-shade]')));
  if (
    !wrap ||
    !stage ||
    !anchor ||
    !sink ||
    !intro ||
    !tilt ||
    !tab ||
    !front ||
    !shadow ||
    !pl ||
    !pr ||
    !pm ||
    !name ||
    !n0 ||
    !n1 ||
    !ui
  ) {
    return () => {};
  }

  const red = engine.reduced;
  const v = { blob: 0, fold: 0, n0: 0, n1: 0, tab: 0, peek: 0, ui: 0, stage: 1, tiltOn: 0, hover: 0 };
  const s = { sp: 0, snap: true, interactive: false, hovering: false, p: 0 };
  let g = { sw: 0, sh: 0, ax: 0, ay: 0, W: 0, H: 0 };
  let cardTops: number[] = [];
  /** Last frame's inputs; when identical the frame has nothing to write. Cleared whenever geometry changes. */
  let lastSig: number[] | null = null;
  engine.nav = 0;

  // ---- geometry (mobile sizes the folder to the space between the name and the buttons) ----
  const layout = () => {
    if (engine.mobile) {
      const s0 = stage.getBoundingClientRect();
      const nr = name.getBoundingClientRect();
      const ur = ui.getBoundingClientRect();
      const nb = nr.bottom - s0.top;
      const avail = Math.max(180, ur.top - s0.top - nb);
      const fw = Math.round(Math.max(140, Math.min(innerWidth * 0.62, (avail - 64) / 1.36, 300)));
      anchor.style.width = `${fw}px`;
      anchor.style.top = `${Math.round(nb + avail / 2 + fw * 1.25 * 0.03)}px`;
    } else {
      anchor.style.top = '';
      anchor.style.width = '';
    }
    const sr = stage.getBoundingClientRect();
    const ar = anchor.getBoundingClientRect();
    g = {
      sw: sr.width,
      sh: sr.height,
      ax: ar.left - sr.left,
      ay: ar.top - sr.top,
      W: tilt.offsetWidth,
      H: tilt.offsetHeight,
    };
    cardTops = cards.map((c) => parseFloat(getComputedStyle(c).top) || 0);
    lastSig = null;
  };
  layout();

  // On phones the big name sits just under the header, so the header's small one stays hidden until the hero is scrolled.
  const root = document.documentElement;
  const syncBrand = () =>
    root.classList.toggle(
      'hero-top',
      innerWidth < BP && scrollY < (red ? innerHeight * 0.5 : (wrap.offsetHeight - innerHeight) * 0.45),
    );
  syncBrand();
  addEventListener('scroll', syncBrand, { passive: true });

  const onResize = () => {
    layout();
    syncBrand();
    ScrollTrigger.refresh();
  };
  addEventListener('resize', onResize);
  document.fonts?.ready.then(layout);

  // ---- scroll progress through the 260vh wrapper ----
  const st = red
    ? null
    : ScrollTrigger.create({
        trigger: wrap,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => (s.p = self.progress),
      });
  if (st) s.p = st.progress;

  // ---- intro ----
  const to = (vars: gsap.TweenVars) => gsap.to(v, vars);
  const finish = () => Object.assign(v, { blob: 1, fold: 1, n0: 1, n1: 1, tab: 1, peek: 1, ui: 1 });
  const timers: (gsap.core.Tween | gsap.core.Timeline)[] = [];
  /** Set by the pre-paint script on a first visit to Home; CSS animates the folder until this code takes over. */
  const cssIntro = document.documentElement.classList.contains('intro-first');
  if (red) {
    finish();
    engine.nav = 1;
    s.interactive = true;
  } else {
    let seen = false;
    try {
      seen = sessionStorage.getItem('rf-intro-seen') === '1';
      sessionStorage.setItem('rf-intro-seen', '1');
    } catch {}
    const arrived = engine.arrival?.t === 'wipe' || engine.backNav;
    if (seen || arrived) {
      // Repeat visits skip straight to the end state.
      finish();
      engine.nav = 1;
      v.stage = 0;
      to({ stage: 1, duration: 0.3, ease: OUT, delay: arrived ? 0.35 : 0 });
      s.interactive = true;
      to({ tiltOn: 1, duration: 0.65, ease: OUT, delay: 0.4 });
    } else {
      // The first visit's intro, as one timeline. CSS has already been rising the folder since first paint (so the
      // page never waits on JavaScript to show something); jump to however far along that is.
      const tl = gsap.timeline();
      tl.to(v, { blob: 1, duration: 1.2, ease: OUT }, 0)
        .to(v, { fold: 1, duration: 1.1, ease: OUT }, 0.1)
        .to(v, { n0: 1, duration: 0.9, ease: OUT }, 0.55)
        .to(v, { n1: 1, duration: 0.9, ease: OUT }, 0.64)
        .to(v, { tab: 1, duration: 0.5, ease: 'rfSpring' }, 0.9)
        .to(v, { peek: 1, duration: 0.5, ease: 'rfSpring' }, 0.9)
        .to(v, { ui: 1, duration: 0.4, ease: OUT }, 1.1)
        .to(engine, { nav: 1, duration: 0.4, ease: OUT }, 1.1)
        .call(
          () => {
            s.interactive = true;
            to({ tiltOn: 1, duration: 0.65, ease: OUT });
          },
          [],
          1.5,
        );
      if (cssIntro)
        tl.time(Math.min(5, Math.max(0, (performance.now() - (window.__t0 ?? performance.now())) / 1000)), false);
      timers.push(tl);
    }
  }

  // "Open" cursor only while the folder is closed and the intro is done.
  engine.cursorFilter = (label) => (label === 'Open' && (s.sp > 0.05 || !s.interactive) ? '' : label);

  // ---- phone end state: once the folder is open the top poster slides off and drops to the back, on a loop ----
  const deck: Deck[] = [
    { rank: 1, out: 0 },
    { rank: 0, out: 0 },
    { rank: 2, out: 0 },
  ];
  let cycle: gsap.core.Tween | null = null;
  const stopDeck = () => {
    cycle?.kill();
    cycle = null;
    deck.forEach((d, i) => {
      gsap.killTweensOf(d);
      Object.assign(d, { rank: [1, 0, 2][i], out: 0 });
    });
  };
  const nextCard = () => {
    const front = deck.find((d) => d.rank < 0.5)!;
    gsap.to(front, { out: 1, duration: 0.55, ease: 'power2.in' });
    deck.forEach((d) => d !== front && gsap.to(d, { rank: d.rank - 1, duration: 0.6, ease: OUT }));
    gsap.delayedCall(0.58, () => {
      front.rank = 2;
      gsap.to(front, { out: 0, duration: 0.6, ease: OUT });
    });
    cycle = gsap.delayedCall(3, nextCard);
  };

  // ---- per-frame ----
  const frame = (_now: number, dt: number) => {
    const p = red ? 0 : clamp(s.p, 0, 1);
    if (s.snap || Math.abs(p - s.sp) > 0.6) {
      s.sp = p;
      s.snap = false;
    } else s.sp += (p - s.sp) * (1 - Math.exp(-dt / 170));
    if (Math.abs(p - s.sp) < 0.0004) s.sp = p;
    const sp = s.sp;
    const m = engine.mobile;
    const vh = innerHeight;

    const over = !!engine.target?.closest('[data-fold-tilt]') && s.interactive && !engine.touch && !red && sp < 0.05;
    if (over !== s.hovering) {
      s.hovering = over;
      to({ hover: over ? 1 : 0, duration: 0.45, ease: OUT, overwrite: 'auto' });
    }

    const deckOn = m && !red && sp > 0.97;
    if (deckOn && !cycle) cycle = gsap.delayedCall(1.6, nextCard);
    else if (!deckOn && cycle) stopDeck();

    // Reads first (where each stacked card is), then writes, so the frame never forces a second layout.
    const ks = cards.map((_, i) => {
      if (i >= cards.length - 1) return 0;
      const top = cardTops[i + 1] || 0;
      return clamp((vh - cards[i + 1].getBoundingClientRect().top) / Math.max(1, vh - top), 0, 1);
    });
    // Nothing moved since the last frame (no scroll, no tween, no resize): skip every write.
    const sig = [
      sp,
      v.blob,
      v.fold,
      v.n0,
      v.n1,
      v.tab,
      v.peek,
      v.ui,
      v.stage,
      v.hover,
      m ? 1 : 0,
      vh,
      innerWidth,
      ...deck.flatMap((d) => [d.rank, d.out]),
      ...ks,
    ];
    if (lastSig && sig.length === lastSig.length && sig.every((x, i) => x === lastSig![i])) return;
    lastSig = sig;

    let a: number, bm: number, bs: number, c: number;
    if (red) {
      a = 1;
      bm = 0.8;
      bs = m ? 0 : 0.7;
      c = 0;
    } else if (m) {
      a = IO(seg(sp, 0, 0.3));
      bm = IO(seg(sp, 0.2, 0.5));
      bs = 0;
      c = IO(seg(sp, 0.5, 1));
    } else {
      a = IO(seg(sp, 0, 0.25));
      bm = IO(seg(sp, 0.2, 0.5));
      bs = IO(seg(sp, 0.2, 0.55));
      c = IO(seg(sp, 0.5, 1));
    }
    const { W, H } = g;
    const stg = v.stage;

    // name
    const na = red ? 0 : seg(sp, 0, 0.25);
    name.style.transform = `scale(${1 - 0.1 * OUT(na)})`;
    name.style.opacity = String((1 - 0.8 * na) * stg * (red ? 1 : 1 - seg(sp, 0.45, 0.65)));
    n0.style.transform = `translate3d(0,${(1 - v.n0) * 112}%,0)`;
    n1.style.transform = `translate3d(0,${(1 - v.n1) * 112}%,0)`;
    const uo = v.ui * (red ? 1 : 1 - seg(sp, 0, 0.12)) * stg;
    ui.style.opacity = String(uo);
    ui.style.visibility = uo > 0.02 ? 'visible' : 'hidden';
    if (blob) mul.set(blob, v.blob * stg);

    // folder
    const f = v.fold;
    intro.style.transform = `translate3d(0,${(1 - f) * 18}vh,0) rotateX(${(1 - f) * 6}deg)`;
    intro.style.opacity = String(Math.min(1, f * 2.2));
    sink.style.transform = 'translate3d(0,0,0)';
    anchor.style.opacity = String(stg);
    const body = red ? 1 : 1 - seg(sp, 0.5, 0.75);
    if (back) back.style.opacity = String(body);
    front.style.opacity = String(body);
    tab.style.opacity = String(body);
    shadow.style.opacity = String(f * 0.85 * body);
    shadow.style.transform = `scale(${0.6 + 0.4 * f})`;
    tab.style.transform = `translate3d(0,${-8 * v.tab}px,-2px)`;
    front.style.transform = `translate3d(0,0,8px) rotateX(${-65 * a}deg)`;

    // papers: peek out of the folder, lift on hover, then spread into a row
    const hv = red ? 0 : v.hover * (1 - seg(sp, 0, 0.08));
    const pk = -14 * v.peek;
    const PW = 0.86 * W;
    const PH = 0.8 * H;
    const gp = (m ? -0.2 : 0.03) * g.sw;
    const sc = m
      ? Math.min((g.sh * 0.5) / PH, (g.sw * 0.7) / PW)
      : Math.min((g.sh * 0.52) / PH, (0.84 * g.sw - 2 * gp) / 3 / PW);
    const step = PW * sc + gp;
    const bx = g.ax + W / 2;
    const by = g.ay + 0.95 * H;
    const byT = g.sh * (m ? 0.56 : 0.6) + (PH * sc) / 2;
    /** Phone end state: a centred stack. `d` carries each poster's depth (0 front) and how far it has slid out. */
    const stack = (d: Deck, z: number) => {
      const r = clamp(d.rank, 0, 2);
      const lean = r < 1 ? -5 * r : -5 + 11 * (r - 1);
      return {
        tx: g.sw / 2 + d.out * g.sw * 0.95 - bx,
        ty: byT - by - r * 20,
        tr: lean + d.out * 16,
        sc: sc * (1 - 0.045 * r),
        z: z - r,
      };
    };
    const place = (
      e: HTMLElement,
      k: number,
      z: number,
      fx: number,
      fy: number,
      fr: number,
      d?: Deck,
    ) => {
      const T = d ? stack(d, 6) : null;
      const tx = T ? T.tx : g.sw / 2 + k * step - bx;
      const ty = T ? T.ty : byT - by;
      const tr = T ? T.tr : m ? k * 7 : 0;
      const sx = 1 + ((T ? T.sc : sc) - 1) * c;
      e.style.transform = `translate3d(${(fx + (tx - fx) * c).toFixed(1)}px,${(fy + (ty - fy) * c).toFixed(1)}px,${T ? T.z : z}px) rotate(${(fr + (tr - fr) * c).toFixed(2)}deg) scale(${sx.toFixed(4)})`;
      e.style.opacity = '1';
    };
    const b2 = m ? bm : bs;
    place(pl, -1, 2, -1 * 0.6 * W * b2, pk - 24 * hv * (1 - b2) - 0.24 * H * b2, -1 * (4 * hv * (1 - b2) + 9 * b2), m ? deck[0] : undefined);
    place(pr, 1, 3, 1 * 0.6 * W * b2, pk - 24 * hv * (1 - b2) - 0.24 * H * b2, 1 * (4 * hv * (1 - b2) + 9 * b2), m ? deck[2] : undefined);
    place(pm, 0, 4, 0, pk - 24 * hv * (1 - bm) - 0.38 * H * bm, 0, m ? deck[1] : undefined);

    // "A little bit of everything."
    const so = red ? 0 : seg(sp, 0.8, 1);
    const sl = red ? 1 : seg(sp, 0.78, 0.95);
    if (spread) {
      spread.style.opacity = String(so);
      spread.style.visibility = so > 0.02 ? 'visible' : 'hidden';
    }
    spreadLines.forEach((l, i) => {
      const k = OUT(Math.min(1, Math.max(0, sl * 1.15 - i * 0.15)));
      l.style.transform = `translate3d(0,${((1 - k) * 112).toFixed(1)}%,0)`;
    });

    // showreel: start loading as the folder opens, play muted once it is fully open
    if (reel && !red) {
      if (!reel.getAttribute('src') && sp > 0.3) {
        reel.src = reel.dataset.src ?? '';
        reel.load();
      }
      const playing = sp >= 0.92;
      if (playing && reel.paused) reel.play().catch(() => {});
      else if (!playing && sp < 0.85 && !reel.paused) reel.pause();
      reel.dataset.on = String(playing && !reel.paused);
    }

    // From here JavaScript owns every intro-animated property, so CSS lets go in the same frame.
    if (cssIntro) document.documentElement.classList.remove('intro-first');

    // stacked project folders: the covered one scales down and darkens
    for (let i = 0; i < cards.length; i++) {
      const k = ks[i];
      cards[i].style.transform = k > 0 ? `scale(${1 - 0.06 * k})` : 'none';
      shades[i].forEach((e) => (e.style.opacity = String(0.4 * k)));
    }
  };
  engine.hooks.add(frame);

  // ---- open the folder: click, Enter or Space glides to the end of the pinned section ----
  const toReel = () => {
    if (s.sp < 0.05 && s.interactive)
      scrollToY(wrap.getBoundingClientRect().top + scrollY + wrap.offsetHeight - innerHeight, 2.2);
  };
  const onClick = (e: Event) => {
    if ((e.target as Element).closest('[data-fold-tilt]')) toReel();
  };
  const onKey = (e: KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && (e.target as Element).matches?.('[data-fold-tilt]')) {
      e.preventDefault();
      toReel();
    }
  };
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);

  return () => {
    engine.hooks.delete(frame);
    stopDeck();
    engine.cursorFilter = null;
    engine.nav = 1;
    st?.kill();
    timers.forEach((t) => t.kill());
    gsap.killTweensOf(v);
    gsap.killTweensOf(engine);
    removeEventListener('resize', onResize);
    removeEventListener('scroll', syncBrand);
    root.classList.remove('hero-top');
    document.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKey);
  };
}
