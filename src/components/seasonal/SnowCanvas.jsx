import { useEffect, useRef } from 'react';

// Cards that can hold snow: Toledo's bordered rounded surfaces, plus explicit opt-ins.
// Add `data-no-snow` on any element to keep it clear.
const CARD_SELECTOR = '.rounded-xl.border, .rounded-lg.border, [data-snow]';
const EXCLUDED_SCOPE = '[role="dialog"], [role="menu"], [data-radix-popper-content-wrapper], [data-no-snow], button, input, textarea, select';

const COL_WIDTH = 3;          // px per heightmap column
const MAX_CAP = 16;           // max settled snow height (px)
const CAP_CHANCE = 0.55;      // share of cards that collect snow at all
const LAND_CHANCE = 0.45;     // share of flakes that settle when crossing a snowy card
const RESCAN_MS = 3000;       // fallback DOM rescan (DOM changes trigger one sooner)
const RECT_MS = 400;          // max staleness of cached card positions

const rand = (min, max) => min + Math.random() * (max - min);

// Six-armed snow crystals, pre-rendered once and reused for every falling flake.
const CRYSTALS = [
  { branches: [[0.42, 0.26], [0.68, 0.2]], hex: 0 },
  { branches: [[0.55, 0.3]], hex: 0.24 },
  { branches: [[0.32, 0.16], [0.56, 0.24], [0.8, 0.13]], hex: 0 },
  { branches: [[0.5, 0.2]], hex: 0.16, tips: true },
];
const SPRITE_SIZE = 64;

