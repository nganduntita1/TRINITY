// Hero "portal": a full-screen WebGL canvas that draws the current slide inside
// an arch-shaped SDF mask. The arch can expand to the full viewport (scroll),
// slides dissolve into each other through animated noise, and the pointer
// drives a lens bulge + chromatic split. Zero dependencies (raw WebGL1).

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform sampler2D uT0, uT1;
uniform vec2 uS0, uS1, uRes, uMouse;
uniform vec4 uFrame;          // center.xy, half-size.xy  (device px, y-up)
uniform float uRadius, uFoot, uProg, uTime, uHover, uShift, uRim, uOpen;

float sdArch(vec2 p, vec2 b, vec4 r) {
  r.xy = (p.x > 0.0) ? r.xy : r.zw;
  r.x  = (p.y > 0.0) ? r.x  : r.y;
  vec2 q = abs(p) - b + r.x;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
}
vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(dot(hash(i), f), dot(hash(i + vec2(1, 0)), f - vec2(1, 0)), u.x),
             mix(dot(hash(i + vec2(0, 1)), f - vec2(0, 1)), dot(hash(i + vec2(1, 1)), f - vec2(1, 1)), u.x), u.y);
}
vec2 cover(vec2 uv, vec2 box, vec2 img) {
  float rb = box.x / box.y, ri = img.x / img.y;
  vec2 s = rb > ri ? vec2(1.0, ri / rb) : vec2(rb / ri, 1.0);
  // bias wide crops toward the top of the photo, where faces usually are
  return (uv - 0.5) * s + 0.5 + vec2(0.0, (1.0 - s.y) * 0.32);
}
vec3 rgbSample(sampler2D t, vec2 uv, float k) {
  return vec3(texture2D(t, uv + vec2(k, 0.0)).r, texture2D(t, uv).g, texture2D(t, uv - vec2(k, 0.0)).b);
}

