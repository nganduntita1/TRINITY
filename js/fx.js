// Small interaction effects shared across pages.
const gsap = () => window.gsap;
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- template helpers ---------- */

// "There is a *season*" -> word spans, *x* becomes <em>
export function words(str, cls = 'w') {
  let inEm = false;
  return str.split(/\s+/).map((tok) => {
    const on = inEm || tok.startsWith('*');
    inEm = on && !/\*[.,!?—:;]*$/.test(tok);
    const clean = tok.replace(/\*/g, '');
    return `<span class="${cls}"><span>${on ? `<em>${clean}</em>` : clean}</span></span>`;
  }).join(' ');
}

export const chars = (str, cls = 'ch') =>
  [...str].map((c) => `<span class="${cls}">${c === ' ' ? '&nbsp;' : c}</span>`).join('');

/* ---------- cursor ---------- */

export function initCursor() {
  const el = document.querySelector('.cursor');
  if (!finePointer || !el) return;
  document.documentElement.classList.add('has-cursor');
  const ring = el.querySelector('.cursor__ring');
  const dot = el.querySelector('.cursor__dot');
  const label = el.querySelector('.cursor__label');
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringPos = { ...pos };
  addEventListener('pointermove', (e) => {
    pos.x = e.clientX; pos.y = e.clientY;
    el.classList.add('is-on');
  }, { passive: true });
  document.addEventListener('pointerleave', () => el.classList.remove('is-on'));
  document.addEventListener('pointerdown', () => el.classList.add('is-down'));
  document.addEventListener('pointerup', () => el.classList.remove('is-down'));

  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor], a, button, input, select, label, textarea');
    el.classList.remove('is-link', 'is-label', 'is-text');
    if (!t) return;
    if (t.dataset.cursor) {
      el.classList.add('is-label');
      label.textContent = t.dataset.cursor;
    } else if (t.matches('input, textarea')) el.classList.add('is-text');
    else el.classList.add('is-link');
  });

  const tick = () => {
    ringPos.x += (pos.x - ringPos.x) * 0.18;
    ringPos.y += (pos.y - ringPos.y) * 0.18;
    dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------- magnetic ---------- */

export function magnetic(root = document) {
  if (!finePointer || reduceMotion) return;
  root.querySelectorAll('[data-magnetic]:not([data-mag-bound])').forEach((el) => {
    el.dataset.magBound = '';
    const strength = parseFloat(el.dataset.magnetic) || 0.35;
    const xTo = gsap().quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap().quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ---------- scramble text ---------- */

const GLYPHS = '!<>-_\\/[]{}—=+*^?#01ΛΞΣ';
export function scramble(el, duration = 520) {
  if (reduceMotion || el.children.length) return; // only plain-text nodes; never clobber markup
  const final = el.dataset.text ?? (el.dataset.text = el.textContent);
  const start = performance.now();
  cancelAnimationFrame(el._scr);
  const run = (now) => {
    const p = Math.min(1, (now - start) / duration);
    const reveal = Math.floor(p * final.length);
    el.textContent = [...final].map((c, i) =>
      i < reveal || c === ' ' ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]).join('');
    if (p < 1) el._scr = requestAnimationFrame(run);
    else el.textContent = final;
  };
  el._scr = requestAnimationFrame(run);
}

export function bindScramble(root = document) {
  root.querySelectorAll('[data-scramble]:not([data-scr-bound])').forEach((el) => {
    el.dataset.scrBound = '';
    el.addEventListener('pointerenter', () => scramble(el));
    el.addEventListener('focus', () => scramble(el));
  });
}

/* ---------- 3D tilt ---------- */

export function tilt(root = document) {
  if (!finePointer || reduceMotion) return;
  root.querySelectorAll('[data-tilt]:not([data-tilt-bound])').forEach((el) => {
    el.dataset.tiltBound = '';
    const max = parseFloat(el.dataset.tilt) || 8;
    const rx = gsap().quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3' });
    const ry = gsap().quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3' });
    gsap().set(el, { transformPerspective: 900 });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * max); rx(-py * max);
      el.style.setProperty('--mx', `${(px + 0.5) * 100}%`);
      el.style.setProperty('--my', `${(py + 0.5) * 100}%`);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

/* ---------- reveal on scroll ---------- */

export function reveals(root) {
  const g = gsap();
  const items = root.querySelectorAll('[data-reveal]');
  if (!items.length) return;
  if (reduceMotion) { g.set(items, { opacity: 1, y: 0 }); return; }
  g.set(items, { opacity: 0, y: 40 });
  window.ScrollTrigger.batch(items, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => g.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 })
  });

  root.querySelectorAll('[data-clip]').forEach((el) => {
    g.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
  });

  root.querySelectorAll('[data-speed]').forEach((el) => {
    const s = parseFloat(el.dataset.speed);
    g.fromTo(el, { yPercent: -s * 10 }, {
      yPercent: s * 10, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });
}

/* ---------- live clock (Toronto) ---------- */

export function torontoClock(el) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tick = () => (el.textContent = fmt.format(new Date()));
  tick();
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}
