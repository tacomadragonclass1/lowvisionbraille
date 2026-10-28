// A DOM stub just large enough to RUN index.html's script to completion, so the
// write playground's real handlers can be driven by real pointer events.
//
// It is not a renderer and is not trying to be one: nothing here checks what
// anything looks like. What it does catch is the class of bug that a syntax
// check cannot - a `const` used before its declaration, a handler bound to the
// wrong element, an id that is not in the markup - all of which throw at load
// and take the whole app down, and all of which happened while this section
// was being written.
import fs from 'node:fs';

export function loadApp(htmlPath, expose='') {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  const listeners = {}, cache = {}, missingIds = [];

  const ctx2d = new Proxy({}, { get: (t, k) => {
    if (k === 'measureText') return () => ({ width: 10 });
    if (k === 'createLinearGradient' || k === 'createRadialGradient')
      return () => ({ addColorStop() {} });
    if (k === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
    return () => {};
  }, set: () => true });

  function el(id) {
    return {
      _id: id, hidden: false, textContent: '', innerHTML: '', value: '',
      disabled: false, width: 800, height: 600, _attrs: {}, _kids: {},
      classList: { _s: new Set(),
        add(...c) { c.forEach(x => this._s.add(x)); },
        remove(...c) { c.forEach(x => this._s.delete(x)); },
        toggle(c, f) { f === undefined ? (this._s.has(c) ? this._s.delete(c) : this._s.add(c))
                                       : (f ? this._s.add(c) : this._s.delete(c)); },
        contains(c) { return this._s.has(c); } },
      style: new Proxy({ _v: {} }, {
        get(t, k) {
          if (k === 'setProperty') return (n, v) => { t._v[n] = v; };
          if (k === 'getPropertyValue') return n => t._v[n] || '';
          if (k === 'removeProperty') return n => { delete t._v[n]; };
          return t._v[k] || '';
        }, set(t, k, v) { t._v[k] = v; return true; } }),
      dataset: {},
      addEventListener(t, f) { (listeners[id] = listeners[id] || {})[t] = f; },
      removeEventListener() {}, appendChild(c) { return c; }, removeChild() {},
      insertBefore() {}, remove() {},
      setAttribute(k, v) { this._attrs[k] = v; }, getAttribute(k) { return this._attrs[k]; },
      removeAttribute(k) { delete this._attrs[k]; },
      closest() { return null; },
      querySelector(sel) { return this._kids[sel] || (this._kids[sel] = el(id + '>' + sel)); },
      querySelectorAll() { return []; },
      focus() {}, blur() {}, click() {},
      setPointerCapture() {}, releasePointerCapture() {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600,
                                      right: 800, bottom: 600, x: 0, y: 0 }),
      animate: () => ({ finished: Promise.resolve(), cancel() {}, onfinish: null }),
      getContext: () => ctx2d,
      requestFullscreen: () => Promise.resolve(),
      get clientWidth() { return 800; }, get clientHeight() { return 600; },
      get offsetWidth() { return 800; }, get offsetHeight() { return 600; },
      get content() { return 'width=device-width'; },
      get children() { return []; }, get firstChild() { return null; },
      get parentNode() { return null; },
    };
  }

  const document = {
    getElementById(id) { if (!ids.has(id)) missingIds.push(id);
                         return cache[id] || (cache[id] = el(id)); },
    createElement(t) { return el('created:' + t); },
    createElementNS(ns, t) {
      const o = el('ns:' + t);
      o.getTotalLength = () => 100;
      o.getPointAtLength = l => ({ x: l % 60, y: (l * 0.7) % 70 });
      return o;
    },
    querySelector(sel) { return cache['sel:' + sel] || (cache['sel:' + sel] = el('sel:' + sel)); },
    querySelectorAll(sel) {
      // Real cards with their dataset filled from the markup, so the sample
      // drawing path runs for real instead of on undefined.
      if (sel.includes('data-sample'))
        return [...html.matchAll(/<button class="card"[^>]*data-mode="([^"]+)"[^>]*data-sample="([^"]+)"/g)]
          .map(m => { const e = el('card:' + m[1]); e.dataset.mode = m[1]; e.dataset.sample = m[2]; return e; });
      if (sel.includes('.card'))
        return [...html.matchAll(/<button class="card"[^>]*data-mode="([^"]+)"/g)]
          .map(m => { const e = el('card:' + m[1]); e.dataset.mode = m[1]; return e; });
      return [this.querySelector(sel)];
    },
    addEventListener(t, f) { (listeners.document = listeners.document || {})[t] = f; },
    removeEventListener() {},
    body: el('body'), documentElement: el('html'),
    get fullscreenElement() { return null; },
    exitFullscreen: () => Promise.resolve(),
  };

  const audioNode = () => {
    const param = () => ({ value: 0, setValueAtTime: param, linearRampToValueAtTime: param,
      exponentialRampToValueAtTime: param, setTargetAtTime: param, cancelScheduledValues: param });
    return new Proxy({}, { get(t, k) {
      if (['frequency','gain','Q','detune','pan','threshold','knee','ratio','attack','release','delayTime'].includes(k))
        return param();
      return () => audioNode();
    }, set: () => true });
  };
  class FakeAudioCtx {
    constructor() { this.currentTime = 0; this.destination = {}; this.state = 'running'; this.sampleRate = 48000; }
    resume() { return Promise.resolve(); } close() { return Promise.resolve(); }
    createGain() { return audioNode(); } createOscillator() { return audioNode(); }
    createBiquadFilter() { return audioNode(); } createBufferSource() { return audioNode(); }
    createDynamicsCompressor() { return audioNode(); } createWaveShaper() { return audioNode(); }
    createConvolver() { return audioNode(); } createStereoPanner() { return audioNode(); }
    createChannelMerger() { return audioNode(); } createDelay() { return audioNode(); }
    createAnalyser() { return audioNode(); }
    createBuffer() { return { getChannelData: () => new Float32Array(128), length: 128, duration: 1 }; }
    decodeAudioData() { return Promise.resolve({}); }
  }

  const g = globalThis;
  g.document = document;
  g.window = {
    addEventListener(t, f) { (listeners.window = listeners.window || {})[t] = f; },
    removeEventListener() {}, devicePixelRatio: 2,
    innerWidth: 800, innerHeight: 600, outerWidth: 800, outerHeight: 700,
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {} }),
    visualViewport: { addEventListener() {}, removeEventListener() {}, width: 800, height: 600, scale: 1 },
    location: { search: '', href: 'http://local/', hash: '' },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    getComputedStyle: () => new Proxy({}, { get: () => '' }),
    screen: { width: 1280, height: 800 }, scrollTo() {},
  };
  for (const k of Object.keys(g.window)) {
    if (k in g) continue;
    try { g[k] = g.window[k]; }
    catch { Object.defineProperty(g, k, { value: g.window[k], configurable: true, writable: true }); }
  }
  g.matchMedia = g.window.matchMedia;
  // defineProperty, not assignment: modern Node ships a getter-only
  // globalThis.navigator, and a plain assign throws in ESM.
  Object.defineProperty(g, 'navigator', {
    value: { userAgent: 'node', maxTouchPoints: 1, userActivation: { hasBeenActive: true } },
    configurable: true, writable: true });
  g.ResizeObserver = class { constructor(cb) { this.cb = cb; } observe() {} unobserve() {} disconnect() {} };
  g.Audio = class {
    constructor(s) { this.src = s; this.volume = 1; this.currentTime = 0; this.duration = 2;
                     this.readyState = 4; this.loop = false; }
    play() { return Promise.resolve(); } pause() {} load() {}
    addEventListener(t, f) { if (t === 'loadedmetadata' || t === 'canplaythrough') setTimeout(f, 0); }
    removeEventListener() {} };
  g.AudioContext = FakeAudioCtx; g.webkitAudioContext = FakeAudioCtx;
  g.OfflineAudioContext = class extends FakeAudioCtx {
    startRendering() { return Promise.resolve({ getChannelData: () => new Float32Array(128) }); } };
  g.performance = { now: () => Date.now() };

  // Expose internals by appending to the IIFE body. The shipped file has no
  // test hooks in it; they exist only for the length of this run.
  let src = html.match(/<script>([\s\S]*)<\/script>/)[1];
  if (expose) {
    const close = src.lastIndexOf('})();');
    src = src.slice(0, close) + expose + src.slice(close);
  }
  new Function(src)();
  return { listeners, missingIds, ids };
}
