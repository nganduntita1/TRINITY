// Page templates + per-page behaviour. Each view: { title, html(route), mount(root, route, api) -> { intro?, destroy? } }
import {
  products, getProduct, categories, HUES, SIZES, heroSlides, story, psalm,
  lookbook, credits, values, IG_URL, FREE_SHIP, money
} from './data.js';
import { words, chars, reduceMotion, finePointer, torontoClock } from './fx.js';
import { HeroGL } from './webgl.js';

const gsap = () => window.gsap;
const ST = () => window.ScrollTrigger;
const pad = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const img = (name, { alt = '', cls = '', eager = false, sizes = '(max-width: 900px) 92vw, 40vw' } = {}) =>
  `<img class="${cls}" src="assets/img/${name}-md.webp" srcset="assets/img/${name}-md.webp 720w, assets/img/${name}-lg.webp 1400w" sizes="${sizes}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;

const label = (n, t) => `<div class="sec__label mono"><span>[${n}]</span><span>${t}</span></div>`;

/* ---------------- product card ---------------- */

function card(p, i) {
  const hue = HUES[p.hue];
  if (p.soon) {
    return `
    <article class="pcard pcard--soon" data-cat="${p.category}" data-hue="${p.hue}" data-price="" style="--hue:${hue.hex};--hue-ink:${hue.ink}">
      <div class="pcard__frame">
        <div class="pcard__media" data-cursor="Soon">
          ${img(p.images[0], { cls: 'pcard__img' })}
          <span class="pcard__idx mono">${pad(i + 1)}</span>
          <span class="pcard__soon mono"><i></i>Unveiling soon</span>
        </div>
      </div>
      <div class="pcard__info">
        <div><h3 class="pcard__name">${p.name}</h3><p class="pcard__meta mono">Drop 02 · ${p.category}</p></div>
        <div class="pcard__right"><span class="pcard__price mono">— —</span></div>
      </div>
    </article>`;
  }
  return `
  <article class="pcard" data-id="${p.id}" data-cat="${p.category}" data-hue="${p.hue}" data-price="${p.price}" style="--hue:${hue.hex};--hue-ink:${hue.ink}">
    <div class="pcard__frame" data-tilt="5">
      <a href="#/product/${p.id}" class="pcard__media" data-cursor="View" aria-label="${esc(p.name)}">
        ${img(p.images[0], { alt: p.name, cls: 'pcard__img' })}
        ${p.images[1] ? img(p.images[1], { cls: 'pcard__img pcard__img--alt' }) : ''}
        <span class="pcard__idx mono">${pad(i + 1)}</span>
        <span class="pcard__ref mono">${p.ref}</span>
        <span class="pcard__glare" aria-hidden="true"></span>
      </a>
      <div class="pcard__sizes" role="group" aria-label="Quick add ${esc(p.name)} — choose size">
        <span class="mono">Quick add</span>
        ${SIZES.map((s) => `<button type="button" class="mono" data-quick-size="${s}">${s}</button>`).join('')}
      </div>
    </div>
    <div class="pcard__info">
      <div>
        <h3 class="pcard__name"><a href="#/product/${p.id}">${p.name}</a></h3>
        <p class="pcard__meta mono"><i class="dot"></i>${hue.label} · ${p.category}</p>
      </div>
      <div class="pcard__right">
        <span class="pcard__price">${money(p.price)}</span>
        <button class="pcard__quick mono" type="button" data-quick aria-expanded="false">+ Add</button>
      </div>
    </div>
  </article>`;
}

// Quick-add behaviour for any product grid inside root.
function bindQuickAdd(root, api) {
  const onClick = (e) => {
    const toggle = e.target.closest('[data-quick]');
    const size = e.target.closest('[data-quick-size]');
    if (toggle) {
      const c = toggle.closest('.pcard');
      const open = !c.classList.contains('is-picking');
      root.querySelectorAll('.pcard.is-picking').forEach((x) => { x.classList.remove('is-picking'); x.querySelector('[data-quick]')?.setAttribute('aria-expanded', 'false'); });
      c.classList.toggle('is-picking', open);
      toggle.setAttribute('aria-expanded', String(open));
    }
    if (size) {
      const c = size.closest('.pcard');
      const p = getProduct(c.dataset.id);
      api.cart.add(p.id, size.dataset.quickSize, 1);
      api.flyToBag(c.querySelector('.pcard__img'));
      api.toast(`Added — ${p.name} · ${size.dataset.quickSize}`);
      c.classList.remove('is-picking');
    }
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}

const marqueeItems = ['Unisex', 'Modest', 'Intentional', 'Ready-to-wear', 'Faith-forward', 'Flourish', 'Made in Toronto'];
const marqueeRow = () => [...marqueeItems, ...marqueeItems]
  .map((t) => `<span class="marquee__item">${t}<svg class="ico ico--spark"><use href="#i-spark"/></svg></span>`).join('');

const creditsList = () => `
  <dl class="credits mono">
    ${credits.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
  </dl>`;

/* =========================================================
   HOME
   ========================================================= */

const hueImg = { brown: 'nahar-brown-set', green: 'eden-dress', white: 'wisdom-top', blue: 'havilah-shirt' };

const home = {
  title: 'TRINITY by OB — Flourish Collection',
  html: () => `
  <section class="hero" data-hero>
    <canvas class="hero__gl" aria-hidden="true"></canvas>
    <div class="hero__stage">
      <h1 class="hero__word" aria-label="Trinity">${chars('TRINITY')}</h1>
      <button class="hero__arch" type="button" data-arch data-cursor="Next" aria-label="Next look">
        ${heroSlides.map((s, i) => img(s.img, { alt: s.title, cls: i === 0 ? 'is-active' : '', eager: i === 0, sizes: '40vw' })).join('')}
      </button>
      <div class="hero__word hero__word--ghost" aria-hidden="true">${chars('TRINITY')}</div>
      <svg class="hero__halo" viewBox="0 0 600 160" aria-hidden="true">
        <ellipse cx="300" cy="80" rx="290" ry="58"/>
        <ellipse cx="300" cy="80" rx="250" ry="40" class="hero__halo-b"/>
        <circle r="3.5" class="hero__orbiter"><animateMotion dur="9s" repeatCount="indefinite" path="M10,80 a290,58 0 1,0 580,0 a290,58 0 1,0 -580,0"/></circle>
      </svg>
    </div>
    <div class="hero__hud">
      <div class="hud hud--tl mono"><span>[ Flourish — Collection 01 ]</span><span>Unisex · Modest · RTW</span></div>
      <div class="hud hud--tr mono"><span>TOR <b data-clock>00:00:00</b></span><span>43.65°N · 79.38°W</span></div>
      <div class="hero__copy">
        <p class="hero__kicker mono">Designed for your becoming</p>
        <p class="hero__lede">Intentional, luxurious ready-to-wear in hues of <em>brown, green, white &amp; blue.</em></p>
        <div class="hero__ctas">
          <a class="btn btn--holo" href="#/shop" data-magnetic><span>Shop the collection</span><svg class="ico"><use href="#i-arrow"/></svg></a>
          <a class="btn btn--ghost" href="#/story" data-magnetic><span>Why Flourish</span></a>
        </div>
      </div>
      <div class="hero__slides">
        <div class="hero__count mono"><b data-slide-num>01</b><span>/ ${pad(heroSlides.length)}</span></div>
        <a class="hero__slide-name" data-slide-link href="${heroSlides[0].link}">
          <span data-slide-title>${heroSlides[0].title}</span>
          <small class="mono" data-slide-sub>${heroSlides[0].sub}</small>
        </a>
        <div class="hero__bar"><i data-slide-bar></i></div>
        <div class="hero__arrows">
          <button type="button" class="icon-btn" data-prev aria-label="Previous look"><svg class="ico"><use href="#i-arrow-l"/></svg></button>
          <button type="button" class="icon-btn" data-next aria-label="Next look"><svg class="ico"><use href="#i-arrow"/></svg></button>
        </div>
      </div>
      <div class="hero__scroll mono" aria-hidden="true"><span>Scroll</span><i></i></div>
    </div>
  </section>

  <section class="marquee" aria-hidden="true">
    <div class="marquee__row"><div class="marquee__track">${marqueeRow()}</div></div>
    <div class="marquee__row marquee__row--rev"><div class="marquee__track">${marqueeRow()}</div></div>
  </section>

  <section class="sec manifesto">
    ${label('01', 'Manifesto')}
    <div class="manifesto__grid">
      <p class="manifesto__text">${words('There is a season where you feel *hidden.* Not forgotten — but *planted.* Flourish was birthed from this understanding: a reminder that your season of growth was *never invisible to God.*')}</p>
      <aside class="manifesto__aside" data-reveal>
        <figure class="emblem" data-tilt="10">
          ${img('flourish-emblem', { alt: 'Flourish — flowers growing through split wood', sizes: '320px' })}
          <figcaption class="mono"><span>Fig. 01</span><span>Psalms 92:12–15</span></figcaption>
        </figure>
        <p>Unisex. Modest. Intentional ready-to-wear pieces designed to move with you as you evolve.</p>
        <a class="link-u mono" href="#/story">Read the story →</a>
      </aside>
    </div>
  </section>

  <section class="hcol" data-hcol>
    <div class="hcol__head">
      ${label('02', 'The Collection')}
      <h2 class="sec__title">Flourish <span class="outline">Collection</span> <em>01</em></h2>
      <div class="hcol__meta mono"><span>${pad(products.length)} pieces · Unisex sizing</span><a href="#/shop" class="link-u">View all →</a></div>
    </div>
    <div class="hcol__viewport">
      <div class="hcol__track">
        ${products.map(card).join('')}
        <a class="hcol__end" href="#/shop" data-cursor="Shop">
          <span class="mono">[ ${pad(products.length)} / ${pad(products.length)} ]</span>
          <strong>Shop all<br>pieces</strong>
          <svg class="ico"><use href="#i-arrow-ur"/></svg>
        </a>
      </div>
    </div>
    <div class="hcol__progress"><i></i></div>
  </section>

  <section class="sec hues" data-hues>
    ${label('03', 'Hues of Flourish')}
    <ul class="hues__list">
      ${Object.entries(HUES).map(([k, h], i) => `
        <li>
          <a class="hues__row" href="#/shop?hue=${k}" data-hue="${k}" style="--c:${h.hex};--ci:${h.ink}" data-cursor="Shop">
            <span class="hues__n mono">${pad(i + 1)}</span>
            <span class="hues__name">${h.label}</span>
            <span class="hues__note mono">${h.note}</span>
            <span class="hues__count mono">${products.filter((p) => p.hue === k).length} pcs →</span>
          </a>
        </li>`).join('')}
    </ul>
    <div class="hues__float" aria-hidden="true">
      ${Object.entries(hueImg).map(([k, n]) => `<div class="hues__img" data-hue-img="${k}">${img(n, { sizes: '320px' })}</div>`).join('')}
    </div>
  </section>

  <section class="sec look">
    <div class="look__head">
      ${label('04', 'Editorial')}
      <h2 class="sec__title">Seen in <em>Sunday Best</em></h2>
      <a class="btn btn--ghost" href="#/lookbook" data-magnetic><span>Open the lookbook</span><svg class="ico"><use href="#i-arrow-ur"/></svg></a>
    </div>
    <div class="look__grid">
      ${[['look-group', 'a', 'Flourish is live'], ['look-duo', 'b', 'Two is better than one'], ['nahar-brown-set', 'c', 'Main-character energy'], ['look-trio', 'd', 'Sunday Best'], ['wisdom-detail', 'e', 'Wisdom speaks softly']]
        .map(([n, k, t], i) => `
        <figure class="look__item look__item--${k}">
          <div class="look__mask" data-clip><div class="look__inner" data-speed="${0.4 + (i % 3) * 0.25}">${img(n, { alt: t, sizes: '(max-width: 900px) 92vw, 45vw' })}</div></div>
          <figcaption class="mono"><span>${pad(i + 1)}</span>${t}</figcaption>
        </figure>`).join('')}
    </div>
    ${creditsList()}
  </section>

  <section class="sec values">
    ${label('05', 'Why Trinity')}
    <h2 class="sec__title values__title">A safe space for <em>faith expression</em> &amp; belonging.</h2>
    <div class="values__grid">
      ${values.map((v) => `
        <article class="vcard" data-reveal data-tilt="6">
          <span class="vcard__n mono">${v.n}</span>
          <h3>${v.t}</h3>
          <p>${v.d}</p>
          <i class="vcard__c" aria-hidden="true"></i>
        </article>`).join('')}
    </div>
  </section>

  <section class="sec ig">
    <div class="ig__head">
      ${label('06', 'On the gram')}
      <h2 class="sec__title"><a href="${IG_URL}" target="_blank" rel="noopener">@trinityby_ob</a></h2>
      <a class="btn btn--ghost" href="${IG_URL}" target="_blank" rel="noopener" data-magnetic><svg class="ico"><use href="#i-ig"/></svg><span>Follow on Instagram</span></a>
    </div>
    <div class="ig__grid">
      ${['look-trio', 'nahar-detail', 'eden-dress', 'wisdom-detail', 'havilah-shirt-3', 'bts-collage'].map((n) => `
        <a class="ig__item" href="${IG_URL}" target="_blank" rel="noopener" data-cursor="Open" data-reveal>
          ${img(n, { sizes: '(max-width: 900px) 46vw, 16vw' })}
          <svg class="ico"><use href="#i-ig"/></svg>
        </a>`).join('')}
    </div>
  </section>

  <section class="join">
    <div class="join__orb" aria-hidden="true"></div>
    <div class="join__inner" data-reveal>
      <p class="mono">[ Join the Trinity Fam ]</p>
      <h2 class="join__title">First to know.<br><em>First to flourish.</em></h2>
      <form class="join__form" novalidate data-join>
        <label class="sr-only" for="join-email">Email address</label>
        <input id="join-email" name="email" type="email" placeholder="your@email.com" required autocomplete="email">
        <button class="btn btn--holo" type="submit"><span>Subscribe</span><svg class="ico"><use href="#i-arrow"/></svg></button>
      </form>
      <p class="join__msg mono" data-join-msg>Early access to drops, pop-ups &amp; restocks. No spam — ever.</p>
    </div>
  </section>`,

  mount(root, route, api) {
    const g = gsap();
    const cleanups = [];
    const hero = root.querySelector('[data-hero]');
    const canvas = hero.querySelector('.hero__gl');
    const arch = hero.querySelector('[data-arch]');
    const archImgs = [...arch.querySelectorAll('img')];
    const bar = hero.querySelector('[data-slide-bar]');
    const ui = {
      num: hero.querySelector('[data-slide-num]'),
      title: hero.querySelector('[data-slide-title]'),
      sub: hero.querySelector('[data-slide-sub]'),
      link: hero.querySelector('[data-slide-link]')
    };
    cleanups.push(torontoClock(hero.querySelector('[data-clock]')));

    // --- WebGL portal (falls back to plain <img> crossfade)
    let gl = null;
    try {
      gl = new HeroGL(canvas, heroSlides.map((s) => `assets/img/${s.img}-lg.webp`));
      gl.setArchFrom(arch);
      if (reduceMotion) gl.u.open = 1;
      gl.start();
    } catch (err) {
      console.warn('[hero] WebGL disabled:', err.message);
      hero.classList.add('no-gl');
    }
    let index = 0;
    let auto;
    const setSlide = (i) => {
      const s = heroSlides[i];
      index = i;
      archImgs.forEach((im, k) => im.classList.toggle('is-active', k === i));
      ui.num.textContent = pad(i + 1);
      ui.link.href = s.link;
      g.fromTo([ui.title, ui.sub], { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, ease: 'expo.out', stagger: 0.06, onStart: () => { ui.title.textContent = s.title; ui.sub.textContent = s.sub; } });
      runAuto();
    };
    const go = (dir) => {
      const i = (index + dir + heroSlides.length) % heroSlides.length;
      if (gl && !gl.goTo(i)) return;
      setSlide(i);
    };
    const runAuto = () => {
      auto?.kill();
      if (reduceMotion) return;
      auto = g.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 6.5, ease: 'none', onComplete: () => go(1) });
    };
    const onArch = () => go(1);
    arch.addEventListener('click', onArch);
    hero.querySelector('[data-next]').addEventListener('click', () => go(1));
    hero.querySelector('[data-prev]').addEventListener('click', () => go(-1));

    // --- Hero scroll: portal expands to full-bleed, title splits apart
    const heroChars = hero.querySelectorAll('.hero__word .ch');
    if (!reduceMotion) {
      const half = Math.ceil(heroChars.length / 4);
      const tl = g.timeline({
        scrollTrigger: { trigger: hero, start: 'top top', end: '+=110%', scrub: 0.8, pin: true, anticipatePin: 1 }
      });
      if (gl) tl.to(gl.u, { expand: 1, ease: 'power2.inOut', duration: 1 }, 0);
      else tl.to(arch, { scale: 1.6, opacity: 0.4, duration: 1 }, 0);
      hero.querySelectorAll('.hero__word').forEach((w) => {
        const cs = w.querySelectorAll('.ch');
        cs.forEach((c, k) => {
          const dir = k < cs.length / 2 ? -1 : 1;
          const dist = Math.abs(k - (cs.length - 1) / 2) + half;
          tl.to(c, { xPercent: dir * dist * 60, opacity: 0, ease: 'power2.in', duration: 0.8 }, 0);
        });
      });
      tl.to(hero.querySelectorAll('.hud, .hero__copy, .hero__slides, .hero__scroll, .hero__halo'), { opacity: 0, y: -30, duration: 0.4, stagger: 0.02 }, 0);
    }

    // --- Marquee with scroll-velocity boost
    const rows = root.querySelectorAll('.marquee__track');
    const loops = reduceMotion ? [] : [...rows].map((t, k) => g.fromTo(t, { xPercent: k ? -50 : 0 }, { xPercent: k ? 0 : -50, duration: 38, ease: 'none', repeat: -1 }));
    if (!reduceMotion) ST().create({
      trigger: root.querySelector('.marquee'), start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => {
        const v = Math.min(Math.abs(self.getVelocity()) / 300, 6);
        loops.forEach((l) => g.to(l, { timeScale: 1 + v, duration: 0.2, overwrite: true }));
        g.to(rows, { skewX: g.utils.clamp(-8, 8, self.getVelocity() / -250), duration: 0.4, overwrite: 'auto' });
      }
    });

    // --- Manifesto word-by-word light-up
    const mWords = root.querySelectorAll('.manifesto__text .w > span');
    g.fromTo(mWords, { opacity: 0.12 }, {
      opacity: 1, stagger: 0.05, ease: 'none',
      scrollTrigger: { trigger: '.manifesto__text', start: 'top 80%', end: 'bottom 45%', scrub: true }
    });

    // --- Horizontal collection (desktop pins, mobile swipes)
    const mm = g.matchMedia();
    mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
      const sec = root.querySelector('[data-hcol]');
      const track = sec.querySelector('.hcol__track');
      const dist = () => track.scrollWidth - sec.querySelector('.hcol__viewport').clientWidth;
      g.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: sec, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: (self) => g.set(sec.querySelector('.hcol__progress i'), { scaleX: self.progress })
        }
      });
    });
    cleanups.push(() => mm.revert());
    cleanups.push(bindQuickAdd(root.querySelector('[data-hcol]'), api));

    // --- Hues: floating image follows pointer
    const hues = root.querySelector('[data-hues]');
    const float = hues.querySelector('.hues__float');
    const fx = g.quickTo(float, 'x', { duration: 0.6, ease: 'power3' });
    const fy = g.quickTo(float, 'y', { duration: 0.6, ease: 'power3' });
    const fr = g.quickTo(float, 'rotation', { duration: 0.8, ease: 'power3' });
    let lastX = 0;
    const onHueMove = (e) => {
      const r = hues.getBoundingClientRect();
      fx(e.clientX - r.left); fy(e.clientY - r.top);
      fr(g.utils.clamp(-14, 14, (e.clientX - lastX) * 0.6));
      lastX = e.clientX;
    };
    hues.addEventListener('pointermove', onHueMove);
    hues.querySelectorAll('.hues__row').forEach((row) => {
      row.addEventListener('pointerenter', () => {
        hues.classList.add('is-hovering');
        hues.style.setProperty('--glow', row.style.getPropertyValue('--c'));
        hues.querySelectorAll('.hues__img').forEach((el) => el.classList.toggle('is-active', el.dataset.hueImg === row.dataset.hue));
      });
      row.addEventListener('pointerleave', () => hues.classList.remove('is-hovering'));
    });

    // --- Footer-adjacent join form (demo: not sent anywhere yet)
    const form = root.querySelector('[data-join]');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = root.querySelector('[data-join-msg]');
      const input = form.querySelector('input');
      if (!input.checkValidity()) {
        msg.textContent = 'Please enter a valid email address.';
        msg.classList.add('is-error');
        input.focus();
        return;
      }
      // TODO: connect to the brand's email provider (Klaviyo / Mailchimp / Shopify Email).
      msg.classList.remove('is-error');
      msg.textContent = 'You’re in. Welcome to the Trinity Fam ✦';
      form.classList.add('is-done');
      input.value = '';
    });

    return {
      intro() {
        if (gl) {
          gl.u.open = 0;
          g.to(gl.u, { open: 1, duration: 1.8, ease: 'expo.inOut' });
        }
        g.from(hero.querySelectorAll('.hero__word:not(.hero__word--ghost) .ch'), { yPercent: 110, opacity: 0, duration: 1.4, ease: 'expo.out', stagger: 0.06, delay: 0.25 });
        g.fromTo(hero.querySelectorAll('.hero__word--ghost .ch'), { opacity: 0 }, { opacity: 1, duration: 1.2, stagger: 0.06, delay: 1 });
        g.from(hero.querySelectorAll('.hud, .hero__copy > *, .hero__slides, .hero__scroll'), { opacity: 0, y: 24, duration: 1, ease: 'expo.out', stagger: 0.07, delay: 0.7 });
        g.from(hero.querySelector('.hero__halo'), { opacity: 0, scale: 0.6, duration: 1.8, ease: 'expo.out', delay: 0.6 });
        runAuto();
      },
      destroy() {
        auto?.kill();
        gl?.destroy();
        cleanups.forEach((fn) => fn?.());
      }
    };
  }
};

/* =========================================================
   SHOP
   ========================================================= */

const shop = {
  title: 'Shop — TRINITY by OB',
  html: (route) => {
    const cat = route.query.get('cat') || 'All';
    const hue = route.query.get('hue') || '';
    return `
    <section class="pagehead">
      ${label('Shop', 'Flourish — Collection 01')}
      <h1 class="pagehead__title"><span class="pagehead__line">${chars('The')}</span> <span class="pagehead__line"><em>${chars('Collection')}</em></span></h1>
      <p class="pagehead__lede">Unisex, modest and intentional — every piece in hues of brown, green, white and blue. Designed and released in Toronto.</p>
    </section>
    <section class="shop" data-shop>
      <div class="filters" role="toolbar" aria-label="Filter products">
        <div class="filters__group">
          ${categories.map((c) => `<button type="button" class="chip ${c === cat ? 'is-active' : ''}" data-cat="${c}" aria-pressed="${c === cat}">${c}<sup class="mono">${c === 'All' ? products.length : products.filter((p) => p.category === c).length}</sup></button>`).join('')}
        </div>
        <div class="filters__group filters__hues">
          ${Object.entries(HUES).map(([k, h]) => `<button type="button" class="hue-btn ${k === hue ? 'is-active' : ''}" data-hue="${k}" style="--c:${h.hex};--ci:${h.ink}" aria-pressed="${k === hue}"><i></i><span class="mono">${h.label}</span></button>`).join('')}
        </div>
        <label class="sort mono">Sort
          <select data-sort>
            <option value="featured">Featured</option>
            <option value="low">Price — low to high</option>
            <option value="high">Price — high to low</option>
          </select>
        </label>
      </div>
      <p class="shop__count mono"><span data-count>${products.length}</span> pieces</p>
      <div class="shop__grid" data-grid>${products.map(card).join('')}</div>
      <p class="shop__empty" data-empty hidden>No pieces in that combination yet — try another hue.</p>
    </section>`;
  },
  mount(root, route, api) {
    const g = gsap();
    const grid = root.querySelector('[data-grid]');
    const cards = [...grid.children];
    const state = { cat: route.query.get('cat') || 'All', hue: route.query.get('hue') || '', sort: 'featured' };

    const apply = (animate = true) => {
      const flip = animate && !reduceMotion ? window.Flip.getState(cards) : null;
      const price = (c) => (c.dataset.price ? Number(c.dataset.price) : null);
      const sorted = [...cards].sort((a, b) => {
        if (state.sort === 'featured') return cards.indexOf(a) - cards.indexOf(b);
        const pa = price(a), pb = price(b);
        if (pa === null || pb === null) return (pa === null) - (pb === null); // "coming soon" last
        return state.sort === 'low' ? pa - pb : pb - pa;
      });
      let shown = 0;
      sorted.forEach((c) => {
        const ok = (state.cat === 'All' || c.dataset.cat === state.cat) && (!state.hue || c.dataset.hue === state.hue);
        c.hidden = !ok;
        if (ok) shown++;
        grid.appendChild(c);
      });
      root.querySelector('[data-count]').textContent = shown;
      root.querySelector('[data-empty]').hidden = shown > 0;
      if (flip) {
        window.Flip.from(flip, {
          duration: 0.75, ease: 'expo.inOut', absolute: true, scale: true, stagger: 0.03,
          onEnter: (els) => g.fromTo(els, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' }),
          onLeave: (els) => g.to(els, { opacity: 0, scale: 0.9, duration: 0.4 }),
          onComplete: () => ST().refresh()
        });
      }
      const q = new URLSearchParams();
      if (state.cat !== 'All') q.set('cat', state.cat);
      if (state.hue) q.set('hue', state.hue);
      history.replaceState(null, '', `#/shop${q.toString() ? `?${q}` : ''}`);
    };

    const chips = root.querySelectorAll('.chip[data-cat]');
    const hueBtns = root.querySelectorAll('.hue-btn[data-hue]');
    chips.forEach((b) => b.addEventListener('click', () => {
      state.cat = b.dataset.cat;
      chips.forEach((x) => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      apply();
    }));
    hueBtns.forEach((b) => b.addEventListener('click', () => {
      state.hue = state.hue === b.dataset.hue ? '' : b.dataset.hue;
      hueBtns.forEach((x) => { const on = x.dataset.hue === state.hue; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', String(on)); });
      apply();
    }));
    root.querySelector('[data-sort]').addEventListener('change', (e) => { state.sort = e.target.value; apply(); });
    apply(false);
    const unbind = bindQuickAdd(grid, api);

    return {
      intro() {
        g.from(root.querySelectorAll('.pagehead .ch'), { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.035 });
        g.from(root.querySelectorAll('.pagehead__lede, .sec__label, .filters, .shop__count'), { opacity: 0, y: 20, duration: 1, ease: 'expo.out', stagger: 0.08, delay: 0.3 });
        g.from(grid.querySelectorAll('.pcard:not([hidden])'), { opacity: 0, y: 60, duration: 1.2, ease: 'expo.out', stagger: 0.07, delay: 0.4 });
      },
      destroy: unbind
    };
  }
};

/* =========================================================
   PRODUCT
   ========================================================= */

const product = {
  title: (route) => `${getProduct(route.param)?.name ?? 'Product'} — TRINITY by OB`,
  html: (route) => {
    const p = getProduct(route.param);
    if (!p) return notFound.html();
    const hue = HUES[p.hue];
    const related = products.filter((x) => x.id !== p.id && !x.soon && (x.hue === p.hue || x.category === p.category)).slice(0, 3);
    const fill = products.filter((x) => x.id !== p.id && !x.soon && !related.includes(x));
    const more = [...related, ...fill].slice(0, 3);
    return `
    <section class="pdp" style="--hue:${hue.hex};--hue-ink:${hue.ink}" data-pdp>
      <div class="pdp__gallery">
        ${p.images.map((im, i) => `
          <figure class="pdp__shot" data-zoom data-cursor="${p.soon ? 'Soon' : 'Zoom'}">
            ${img(im, { alt: i === 0 ? p.name : `${p.name} — view ${i + 1}`, eager: i === 0, sizes: '(max-width: 900px) 100vw, 56vw' })}
            <span class="pdp__shot-n mono">${pad(i + 1)} / ${pad(p.images.length)}</span>
          </figure>`).join('')}
      </div>
      <div class="pdp__info">
        <div class="pdp__sticky">
          <nav class="crumbs mono" aria-label="Breadcrumb"><a href="#/shop">Shop</a><span>/</span><a href="#/shop?cat=${p.category}">${p.category}</a><span>/</span><span>${p.ref}</span></nav>
          <h1 class="pdp__name">${words(p.name)}</h1>
          <p class="pdp__tag">${p.tagline}</p>
          <div class="pdp__price">${p.soon ? '<strong>Coming soon</strong>' : `<strong>${money(p.price)}</strong><span class="mono">CAD</span>`}</div>
          <p class="pdp__desc">${p.description}</p>
          ${p.soon ? `
            <div class="pdp__soon mono"><i></i>Drop 02 — follow <a class="link-u" href="${IG_URL}" target="_blank" rel="noopener">@trinityby_ob</a> for the release date.</div>
          ` : `
          <div class="opt">
            <div class="opt__head mono"><span>Hue</span><span>${hue.label}</span></div>
            <div class="swatches"><span class="swatch is-active" style="--c:${hue.hex}" title="${hue.label}"></span></div>
          </div>
          <div class="opt">
            <div class="opt__head mono"><span>Size</span><span data-size-label>Select a size</span></div>
            <div class="sizes" role="radiogroup" aria-label="Size">
              ${SIZES.map((s) => `<button type="button" role="radio" aria-checked="false" class="size mono" data-size="${s}">${s}</button>`).join('')}
            </div>
            <p class="opt__hint mono" data-size-hint>${p.fit}</p>
          </div>
          <div class="pdp__buy">
            <div class="qty mono" aria-label="Quantity">
              <button type="button" data-qty="-1" aria-label="Decrease quantity"><svg class="ico"><use href="#i-minus"/></svg></button>
              <output data-qty-val aria-live="polite">1</output>
              <button type="button" data-qty="1" aria-label="Increase quantity"><svg class="ico"><use href="#i-plus"/></svg></button>
            </div>
            <button type="button" class="btn btn--holo btn--block" data-add data-magnetic="0.15"><span>Add to bag</span><svg class="ico"><use href="#i-bag"/></svg></button>
          </div>`}
          <dl class="spec mono">
            <div><dt>Ref</dt><dd>${p.ref}</dd></div>
            <div><dt>Collection</dt><dd>Flourish 01</dd></div>
            <div><dt>Hue</dt><dd><i class="dot" style="--c:${hue.hex}"></i>${hue.label}</dd></div>
            <div><dt>Fit</dt><dd>${p.fit || 'TBA'}</dd></div>
          </dl>
          <div class="acc">
            ${p.details.length ? `<details open><summary>Details<svg class="ico"><use href="#i-plus"/></svg></summary><ul>${p.details.map((d) => `<li>${d}</li>`).join('')}</ul></details>` : ''}
            <details><summary>The name<svg class="ico"><use href="#i-plus"/></svg></summary><p>${p.meaning}</p></details>
            <details><summary>Shipping &amp; returns<svg class="ico"><use href="#i-plus"/></svg></summary><p>Ships from Toronto. Free Canadian shipping on orders over ${money(FREE_SHIP)}. Local pickup available in the GTA. Unworn pieces can be returned within 14 days.</p></details>
          </div>
        </div>
      </div>
    </section>
    <section class="sec related">
      ${label('Next', 'Complete the look')}
      <div class="shop__grid related__grid">${more.map(card).join('')}</div>
    </section>`;
  },
  mount(root, route, api) {
    const g = gsap();
    const p = getProduct(route.param);
    if (!p) return {};
    const cleanups = [bindQuickAdd(root.querySelector('.related'), api)];
    let size = null;
    let qty = 1;

    root.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
      size = b.dataset.size;
      root.querySelectorAll('[data-size]').forEach((x) => { const on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-checked', String(on)); });
      root.querySelector('[data-size-label]').textContent = size;
      root.querySelector('.sizes')?.classList.remove('is-error');
    }));
    const qv = root.querySelector('[data-qty-val]');
    root.querySelectorAll('[data-qty]').forEach((b) => b.addEventListener('click', () => {
      qty = Math.max(1, Math.min(9, qty + Number(b.dataset.qty)));
      qv.textContent = qty;
    }));
    root.querySelector('[data-add]')?.addEventListener('click', () => {
      if (!size) {
        const s = root.querySelector('.sizes');
        s.classList.add('is-error');
        root.querySelector('[data-size-hint]').textContent = 'Please choose a size first.';
        g.fromTo(s, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
        return;
      }
      api.cart.add(p.id, size, qty);
      api.flyToBag(root.querySelector('.pdp__shot img'));
      api.toast(`Added — ${p.name} · ${size}${qty > 1 ? ` × ${qty}` : ''}`, { action: 'View bag', onAction: api.openBag });
    });

    // hover zoom
    root.querySelectorAll('[data-zoom]').forEach((fig) => {
      const im = fig.querySelector('img');
      const move = (e) => {
        const r = fig.getBoundingClientRect();
        im.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
      };
      if (finePointer) {
        fig.addEventListener('pointerenter', () => fig.classList.add('is-zoom'));
        fig.addEventListener('pointerleave', () => fig.classList.remove('is-zoom'));
        fig.addEventListener('pointermove', move);
      } else {
        fig.addEventListener('click', (e) => { move(e); fig.classList.toggle('is-zoom'); });
      }
    });

    return {
      intro() {
        g.from(root.querySelectorAll('.pdp__name .w > span'), { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.06 });
        g.from(root.querySelectorAll('.pdp__sticky > *:not(.pdp__name)'), { opacity: 0, y: 24, duration: 1, ease: 'expo.out', stagger: 0.05, delay: 0.2 });
        g.from(root.querySelector('.pdp__shot'), { clipPath: 'inset(0 0 100% 0)', duration: 1.4, ease: 'expo.inOut' });
      },
      destroy: () => cleanups.forEach((fn) => fn())
    };
  }
};

/* =========================================================
   STORY
   ========================================================= */

const storyView = {
  title: 'Why Flourish — TRINITY by OB',
  html: () => `
  <section class="pagehead story-head">
    ${label('Story', 'Why Flourish?')}
    <h1 class="pagehead__title">${words('Designed for your *becoming.*')}</h1>
    <div class="story-head__row">
      <p class="pagehead__lede">TRINITY by OB is an award-winning unisex ready-to-wear brand from Toronto — promoting modesty’s appeal and creating a safe space for faith expression and belonging.</p>
      <figure class="emblem emblem--lg" data-tilt="8">
        ${img('flourish-emblem', { alt: 'Flourish emblem — wildflowers growing from split wood', sizes: '360px' })}
        <figcaption class="mono"><span>Fig. 01</span><span>Flourish</span></figcaption>
      </figure>
    </div>
  </section>

  <section class="seq" data-seq>
    <div class="seq__pin">
      <div class="seq__glow" aria-hidden="true"></div>
      <ol class="seq__steps mono">
        ${story.map((s, i) => `<li><span>${pad(i + 1)}</span>${s.k}</li>`).join('')}
      </ol>
      <div class="seq__stage">
        ${story.map((s) => `<p class="seq__line">${words(s.t)}</p>`).join('')}
      </div>
      <div class="seq__bar"><i></i></div>
    </div>
  </section>

  <section class="sec psalm">
    <svg class="psalm__logo" aria-hidden="true"><use href="#logo"/></svg>
    <blockquote class="psalm__q">${words(psalm.text)}</blockquote>
    <cite class="mono">— ${psalm.ref}</cite>
  </section>

  <section class="sec names">
    ${label('Names', 'Every piece carries a name')}
    <div class="names__grid">
      ${products.map((p) => `
        <a class="name-card" href="#/product/${p.id}" style="--c:${HUES[p.hue].hex};--ci:${HUES[p.hue].ink}" data-reveal data-tilt="6">
          <span class="mono">${p.ref}</span>
          <h3>${p.name.split(' ')[0]}</h3>
          <p>${p.meaning}</p>
          <i class="name-card__arrow"><svg class="ico"><use href="#i-arrow-ur"/></svg></i>
        </a>`).join('')}
    </div>
  </section>

  <section class="sec">
    ${label('Credits', 'Creative partners')}
    ${creditsList()}
    <div class="story-cta" data-reveal>
      <a class="btn btn--holo" href="#/shop" data-magnetic><span>Enter your season — shop Flourish</span><svg class="ico"><use href="#i-arrow"/></svg></a>
    </div>
  </section>`,

  mount(root) {
    const g = gsap();
    const seq = root.querySelector('[data-seq]');
    const lines = seq.querySelectorAll('.seq__line');
    const steps = seq.querySelectorAll('.seq__steps li');
    const n = lines.length;

    if (reduceMotion) {
      lines.forEach((l) => l.classList.add('is-static'));
    } else {
      g.set(lines, { autoAlpha: 0 });
      const tl = g.timeline({
        scrollTrigger: {
          trigger: seq, start: 'top top', end: `+=${n * 70}%`, pin: true, scrub: 0.6,
          onUpdate: (self) => {
            const i = Math.min(n - 1, Math.floor(self.progress * n));
            steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
            g.set(seq.querySelector('.seq__bar i'), { scaleY: self.progress });
          }
        }
      });
      lines.forEach((line, i) => {
        const ws = line.querySelectorAll('.w > span');
        tl.set(line, { autoAlpha: 1 }, i);
        tl.fromTo(ws, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.02, duration: 0.4, ease: 'power3.out' }, i);
        if (i < n - 1) {
          tl.to(ws, { yPercent: -110, opacity: 0, stagger: 0.01, duration: 0.25, ease: 'power3.in' }, i + 0.55);
          tl.set(line, { autoAlpha: 0 }, i + 0.98);
        }
      });
    }

    g.fromTo(root.querySelectorAll('.psalm__q .w > span'), { opacity: 0.12 }, {
      opacity: 1, stagger: 0.04, ease: 'none',
      scrollTrigger: { trigger: '.psalm', start: 'top 75%', end: 'bottom 60%', scrub: true }
    });

    return {
      intro() {
        g.from(root.querySelectorAll('.story-head .pagehead__title .w > span'), { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.08 });
        g.from(root.querySelectorAll('.story-head .pagehead__lede, .story-head .sec__label, .story-head .emblem'), { opacity: 0, y: 30, duration: 1.1, ease: 'expo.out', stagger: 0.1, delay: 0.3 });
      }
    };
  }
};