function makeFlakeSprites() {
  return CRYSTALS.map((variant) => {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = SPRITE_SIZE;
    const ctx = sprite.getContext('2d');
    const R = SPRITE_SIZE * 0.4;
    ctx.translate(SPRITE_SIZE / 2, SPRITE_SIZE / 2);
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = R * 0.1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(200, 225, 255, 0.9)';
    ctx.shadowBlur = 3;
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -R);
      for (const [pos, len] of variant.branches) {
        const y = -R * pos;
        ctx.moveTo(0, y);
        ctx.lineTo(-R * len, y - R * len * 0.85);
        ctx.moveTo(0, y);
        ctx.lineTo(R * len, y - R * len * 0.85);
      }
      ctx.stroke();
      if (variant.tips) {
        ctx.beginPath();
        ctx.arc(0, -R, R * 0.07, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (variant.hex) {
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = (i * Math.PI) / 3 + Math.PI / 6;
        const x = Math.cos(a) * R * variant.hex;
        const y = Math.sin(a) * R * variant.hex;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.08, 0, Math.PI * 2);
    ctx.fill();
    return sprite;
  });
}

function spawnFlake(flake, w, h, fromTop) {
  flake.size = rand(8, 20);                 // rendered diameter in px
  flake.x = rand(0, w);
  flake.y = fromTop ? rand(-40, -10) : rand(0, h);
  flake.vy = 20 + rand(0, 26) + flake.size * 0.6; // px/s
  flake.sway = rand(8, 26);
  flake.phase = rand(0, Math.PI * 2);
  flake.freq = rand(0.3, 0.9);
  flake.angle = rand(0, Math.PI * 2);
  flake.spin = rand(-0.9, 0.9);              // rad/s
  flake.alpha = rand(0.55, 0.95);
  flake.sprite = Math.floor(Math.random() * CRYSTALS.length);
  return flake;
}

// Deterministic PRNG so a card's lumps keep their shape when its sprite is rebuilt.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Irregular initial cap so snow looks "already there" on first paint.
function seedCap(cols) {
  const heights = new Float32Array(cols);
  const base = rand(5, 9);
  const p1 = rand(0, 6.28), p2 = rand(0, 6.28), f1 = rand(0.05, 0.12), f2 = rand(0.18, 0.35);
  for (let i = 0; i < cols; i++) {
    heights[i] = Math.max(0, base + Math.sin(i * f1 + p1) * 2.4 + Math.sin(i * f2 + p2) * 1.1);
  }
  return { heights, seed: (Math.random() * 2 ** 32) >>> 0, sideL: rand(7, 15), sideR: rand(7, 15), dirty: true };
}

function resampleCap(cap, cols) {
  const heights = new Float32Array(cols);
  const ratio = cap.heights.length / cols;
  for (let i = 0; i < cols; i++) {
    heights[i] = cap.heights[Math.min(cap.heights.length - 1, Math.floor(i * ratio))];
  }
  cap.heights = heights;
  cap.dirty = true;
}

const SPRITE_PAD_X = 10;
const SPRITE_PAD_TOP = MAX_CAP + 10;
const SPRITE_PAD_BOTTOM = 28;
const SPRITE_REBUILD_MS = 300;

// Snow is a union of overlapping round lumps: pillowy top, clumps hanging under the edge,
// and lumps draping down both rounded corners. Rendered once per card into an offscreen sprite.
function buildSnowSprite(cap, width, radius, edgeFactor, dpr) {
  const rng = mulberry32(cap.seed);
  const hts = cap.heights;
  const heightAt = (x) => hts[Math.max(0, Math.min(hts.length - 1, Math.round(x / COL_WIDTH)))] * edgeFactor(x);
  const depth = (x) => Math.min(1, heightAt(x) / 6);
  const rad = Math.max(6, Math.min(radius, width / 4));
  const lumps = [];

  // Pillowy top: each lump touches the snow surface and reaches down to the card edge.
  for (let x = rng() * 3; x <= width; x += 2.5 + rng() * 3.5) {
    const hh = heightAt(x);
    const r = Math.max(hh * 0.55 + 1, 2.2 + rng() * 3.2);
    lumps.push([x, -hh + r, r]);
  }
  // Clumps hanging under the edge.
  for (let x = rad + rng() * 8; x < width - rad; x += 6 + rng() * 14) {
    const r = (1 + rng() * 1.9) * depth(x);
    if (r > 0.6) lumps.push([x, 2 + r * 0.35, r]);
  }
  // Snow rolling over each rounded corner and running down the side.
  for (const [side, sideLen] of [[0, cap.sideL], [width, cap.sideR]]) {
    const dir = side === 0 ? 1 : -1;
    const len = Math.max(rad * 0.7, sideLen * depth(side + dir * rad));
    const shoulder = heightAt(side + dir * rad * 0.8);
    lumps.push([side + dir * (rad * 0.45), -shoulder * 0.5 + 0.5, shoulder * 0.55 + 2.4]);
    const steps = Math.max(3, Math.round(len / 2.6));
    for (let j = 0; j <= steps; j++) {
      const k = j / steps;
      const r = 3.3 - k * 1.3 + rng() * 0.5;
      lumps.push([side - dir * (0.4 - rng() * 0.6), k * len, r]);
    }
  }

  const ox = SPRITE_PAD_X, oy = SPRITE_PAD_TOP;
  const cssW = width + SPRITE_PAD_X * 2;
  const cssH = SPRITE_PAD_TOP + SPRITE_PAD_BOTTOM;
  const sprite = cap.sprite || document.createElement('canvas');
  sprite.width = Math.ceil(cssW * dpr);
  sprite.height = Math.ceil(cssH * dpr);
  const c = sprite.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, cssW, cssH);

  const silhouette = new Path2D();
  silhouette.rect(ox + rad * 0.5, oy - 2, width - rad, 4.2);
  for (const [x, y, r] of lumps) {
    silhouette.moveTo(ox + x + r, oy + y);
    silhouette.arc(ox + x, oy + y, r, 0, Math.PI * 2);
  }
  // Lit faces: same lumps nudged up-left and slightly smaller, so a cool shade stays
  // in every crease and under every lump.
  const lit = new Path2D();
  lit.rect(ox + rad * 0.5, oy - 3, width - rad, 4);
  for (const [x, y, r] of lumps) {
    const rr = r * 0.86;
    lit.moveTo(ox + x - 0.35 + rr, oy + y - 1);
    lit.arc(ox + x - 0.35, oy + y - 1, rr, 0, Math.PI * 2);
  }

  // Base shade with a soft cast shadow onto the card.
  c.save();
  c.shadowColor = 'rgba(0, 0, 0, 0.5)';
  c.shadowBlur = 5 * dpr;
  c.shadowOffsetY = 1.5 * dpr;
  c.fillStyle = '#a9b8ca';
  c.fill(silhouette);
  c.restore();

  c.save();
  c.clip(silhouette);
  const g = c.createLinearGradient(0, oy - MAX_CAP, 0, oy + 6);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.75, '#f3f6fa');
  g.addColorStop(1, '#dbe4ee');
  c.fillStyle = g;
  c.fill(lit);
  // Fine grain: cool specks and bright glints, like packed crystals.
  const grains = Math.round(width * 0.6);
  for (let i = 0; i < grains; i++) {
    const x = ox + rng() * width;
    const y = oy - MAX_CAP + rng() * (MAX_CAP + 8);
    c.fillStyle = rng() < 0.7 ? 'rgba(130, 150, 180, 0.22)' : 'rgba(255, 255, 255, 0.9)';
    c.fillRect(x, y, 0.7, 0.7);
  }
  c.restore();

  cap.sprite = sprite;
  cap.spriteW = cssW;
  cap.spriteH = cssH;
  cap.spriteKey = `${width}|${dpr}`;
  cap.dirty = false;
}

