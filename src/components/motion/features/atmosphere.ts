import { clamp, engine, mul } from '../engine';

type LightState = { x: number | null; y: number | null; wx: number; wy: number; wo: number };
type TiltState = { rx: number; ry: number };

/**
 * Pointer-driven atmosphere: the red light blob eases toward the cursor inside its zone, and tilting folders
 * (the 404 folder) lean toward the pointer. On touch the folder idles with a slow float instead.
 */
export function setupAtmosphere(root: HTMLElement): () => void {
  const lights = Array.from(root.querySelectorAll<HTMLElement>('[data-light]')).map((el) => ({
    el,
    zone: el.closest<HTMLElement>('[data-light-zone]') ?? el.parentElement!,
    s: { x: null, y: null, wx: NaN, wy: NaN, wo: NaN } as LightState,
  }));
  const tilts = Array.from(root.querySelectorAll<HTMLElement>('[data-tilt]')).map((el) => ({
    el,
    s: { rx: 0, ry: 0 } as TiltState,
    spec: el.querySelector<HTMLElement>('[data-spec]'),
  }));
  if (!lights.length && !tilts.length) return () => {};

  const frame = (now: number, _dt: number, L: (k: number) => number) => {
    const vw = innerWidth;
    const vh = innerHeight;
    const p = engine.p;

    for (const { el, zone, s } of lights) {
      const r = zone.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      const d = el.dataset;
      const rx = (d.lightX != null ? +d.lightX : 0.5) * r.width;
      const ry = (d.lightY != null ? +d.lightY : 0.5) * r.height;
      const pull = d.lightPull != null ? +d.lightPull : 1;
      let tx = rx;
      let ty = ry;
      if (engine.cursorOn && p.seen && !p.out && p.y > r.top && p.y < r.bottom) {
        tx = rx + (p.x - r.left - rx) * pull;
        ty = ry + (p.y - r.top - ry) * pull;
      }
      if (s.x === null || s.y === null) {
        s.x = tx;
        s.y = ty;
      }
      s.x += (tx - s.x) * L(0.04);
      s.y += (ty - s.y) * L(0.04);
      const o = (d.lightO != null ? +d.lightO : 0.35) * (mul.get(el) ?? 1);
      // Once the blob has caught up with its target there is nothing left to write.
      if (Math.abs(s.x - s.wx) < 0.05 && Math.abs(s.y - s.wy) < 0.05 && Math.abs(o - s.wo) < 0.001) continue;
      s.wx = s.x;
      s.wy = s.y;
      s.wo = o;
      el.style.transform = `translate3d(${s.x.toFixed(1)}px,${s.y.toFixed(1)}px,0)`;
      el.style.opacity = String(o);
    }

    for (const { el, s, spec } of tilts) {
      const m = mul.get(el) ?? 1;
      let tx = 0;
      let ty = 0;
      if (engine.cursorOn && p.seen && m > 0.001) {
        const r = el.getBoundingClientRect();
        ty = clamp((p.x - (r.left + r.width / 2)) / (vw / 2), -1, 1) * 7 * m;
        tx = -clamp((p.y - (r.top + r.height / 2)) / (vh / 2), -1, 1) * 5 * m;
      }
      s.rx += (tx - s.rx) * L(0.08);
      s.ry += (ty - s.ry) * L(0.08);
      const float = engine.touch && !engine.reduced ? Math.sin((now / 6000) * Math.PI * 2) * 6 : 0;
      el.style.transform = `translate3d(0,${float.toFixed(2)}px,0) rotateX(${s.rx.toFixed(3)}deg) rotateY(${s.ry.toFixed(3)}deg)`;
      if (spec) spec.style.transform = `translate3d(${(-s.ry * 5).toFixed(1)}px,${(s.rx * 5).toFixed(1)}px,0)`;
    }
  };
  engine.hooks.add(frame);
  return () => {
    engine.hooks.delete(frame);
    for (const { el } of lights) {
      el.style.transform = '';
      el.style.opacity = '';
    }
    for (const { el } of tilts) el.style.transform = '';
  };
}
