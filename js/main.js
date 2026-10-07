import { HUES, FREE_SHIP, money, heroSlides } from './data.js';
import { cart } from './cart.js';
import { initCursor, magnetic, bindScramble, tilt, reveals, reduceMotion } from './fx.js';
import { views } from './views.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger, window.Flip);
ScrollTrigger.config({ ignoreMobileResize: true });

const app = document.getElementById('app');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------------- smooth scroll ---------------- */

let lenis = null;
if (!reduceMotion && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollTop = () => (lenis ? lenis.scrollTo(0, { immediate: true, force: true }) : window.scrollTo(0, 0));

/* ---------------- header / progress ---------------- */

const hdr = $('.hdr');
const progress = $('.progress');
let lastY = 0;
const onScroll = () => {
  const y = window.scrollY;
  hdr.classList.toggle('is-scrolled', y > 40);
  hdr.classList.toggle('is-hidden', y > lastY && y > 300 && !document.body.classList.contains('bag-open'));
  lastY = y;
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
};
addEventListener('scroll', onScroll, { passive: true });

/* ---------------- toast ---------------- */

const toastEl = $('.toast');
let toastTimer;
function toast(msg, { action, onAction } = {}) {
  toastEl.innerHTML = `<svg class="ico"><use href="#i-check"/></svg><span></span>`;
  toastEl.querySelector('span').textContent = msg;
  if (action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = action;
    b.addEventListener('click', () => { onAction?.(); hideToast(); });
    toastEl.append(b);
  }
  toastEl.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 3600);
}
const hideToast = () => toastEl.classList.remove('is-on');

/* ---------------- bag drawer ---------------- */

const drawer = $('#bag');
const panel = $('.drawer__panel', drawer);
let lastFocus = null;
gsap.set(panel, { xPercent: 100 });

function renderBag() {
  const lines = cart.lines;
  const count = cart.count();
  const sub = cart.subtotal();
  $$('[data-bag-count]').forEach((el) => (el.textContent = count));
  $('.bag-btn').classList.toggle('has-items', count > 0);
  $('[data-bag-subtotal]').textContent = money(sub);
  const left = FREE_SHIP - sub;
  $('[data-ship-msg]').textContent = left > 0 ? `${money(left)} away from free shipping` : 'Free Canadian shipping unlocked ✦';
  $('[data-ship-bar]').style.transform = `scaleX(${Math.min(1, sub / FREE_SHIP)})`;
  $('[data-checkout-link]').classList.toggle('is-disabled', !count);
  const box = $('[data-bag-items]');
  if (!lines.length) {
    box.innerHTML = `
      <div class="drawer__empty">
        <svg class="drawer__empty-logo"><use href="#logo"/></svg>
        <p>Your bag is empty.</p>
        <a href="#/shop" class="btn btn--ghost" data-close-bag><span>Shop the collection</span></a>
      </div>`;
    return;
  }
  box.innerHTML = lines.map((l) => `
    <div class="citem" data-key="${l.key}">
      <a href="#/product/${l.id}" class="citem__img" data-close-bag><img src="assets/img/${l.product.images[0]}-md.webp" alt="" loading="lazy"></a>
      <div class="citem__body">
        <div class="citem__top">
          <a href="#/product/${l.id}" class="citem__name" data-close-bag>${l.product.name}</a>
          <span class="citem__price mono">${money(l.product.price * l.qty)}</span>
        </div>
        <p class="citem__meta mono"><i class="dot" style="--c:${HUES[l.product.hue].hex}"></i>${HUES[l.product.hue].label} · Size ${l.size}</p>
        <div class="citem__actions">
          <div class="qty qty--sm mono">
            <button type="button" data-line-qty="-1" aria-label="Decrease quantity"><svg class="ico"><use href="#i-minus"/></svg></button>
            <output>${l.qty}</output>
            <button type="button" data-line-qty="1" aria-label="Increase quantity"><svg class="ico"><use href="#i-plus"/></svg></button>
          </div>
          <button type="button" class="citem__rm mono" data-line-rm>Remove</button>
        </div>
      </div>
    </div>`).join('');
}