export default function SnowCanvas({ still = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    const sprites = makeFlakeSprites();
    const caps = new WeakMap(); // element -> { active, heights, seed, sideL, sideR, sprite }

    let w = 0, h = 0, dpr = 1;
    let flakes = [];
    let targets = []; // { el, cap, left, right, top, radius }
    let rafId = 0, lastFrame = 0, lastRects = 0, rectsDirty = true;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = still ? 0 : Math.round(Math.min(80, Math.max(24, (w * h) / 18000)));
      while (flakes.length < count) flakes.push(spawnFlake({}, w, h, false));
      flakes.length = count;
      rectsDirty = true;
    };

    const scan = () => {
      const found = [];
      const nodes = document.querySelectorAll(CARD_SELECTOR);
      for (const el of nodes) {
        if (el.closest(EXCLUDED_SCOPE)) continue;
        // Only outermost cards: nested panels stay clear.
        const parentCard = el.parentElement?.closest(CARD_SELECTOR);
        if (parentCard && !parentCard.closest(EXCLUDED_SCOPE)) continue;
        let cap = caps.get(el);
        if (!cap) {
          cap = { active: el.hasAttribute('data-snow') || Math.random() < CAP_CHANCE, heights: null };
          caps.set(el, cap);
        }
        if (cap.active) found.push({ el, cap, left: 0, right: 0, top: 0, radius: 8, visible: false });
      }
      for (const t of found) {
        const r = parseFloat(getComputedStyle(t.el).borderTopLeftRadius);
        t.radius = Number.isFinite(r) ? r : 8;
      }
      targets = found;
      rectsDirty = true;
    };

    const updateRects = () => {
      for (const t of targets) {
        const rect = t.el.getBoundingClientRect();
        t.left = rect.left;
        t.right = rect.right;
        t.top = rect.top;
        t.visible = rect.width >= 120 && rect.height >= 40 && rect.top > -MAX_CAP && rect.top < h && rect.right > 0 && rect.left < w;
        if (!t.visible) continue;
        const cols = Math.max(4, Math.ceil(rect.width / COL_WIDTH) + 1);
        if (!t.cap.heights) Object.assign(t.cap, seedCap(cols));
        else if (t.cap.heights.length !== cols) resampleCap(t.cap, cols);
      }
      rectsDirty = false;
    };

    // Taper towards rounded corners so caps wrap the edge instead of floating past it.
    const edgeFactor = (t, x) => {
      const reach = Math.max(6, t.radius * 1.2);
      const d = Math.min(x - t.left, t.right - x);
      if (d >= reach) return 1;
      const k = Math.max(0, d / reach);
      return 0.5 + 0.5 * Math.sqrt(k); // keeps some mass on the corner
    };

    const surfaceAt = (t, x) => {
      const i = Math.round((x - t.left) / COL_WIDTH);
      return t.top - t.cap.heights[i] * edgeFactor(t, x);
    };

    const deposit = (t, x, amount) => {
      const hts = t.cap.heights;
      const i = Math.round((x - t.left) / COL_WIDTH);
      for (let k = -2; k <= 2; k++) {
        const j = i + k;
        if (j < 0 || j >= hts.length) continue;
        hts[j] = Math.min(MAX_CAP, hts[j] + amount * (k === 0 ? 1 : k * k === 1 ? 0.6 : 0.25));
      }
      t.cap.dirty = true;
    };

    const drawCap = (t, now) => {
      const cap = t.cap;
      const width = t.right - t.left;
      const stale = cap.spriteKey !== `${width}|${dpr}`;
      if (!cap.sprite || stale || (cap.dirty && now - (cap.builtAt || 0) > SPRITE_REBUILD_MS)) {
        buildSnowSprite(cap, width, t.radius, (x) => edgeFactor(t, t.left + x), dpr);
        cap.builtAt = now;
      }
      ctx.drawImage(cap.sprite, t.left - SPRITE_PAD_X, t.top - SPRITE_PAD_TOP, cap.spriteW, cap.spriteH);
    };

    const frame = (now) => {
      rafId = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - (lastFrame || now)) / 1000);
      lastFrame = now;

      let redraw = !still;
      if (rectsDirty || now - lastRects > RECT_MS) {
        updateRects();
        lastRects = now;
        redraw = true;
      }
      // Reduced motion: no falling flakes, settled snow only repaints when layout moves.
      if (!redraw) return;

      ctx.clearRect(0, 0, w, h);

      // Settled snow
      for (const t of targets) {
        if (t.visible) drawCap(t, now);
      }

      // Falling flakes
      const time = now / 1000;
      for (const f of flakes) {
        const prevY = f.y;
        f.y += f.vy * dt;
        const x = f.x + Math.sin(time * f.freq + f.phase) * f.sway;

        if (f.y > h + 6 || x < -30 || x > w + 30) {
          spawnFlake(f, w, h, true);
          continue;
        }

        let landed = false;
        for (const t of targets) {
          if (!t.visible || x < t.left || x > t.right) continue;
          const surface = surfaceAt(t, x);
          if (prevY < surface && f.y >= surface) {
            if (Math.random() < LAND_CHANCE) {
              deposit(t, x, f.size * 0.06);
              landed = true;
            }
            break;
          }
        }
        if (landed) {
          spawnFlake(f, w, h, true);
          continue;
        }

        f.angle += f.spin * dt;
        const cos = Math.cos(f.angle) * dpr;
        const sin = Math.sin(f.angle) * dpr;
        ctx.setTransform(cos, sin, -sin, cos, x * dpr, f.y * dpr);
        ctx.globalAlpha = f.alpha;
        ctx.drawImage(sprites[f.sprite], -f.size / 2, -f.size / 2, f.size, f.size);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
    };

    const start = () => {
      if (!rafId && !document.hidden) {
        lastFrame = 0;
        rafId = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const markDirty = () => { rectsDirty = true; };
    const onVisibility = () => (document.hidden ? stop() : start());

    resize();
    scan();
    const scanTimer = setInterval(scan, RESCAN_MS);
    // Pick up cards as soon as pages render them (debounced).
    let scanQueued = 0;
    const observer = new MutationObserver(() => {
      if (scanQueued) return;
      scanQueued = setTimeout(() => { scanQueued = 0; scan(); }, 150);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', markDirty, { passive: true, capture: true });
    document.addEventListener('visibilitychange', onVisibility);
    start();

    return () => {
      stop();
      clearInterval(scanTimer);
      observer.disconnect();
      clearTimeout(scanQueued);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', markDirty, { capture: true });
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [still]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 h-full w-full"
    />
  );
}