/* =========================================================
   LOOKBOOK
   ========================================================= */

const lookbookView = {
  title: 'Lookbook — TRINITY by OB',
  html: () => `
  <section class="lb" data-lb>
    <header class="lb__head">
      ${label('Lookbook', 'Flourish — in frame')}
      <h1 class="lb__title">${chars('Lookbook')}</h1>
      <p class="mono lb__hint">Scroll or drag ↔</p>
    </header>
    <div class="lb__viewport" data-cursor="Drag">
      <div class="lb__track">
        ${lookbook.map((l, i) => `
          <figure class="lb__item">
            <div class="lb__img">${img(l.img, { alt: l.title, sizes: '(max-width: 900px) 80vw, 34vw' })}</div>
            <figcaption><span class="mono">${pad(i + 1)}</span><strong>${l.title}</strong><small class="mono">${l.meta}</small></figcaption>
          </figure>`).join('')}
      </div>
    </div>
    <div class="lb__foot mono"><span><b data-lb-idx>01</b> / ${pad(lookbook.length)}</span><div class="lb__bar"><i></i></div><a href="#/shop" class="link-u">Shop the looks →</a></div>
  </section>
  <section class="sec">
    ${label('Credits', 'Creative partners')}
    ${creditsList()}
  </section>`,

  mount(root, route, api) {
    const g = gsap();
    const sec = root.querySelector('[data-lb]');
    const viewport = sec.querySelector('.lb__viewport');
    const track = sec.querySelector('.lb__track');
    const items = [...track.children];
    const idx = sec.querySelector('[data-lb-idx]');
    const cleanups = [];
    const mm = g.matchMedia();

    mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
      const dist = () => track.scrollWidth - viewport.clientWidth;
      const skewTo = g.quickTo(track.querySelectorAll('.lb__img'), 'skewX', { duration: 0.4, ease: 'power3' });
      const st = g.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: sec, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true,
          onUpdate: (self) => {
            g.set(sec.querySelector('.lb__bar i'), { scaleX: self.progress });
            idx.textContent = pad(Math.min(items.length, Math.round(self.progress * (items.length - 1)) + 1));
            skewTo(g.utils.clamp(-6, 6, self.getVelocity() / -400));
          },
          onScrubComplete: () => skewTo(0)
        }
      });
      items.forEach((it) => {
        g.fromTo(it.querySelector('img'), { xPercent: -8 }, {
          xPercent: 8, ease: 'none',
          scrollTrigger: { trigger: it, containerAnimation: st, start: 'left right', end: 'right left', scrub: true }
        });
      });

      // drag → page scroll (which drives the pinned track)
      let down = null;
      const onDown = (e) => { down = { x: e.clientX, y: scrollY }; viewport.classList.add('is-dragging'); viewport.setPointerCapture(e.pointerId); };
      const onMove = (e) => {
        if (!down) return;
        const target = down.y - (e.clientX - down.x) * 1.6;
        const l = api.lenis();
        if (l) l.scrollTo(target, { immediate: false, lerp: 0.15 }); else scrollTo(0, target);
      };
      const onUp = () => { down = null; viewport.classList.remove('is-dragging'); };
      viewport.addEventListener('pointerdown', onDown);
      viewport.addEventListener('pointermove', onMove);
      viewport.addEventListener('pointerup', onUp);
      viewport.addEventListener('pointercancel', onUp);
      return () => {
        viewport.removeEventListener('pointerdown', onDown);
        viewport.removeEventListener('pointermove', onMove);
        viewport.removeEventListener('pointerup', onUp);
        viewport.removeEventListener('pointercancel', onUp);
      };
    });

    // mobile/native: track index from horizontal scroll
    const onNative = () => {
      const i = Math.round(viewport.scrollLeft / (items[0].offsetWidth || 1));
      idx.textContent = pad(Math.min(items.length, i + 1));
      g.set(sec.querySelector('.lb__bar i'), { scaleX: viewport.scrollLeft / Math.max(1, viewport.scrollWidth - viewport.clientWidth) });
    };
    viewport.addEventListener('scroll', onNative, { passive: true });
    cleanups.push(() => viewport.removeEventListener('scroll', onNative), () => mm.revert());

    return {
      intro() {
        g.from(root.querySelectorAll('.lb__title .ch'), { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.04 });
        g.from(items, { opacity: 0, x: 120, duration: 1.4, ease: 'expo.out', stagger: 0.08, delay: 0.2 });
        g.from(root.querySelectorAll('.lb__hint, .lb__head .sec__label, .lb__foot'), { opacity: 0, duration: 1, delay: 0.5 });
      },
      destroy: () => cleanups.forEach((fn) => fn())
    };
  }
};