function openBag() {
  if (document.body.classList.contains('bag-open')) return;
  lastFocus = document.activeElement;
  document.body.classList.add('bag-open');
  drawer.setAttribute('aria-hidden', 'false');
  lenis?.stop();
  gsap.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.9, ease: 'expo.out' });
  gsap.fromTo($$('.citem, .drawer__empty', panel), { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'expo.out', stagger: 0.05, delay: 0.15 });
  setTimeout(() => $('.icon-btn', panel).focus(), 50);
}
function closeBag() {
  if (!document.body.classList.contains('bag-open')) return;
  gsap.to(panel, {
    xPercent: 100, duration: 0.6, ease: 'expo.in',
    onComplete: () => {
      document.body.classList.remove('bag-open');
      drawer.setAttribute('aria-hidden', 'true');
      lenis?.start();
      lastFocus?.focus?.();
    }
  });
}

drawer.addEventListener('click', (e) => {
  const line = e.target.closest('.citem');
  if (e.target.closest('[data-line-qty]')) {
    const l = cart.lines.find((x) => x.key === line.dataset.key);
    cart.setQty(l.key, l.qty + Number(e.target.closest('[data-line-qty]').dataset.lineQty));
  } else if (e.target.closest('[data-line-rm]')) {
    gsap.to(line, { x: 80, opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: () => cart.remove(line.dataset.key) });
  } else if (e.target.closest('[data-close-bag]') || e.target.closest('[data-checkout-link]')) {
    closeBag();
  }
});
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-open-bag]')) openBag();
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeBag(); closeMenu(); }
});
cart.subscribe(renderBag);
renderBag();

// Fly a ghost of a product image into the bag button.
function flyToBag(imgEl) {
  const btn = $('.bag-btn');
  const pulse = () => gsap.fromTo(btn, { scale: 1.25 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.35)' });
  if (!imgEl || reduceMotion) return pulse();
  const a = imgEl.getBoundingClientRect();
  const b = btn.getBoundingClientRect();
  const ghost = document.createElement('img');
  ghost.src = imgEl.currentSrc || imgEl.src;
  ghost.className = 'fly';
  Object.assign(ghost.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
  document.body.append(ghost);
  hdr.classList.remove('is-hidden');
  gsap.timeline({ onComplete: () => { ghost.remove(); pulse(); } })
    .to(ghost, { x: b.left + b.width / 2 - (a.left + a.width / 2), duration: 0.9, ease: 'power2.inOut' }, 0)
    .to(ghost, { y: b.top + b.height / 2 - (a.top + a.height / 2), duration: 0.9, ease: 'back.in(1.2)' }, 0)
    .to(ghost, { scale: 0.06, borderRadius: '50%', opacity: 0.6, duration: 0.9, ease: 'power3.in' }, 0);
}

/* ---------------- mobile menu ---------------- */

const menu = $('#menu');
const menuBtn = $('[data-menu-toggle]');
function openMenu() {
  document.body.classList.add('menu-open');
  menu.setAttribute('aria-hidden', 'false');
  menuBtn.setAttribute('aria-expanded', 'true');
  lenis?.stop();
  gsap.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'expo.inOut' });
  gsap.fromTo($$('.menu__links a', menu), { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.06, delay: 0.3 });
}
function closeMenu() {
  if (!document.body.classList.contains('menu-open')) return;
  menuBtn.setAttribute('aria-expanded', 'false');
  gsap.to(menu, {
    clipPath: 'inset(0 0 100% 0)', duration: 0.6, ease: 'expo.inOut',
    onComplete: () => { document.body.classList.remove('menu-open'); menu.setAttribute('aria-hidden', 'true'); lenis?.start(); }
  });
}
menuBtn.addEventListener('click', () => (document.body.classList.contains('menu-open') ? closeMenu() : openMenu()));
menu.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });

$('[data-scroll-top]').addEventListener('click', () => (lenis ? lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo({ top: 0, behavior: 'smooth' })));

/* ---------------- router ---------------- */

const api = { cart, toast, openBag, flyToBag, lenis: () => lenis, scrollTop };

const parse = () => {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  return { name: parts[0] || 'home', param: parts[1] ? decodeURIComponent(parts[1]) : '', query: new URLSearchParams(qs || '') };
};

let page = null;

function render(route) {
  if (page) {
    page.ctx.revert();
    page.hooks?.destroy?.();
  }
  const view = views[route.name] || views.notFound;
  app.innerHTML = view.html(route, api);
  document.title = typeof view.title === 'function' ? view.title(route) : view.title;
  document.body.dataset.page = route.name;
  $$('[data-nav]').forEach((a) => a.classList.toggle('is-active', a.dataset.nav === route.name));
  scrollTop();
  onScroll();

  let hooks = {};
  const ctx = gsap.context(() => {
    hooks = view.mount(app, route, api) || {};
    reveals(app);
  }, app);
  page = { ctx, hooks };
  magnetic(app);
  tilt(app);
  bindScramble(app);
  ScrollTrigger.refresh();
  return page;
}