void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 c = uFrame.xy;
  vec2 h = uFrame.zw * vec2(1.0, uOpen);
  c.y -= uFrame.w * (1.0 - uOpen);            // opens upward from the base
  float rr = min(uRadius, min(h.x, h.y));
  float rf = min(uFoot, min(h.x, h.y));
  float d = sdArch(p - c, h, vec4(rr, rf, rr, rf));
  float mask = smoothstep(1.0, -1.0, d);

  vec2 box = 2.0 * uFrame.zw;
  vec2 luv = (p - (uFrame.xy - uFrame.zw)) / box;

  // pointer lens
  vec2 m = (uMouse - (uFrame.xy - uFrame.zw)) / box;
  vec2 dm = luv - m;
  float dist = length(dm * vec2(box.x / box.y, 1.0));
  float lens = smoothstep(0.38, 0.0, dist) * uHover;
  luv -= dm * lens * 0.22;

  // slide dissolve
  float n = noise(luv * 3.2 + uTime * 0.04);
  float f = (1.0 - luv.y) * 0.55 + (n * 0.5 + 0.5) * 0.45;
  float w = 0.12;
  float mixv = smoothstep(f - w, f + w, uProg * (1.0 + 2.0 * w) - w);
  vec2 off = vec2(0.25, 1.0) * n * 0.09;
  vec2 uv0 = cover(luv + off * uProg, box, uS0);
  vec2 uv1 = cover(luv - off * (1.0 - uProg), box, uS1);

  float k = 0.0015 + uShift * 0.012 + lens * 0.006;
  vec3 col = mix(rgbSample(uT0, uv0, k), rgbSample(uT1, uv1, k), mixv);

  // energy line on the dissolve front
  float front = 1.0 - abs(mixv * 2.0 - 1.0);
  col += vec3(0.18, 0.36, 1.0) * pow(front, 3.0) * 0.9 * step(0.001, uProg) * step(uProg, 0.999);

  // scanlines + vignette
  col *= 0.97 + 0.03 * sin(p.y * 1.4 + uTime * 3.0);
  col *= mix(0.62, 1.0, smoothstep(0.95, 0.25, length((luv - 0.5) * vec2(1.0, 0.9))));

  // glowing rim + soft halo
  float rim = exp(-abs(d) * 0.55) * uRim;
  float halo = exp(-max(d, 0.0) * 0.012) * 0.16 * uRim * (1.0 - mask);
  vec3 rimCol = mix(vec3(0.55, 0.65, 1.0), vec3(0.18, 0.36, 1.0), 0.5 + 0.4 * sin(uTime * 0.6 + luv.y * 4.0));

  vec3 outc = col * mask + rimCol * rim * 0.85 + vec3(0.18, 0.3, 0.9) * halo;
  float a = clamp(mask + rim * 0.85 + halo, 0.0, 1.0);
  gl_FragColor = vec4(outc, a);
}
`;

export class HeroGL {
  constructor(canvas, sources, { onReady } = {}) {
    this.canvas = canvas;
    this.sources = sources;
    this.index = 0;
    this.u = { prog: 0, hover: 0, shift: 0, expand: 0, open: 0, rim: 1 };
    this.mouse = { x: 0, y: 0, tx: 0, ty: 0, vx: 0 };
    this.visible = true;
    this.running = false;
    this.busy = false;
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true });
    if (!gl) throw new Error('WebGL unavailable');
    this.gl = gl;
    this.#program();
    this.textures = [];
    this.ready = this.#loadAll().then(() => onReady?.());
    this.#bind();
    this.resize();
  }

  #program() {
    const { gl } = this;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.loc = {};
    ['uT0', 'uT1', 'uS0', 'uS1', 'uRes', 'uMouse', 'uFrame', 'uRadius', 'uFoot', 'uProg', 'uTime', 'uHover', 'uShift', 'uRim', 'uOpen']
      .forEach((n) => (this.loc[n] = gl.getUniformLocation(prog, n)));
    gl.uniform1i(this.loc.uT0, 0);
    gl.uniform1i(this.loc.uT1, 1);
  }

  #loadAll() {
    const { gl } = this;
    return Promise.all(this.sources.map((src, i) => new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.textures[i] = { tex, w: img.naturalWidth, h: img.naturalHeight };
        resolve();
      };
      img.onerror = resolve;
      img.src = src;
    })));
  }

  #bind() {
    this.onMove = (e) => {
      const r = this.canvas.getBoundingClientRect();
      this.mouse.tx = (e.clientX - r.left) * this.dpr;
      this.mouse.ty = (r.height - (e.clientY - r.top)) * this.dpr;
      this.u.hover = Math.min(1, this.u.hover + 0.08);
      this.pointerActive = true;
    };
    this.onLeave = () => (this.pointerActive = false);
    window.addEventListener('pointermove', this.onMove, { passive: true });
    document.addEventListener('pointerleave', this.onLeave);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.canvas);
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      if (this.visible) this.start();
    });
    this.io.observe(this.canvas);
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.w = Math.max(1, Math.round(r.width * this.dpr));
    this.h = Math.max(1, Math.round(r.height * this.dpr));
    this.canvas.width = this.w;
    this.canvas.height = this.h;
    this.gl.viewport(0, 0, this.w, this.h);
  }

  // Arch rect in CSS px, measured from a DOM placeholder so CSS controls layout.
  setArchFrom(el) { this.archEl = el; }

  frame() {
    const { w, h } = this;
    const e = this.u.expand;
    let cx = w / 2, cy = h / 2, hw = w * 0.18, hh = h * 0.36;
    if (this.archEl) {
      const cr = this.canvas.getBoundingClientRect();
      const ar = this.archEl.getBoundingClientRect();
      hw = (ar.width / 2) * this.dpr;
      hh = (ar.height / 2) * this.dpr;
      cx = (ar.left - cr.left + ar.width / 2) * this.dpr;
      cy = (cr.height - (ar.top - cr.top + ar.height / 2)) * this.dpr;
    }
    const lerp = (a, b) => a + (b - a) * e;
    return {
      cx: lerp(cx, w / 2), cy: lerp(cy, h / 2),
      hw: lerp(hw, w / 2 + 2), hh: lerp(hh, h / 2 + 2),
      radius: lerp(hw, 0), foot: lerp(10 * this.dpr, 0)
    };
  }

  goTo(i) {
    if (this.busy || i === this.index || !this.textures[i] || !window.gsap) return false;
    this.busy = true;
    this.nextIndex = i;
    this.u.prog = 0;
    window.gsap.to(this.u, {
      prog: 1, duration: 1.7, ease: 'power2.inOut',
      onComplete: () => { this.index = i; this.u.prog = 0; this.busy = false; }
    });
    return true;
  }
  next() { return this.goTo((this.index + 1) % this.sources.length); }
  prev() { return this.goTo((this.index - 1 + this.sources.length) % this.sources.length); }

  start() {
    if (this.running) return;
    this.running = true;
    const t0 = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      if (!this.visible || document.hidden) { this.running = false; return; }
      this.render((now - t0) / 1000);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  render(t) {
    const { gl, loc, u, mouse } = this;
    const a = this.textures[this.index];
    const b = this.textures[this.busy ? this.nextIndex : this.index];
    if (!a || !b) return;
    const px = mouse.x;
    mouse.x += (mouse.tx - mouse.x) * 0.12;
    mouse.y += (mouse.ty - mouse.y) * 0.12;
    mouse.vx += ((mouse.x - px) / (this.w || 1) - mouse.vx) * 0.2;
    if (!this.pointerActive) u.hover *= 0.95;
    u.shift = Math.min(1, Math.abs(mouse.vx) * 40);

    const f = this.frame();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, a.tex);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, b.tex);
    gl.uniform2f(loc.uS0, a.w, a.h);
    gl.uniform2f(loc.uS1, b.w, b.h);
    gl.uniform2f(loc.uRes, this.w, this.h);
    gl.uniform2f(loc.uMouse, mouse.x, mouse.y);
    gl.uniform4f(loc.uFrame, f.cx, f.cy, f.hw, f.hh);
    gl.uniform1f(loc.uRadius, f.radius);
    gl.uniform1f(loc.uFoot, f.foot);
    gl.uniform1f(loc.uProg, u.prog);
    gl.uniform1f(loc.uTime, t);
    gl.uniform1f(loc.uHover, u.hover);
    gl.uniform1f(loc.uShift, u.shift);
    gl.uniform1f(loc.uRim, u.rim * (1 - u.expand));
    gl.uniform1f(loc.uOpen, u.open);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('pointermove', this.onMove);
    document.removeEventListener('pointerleave', this.onLeave);
    this.ro?.disconnect();
    this.io?.disconnect();
    this.textures.forEach((t) => t && this.gl.deleteTexture(t.tex));
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