/* =========================================================
   CHECKOUT (front-end demo — no payment is taken)
   ========================================================= */

const SHIPPING = [
  { id: 'standard', label: 'Standard — Canada', eta: '3–7 business days', price: 15 },
  { id: 'express', label: 'Express — Canada', eta: '1–3 business days', price: 25 },
  { id: 'pickup', label: 'Local pickup — Toronto', eta: 'We’ll message you when ready', price: 0 }
];
const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

const checkout = {
  title: 'Checkout — TRINITY by OB',
  html: (route, api) => {
    const lines = api.cart.lines;
    if (!lines.length) {
      return `
      <section class="pagehead co-empty">
        ${label('Checkout', 'Your bag')}
        <h1 class="pagehead__title">${words('Your bag is *empty.*')}</h1>
        <p class="pagehead__lede">Enter your season of flourishing — the collection is waiting.</p>
        <a class="btn btn--holo" href="#/shop" data-magnetic><span>Shop the collection</span><svg class="ico"><use href="#i-arrow"/></svg></a>
      </section>`;
    }
    return `
    <section class="co" data-co>
      <header class="pagehead pagehead--tight">
        ${label('Checkout', 'Secure checkout — demo mode')}
        <h1 class="pagehead__title">${words('Checkout')}</h1>
      </header>
      <ol class="co__steps mono">
        <li class="is-done"><span>01</span>Bag</li>
        <li class="is-active"><span>02</span>Details</li>
        <li><span>03</span>Payment</li>
        <li><span>04</span>Confirmed</li>
      </ol>
      <div class="co__grid">
        <form class="co__form" data-co-form novalidate>
          <fieldset>
            <legend class="mono">01 — Contact</legend>
            <div class="field field--full"><label for="co-email">Email</label><input id="co-email" type="email" required autocomplete="email" placeholder="you@email.com"></div>
          </fieldset>
          <fieldset>
            <legend class="mono">02 — Shipping address</legend>
            <div class="field"><label for="co-first">First name</label><input id="co-first" required autocomplete="given-name"></div>
            <div class="field"><label for="co-last">Last name</label><input id="co-last" required autocomplete="family-name"></div>
            <div class="field field--full"><label for="co-addr">Address</label><input id="co-addr" required autocomplete="address-line1"></div>
            <div class="field"><label for="co-city">City</label><input id="co-city" required autocomplete="address-level2"></div>
            <div class="field field--sm"><label for="co-prov">Province</label><select id="co-prov" required autocomplete="address-level1">${PROVINCES.map((p) => `<option ${p === 'ON' ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
            <div class="field field--sm"><label for="co-post">Postal code</label><input id="co-post" required autocomplete="postal-code" pattern="[A-Za-z]\\d[A-Za-z](?: |-)?\\d[A-Za-z]\\d" placeholder="M5V 2T6"></div>
          </fieldset>
          <fieldset>
            <legend class="mono">03 — Delivery</legend>
            <div class="ship-opts">
              ${SHIPPING.map((s, i) => `
                <label class="ship-opt">
                  <input type="radio" name="ship" value="${s.id}" ${i === 0 ? 'checked' : ''}>
                  <span class="ship-opt__box"><strong>${s.label}</strong><small class="mono">${s.eta}</small></span>
                  <span class="ship-opt__price mono" data-ship-price="${s.id}">${s.price ? money(s.price) : 'Free'}</span>
                </label>`).join('')}
            </div>
          </fieldset>
          <fieldset>
            <legend class="mono">04 — Payment</legend>
            <div class="co__pay">
              <svg class="ico ico--spark"><use href="#i-spark"/></svg>
              <p>Payments are handed off to a secure provider (Shopify Checkout or Stripe). This storefront is in <strong>demo mode</strong> — no card details are collected and nothing is charged.</p>
            </div>
          </fieldset>
          <p class="co__err mono" data-co-err hidden></p>
          <button class="btn btn--holo btn--block btn--lg" type="submit"><span>Place order — demo</span><svg class="ico"><use href="#i-arrow"/></svg></button>
        </form>
        <aside class="co__summary">
          <h2 class="mono">Order summary</h2>
          <ul class="co__lines">
            ${lines.map((l) => `
              <li>
                <div class="co__thumb">${img(l.product.images[0], { sizes: '80px' })}<span class="mono">${l.qty}</span></div>
                <div><strong>${l.product.name}</strong><small class="mono">${HUES[l.product.hue].label} · ${l.size}</small></div>
                <span class="mono">${money(l.product.price * l.qty)}</span>
              </li>`).join('')}
          </ul>
          <dl class="co__totals mono">
            <div><dt>Subtotal</dt><dd data-co-sub></dd></div>
            <div><dt>Shipping</dt><dd data-co-ship></dd></div>
            <div><dt>Tax</dt><dd>Calculated at payment</dd></div>
            <div class="co__total"><dt>Total</dt><dd data-co-total></dd></div>
          </dl>
        </aside>
      </div>
    </section>`;
  },
  mount(root, route, api) {
    const g = gsap();
    const form = root.querySelector('[data-co-form]');
    if (!form) {
      return { intro() { g.from(root.querySelectorAll('.co-empty .w > span'), { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.08 }); } };
    }
    const sub = api.cart.subtotal();
    const totals = () => {
      const id = form.querySelector('input[name="ship"]:checked').value;
      const s = SHIPPING.find((x) => x.id === id);
      const ship = id === 'standard' && sub >= FREE_SHIP ? 0 : s.price;
      root.querySelector('[data-co-sub]').textContent = money(sub);
      root.querySelector('[data-co-ship]').textContent = ship ? money(ship) : 'Free';
      root.querySelector('[data-co-total]').textContent = money(sub + ship);
    };
    if (sub >= FREE_SHIP) root.querySelector('[data-ship-price="standard"]').innerHTML = `<s>${money(15)}</s> Free`;
    form.addEventListener('change', totals);
    totals();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const err = root.querySelector('[data-co-err]');
      const bad = [...form.querySelectorAll('input, select')].find((el) => !el.checkValidity());
      form.querySelectorAll('.field').forEach((f) => f.classList.remove('is-invalid'));
      if (bad) {
        bad.closest('.field')?.classList.add('is-invalid');
        err.hidden = false;
        err.textContent = `Please check: ${bad.labels?.[0]?.textContent || 'a required field'}.`;
        bad.focus();
        return;
      }
      // Demo only: nothing entered here leaves the browser.
      const order = `TRN-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      api.cart.clear();
      const done = document.createElement('div');
      done.className = 'co__done';
      done.innerHTML = `
        <svg class="co__done-logo"><use href="#logo"/></svg>
        <p class="mono">[ Order ${order} — demo ]</p>
        <h2>${words('Thank you. *Welcome to the Trinity Fam.*')}</h2>
        <p>This was a demo checkout — no payment was taken. Connect Shopify or Stripe to take real orders.</p>
        <a class="btn btn--holo" href="#/shop"><span>Keep shopping</span><svg class="ico"><use href="#i-arrow"/></svg></a>`;
      root.querySelector('[data-co]').replaceChildren(done);
      root.querySelectorAll('.co__steps li').forEach((li) => li.classList.add('is-done'));
      api.scrollTop();
      g.from(done.querySelector('.co__done-logo'), { scale: 0.4, opacity: 0, rotate: -30, duration: 1.4, ease: 'expo.out' });
      g.from(done.querySelectorAll('h2 .w > span'), { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.05, delay: 0.2 });
      g.from(done.querySelectorAll('p, .btn'), { opacity: 0, y: 20, duration: 1, stagger: 0.08, delay: 0.5 });
    });

    return {
      intro() {
        g.from(root.querySelectorAll('.pagehead__title .w > span'), { yPercent: 110, duration: 1.2, ease: 'expo.out' });
        g.from(root.querySelectorAll('.co__steps li, fieldset, .co__summary'), { opacity: 0, y: 30, duration: 1, ease: 'expo.out', stagger: 0.06, delay: 0.15 });
      }
    };
  }
};

/* ---------------- 404 ---------------- */

const notFound = {
  title: 'Not found — TRINITY by OB',
  html: () => `
  <section class="pagehead co-empty">
    ${label('404', 'Not found')}
    <h1 class="pagehead__title">${words('This page is still *growing.*')}</h1>
    <a class="btn btn--holo" href="#/shop"><span>Back to the collection</span><svg class="ico"><use href="#i-arrow"/></svg></a>
  </section>`,
  mount: () => ({})
};

export const views = { home, shop, product, story: storyView, lookbook: lookbookView, checkout, notFound };