// Intro animations run inside the page context so they're reverted with it.
const intro = () => !reduceMotion && page?.ctx.add(() => page.hooks.intro?.());

/* ---------------- transitions ---------------- */

const curtainCols = $$('.curtain i');
const curtainLogo = $('.curtain__logo');
let busy = false;
let queued = null;

async function navigate() {
  if (busy) { queued = true; return; }
  busy = true;
  closeMenu();
  closeBag();
  const route = parse();
  if (reduceMotion) {
    render(route);
    intro();
  } else {
    document.body.classList.add('is-transitioning');
    await gsap.timeline()
      .set(curtainCols, { transformOrigin: '50% 100%' })
      .fromTo(curtainCols, { scaleY: 0 }, { scaleY: 1, duration: 0.55, ease: 'expo.inOut', stagger: 0.05 })
      .fromTo(curtainLogo, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.4 }, '-=0.3');
    render(route);
    await gsap.timeline()
      .to(curtainLogo, { opacity: 0, duration: 0.25 })
      .set(curtainCols, { transformOrigin: '50% 0%' })
      .to(curtainCols, { scaleY: 0, duration: 0.7, ease: 'expo.inOut', stagger: 0.05 })
      .add(intro, 0.25);
    document.body.classList.remove('is-transitioning');
  }
  app.focus({ preventScroll: true });
  busy = false;
  if (queued) { queued = null; navigate(); }
}
addEventListener('hashchange', navigate);

// Same-hash clicks (e.g. "Shop" while on shop) should still feel responsive.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#/"]');
  if (a && a.getAttribute('href') === location.hash && !busy) {
    e.preventDefault();
    lenis ? lenis.scrollTo(0, { duration: 1.2 }) : window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

/* ---------------- footer reveal ---------------- */

gsap.from('.ftr__big span', {
  yPercent: 100, opacity: 0, stagger: 0.05, duration: 1.2, ease: 'expo.out',
  scrollTrigger: { trigger: '.ftr__big', start: 'top 95%', toggleActions: 'play none none reverse' }
});

/* ---------------- boot / preloader ---------------- */

async function boot() {
  initCursor();
  magnetic(document);
  bindScramble(document);
  const route = parse();
  render(route);

  const loader = $('#loader');
  const count = $('.loader__count', loader);
  const fill = $('.loader__bar i', loader);
  const counter = { v: 0 };

  // Preload hero imagery (or the first images on other pages) while the logo draws.
  const srcs = route.name === 'home' ? heroSlides.map((s) => `assets/img/${s.img}-lg.webp`) : $$('img', app).slice(0, 4).map((i) => i.currentSrc || i.src);
  let loaded = 0;
  const loading = Promise.all(srcs.map((src) => new Promise((res) => {
    const im = new Image();
    im.onload = im.onerror = () => { loaded++; gsap.to(counter, { v: (loaded / srcs.length) * 100, duration: 0.6, overwrite: true }); res(); };
    im.src = src;
  })));
  const update = () => { count.textContent = String(Math.round(counter.v)).padStart(3, '0'); fill.style.transform = `scaleX(${counter.v / 100})`; };
  gsap.ticker.add(update);

  if (!reduceMotion) {
    gsap.fromTo('.loader__logo .logo__crown', { strokeDasharray: 260, strokeDashoffset: 260 }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.15 });
    gsap.fromTo('.loader__logo .logo__t', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', delay: 0.9 });
  }
  await Promise.race([Promise.all([loading, new Promise((r) => setTimeout(r, reduceMotion ? 0 : 1500))]), new Promise((r) => setTimeout(r, 7000))]);
  await gsap.to(counter, { v: 100, duration: 0.4 });
  gsap.ticker.remove(update);

  document.body.classList.remove('is-loading');
  if (reduceMotion) {
    loader.remove();
    intro();
  } else {
    await gsap.timeline()
      .to('.loader__inner', { opacity: 0, y: -30, duration: 0.5, ease: 'power2.in' })
      .to('.loader__cols i', { yPercent: -100, duration: 0.9, ease: 'expo.inOut', stagger: 0.06 })
      .add(intro, 0.55);
    loader.remove();
  }
  ScrollTrigger.refresh();
}

addEventListener('load', () => ScrollTrigger.refresh());
boot();
