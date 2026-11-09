const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'assets', 'site-motion.js'), 'utf8');
function node(tokens, parent = null, bottom = 200) {
  const classes = new Set(), listeners = {}, attrs = {};
  const n = { tokens, parentElement: parent, dataset: {}, listeners, attrs, tagName: tokens[0].toUpperCase(), children: [],
    classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x) },
    style: { removeProperty(key) { delete this[key]; } },
    matches(selector) { return selector.split(',').some(key => tokens.includes(key.trim()) || (key === '[hidden]' && this.hidden)); },
    closest(selector) { for (let p = this; p; p = p.parentElement) if (p.matches(selector)) return p; return null; },
    contains(other) { for (let p = other; p; p = p.parentElement) if (p === this) return true; return false; },
    getClientRects() { return this.closest('[hidden]') ? [] : [{}]; },
    getBoundingClientRect() { return { top: bottom - 100, bottom }; },
    querySelectorAll(selector) { return this.queries?.[selector] || []; },
    querySelector(selector) { return this.singles?.[selector] || null; },
    getAttribute(key) { return attrs[key]; },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    removeEventListener(type, fn) { listeners[type] = (listeners[type] || []).filter(x => x !== fn); }
  };
  if (parent) parent.children.push(n);
  return n;
}
function boot({ gsap = true, reduced = false, intro = false, gsapFailure = false } = {}) {
  const body = node(['body']), html = node(['html']), main = node(['main'], body);
  const hero = node(['section', '.hero', 'main section'], main);
  const h1 = node(['h1'], hero), p = node(['p'], hero), image = node(['img'], hero);
  const block = node(['section', 'main section'], main, 1400);
  const li = node(['li'], block, 1400), h2 = node(['h2'], li, 1400), copy = node(['p'], li, 1400);
  const closed = node(['details', 'details:not([open])', 'main details'], block, 1400);
  const summary = node(['summary'], closed, 1400), hiddenCopy = node(['p'], closed, 1400);
  const request = node(['section', 'main section', '#request'], main, 1900);
  const requestTitle = node(['h2'], request, 1900), form = node(['form', '.lead-form'], request, 1900);
  const formHeading = node(['div', 'main .form-heading', '.form-heading'], form, 1900);
  const formTitle = node(['h3'], formHeading, 1900), field = node(['input'], form, 1900);
  const pool = [h1, p, image, li, h2, copy, summary, hiddenCopy, requestTitle, formTitle];
  main.querySelector = () => hero; main.querySelectorAll = () => pool;
  const overlay = node(['div'], body), outline = node(['svg'], overlay), path = node(['path'], outline), logo = node(['svg'], overlay);
  overlay.querySelectorAll = selector => selector === '.site-intro-outline path' ? [path] : [outline, path, logo];
  overlay.querySelector = selector => selector === '.site-intro-logo' ? logo : outline;
  if (intro) html.classList.add('motion-intro');
  const motion = node(['media']); motion.matches = reduced;
  const win = node(['window']); win.scrollY = 0; win.__snabMotionFallback = 42;
  const timelines = [], clearCalls = [], timers = [], sessions = [];
  const engine = {
    set(targets, vars) {
      if (gsapFailure) throw Error('simulated GSAP failure');
      if (vars.clearProps) clearCalls.push([...targets]);
      else targets.forEach(target => Object.assign(target.style, vars));
    },
    timeline(options) {
      const tl = { options, steps: [], killed: false,
        fromTo(targets, from, to, at) { this.steps.push({ targets: Array.isArray(targets) ? targets : [targets], from, to, at }); return this; },
        to(targets, to, at) { this.steps.push({ targets: Array.isArray(targets) ? targets : [targets], to, at }); return this; },
        call(fn, args, at) { this.steps.push({ fn, at }); return this; },
        play() { this.played = true; this.steps.forEach(step => step.from && step.targets.forEach(target => Object.assign(target.style, step.from))); return this; },
        kill() { this.killed = true; }
      };
      timelines.push(tl); return tl;
    }
  };
  win.gsap = gsap ? engine : undefined;
  let io;
  class Observer {
    constructor(callback) { this.callback = callback; this.observed = new Set(); io = this; }
    observe(root) { this.observed.add(root); }
    unobserve(root) { this.observed.delete(root); }
    disconnect() { this.observed.clear(); }
    fire(root) { this.callback([{ target: root, isIntersecting: true, boundingClientRect: root.getBoundingClientRect() }]); }
  }
  win.IntersectionObserver = Observer;
  const doc = node(['document']); doc.body = body; doc.documentElement = html; doc.activeElement = body;
  doc.querySelector = selector => ({ main, '.site-intro': overlay })[selector] || null;
  doc.getElementById = id => id === 'request' ? request : null;
  vm.runInNewContext(source, { document: doc, window: win, matchMedia: () => motion,
    IntersectionObserver: Observer, location: { hash: '' }, clearTimeout: id => timers.push(id),
    sessionStorage: { setItem: (key, value) => sessions.push([key, value]) } });
  return { body, html, hero, h1, p, image, block, li, h2, hiddenCopy, request, requestTitle, formTitle, field,
    outline, logo, motion, win, doc, timelines, clearCalls, timers, sessions, io };
}
function emit(target, type, event) { (target.listeners[type] || []).forEach(fn => fn(event)); }
{
  const s = boot({ gsap: false, intro: true });
  assert.equal(s.html.classList.contains('motion-intro'), false, 'missing GSAP must never leave the loader on screen');
  assert.equal(s.body.dataset.motionState, 'fallback');
  assert.equal(s.sessions[0][0], 'snabmebel-intro-v1'); assert.equal(s.sessions[0][1], '1');
  assert(s.timers.includes(42), 'engine clears the head bootstrap fail-safe');
}
{
  const s = boot({ reduced: true, intro: true });
  assert.equal(s.timelines.length, 0, 'reduced motion starts no timeline');
  assert.equal(s.html.classList.contains('motion-intro'), false);
}
{
  const s = boot();
  assert.equal(s.timelines.length, 1, 'first screen is orchestrated while scroll scenes wait for IO');
  assert.equal(s.h2.style.opacity, undefined, 'below-fold copy is visible by default');
  assert(!s.io.observed.has(s.h2), 'IO observes scene containers, never leaf copy');
  s.io.fire(s.block);
  const allTargets = s.timelines.flatMap(tl => tl.steps.flatMap(step => step.targets || []));
  for (const a of allTargets) for (const b of allTargets) if (a !== b) assert(!a.contains(b), 'ancestor and descendant must never be animated together');
  assert(!allTargets.includes(s.li), 'nested heading/copy own the reveal rather than their list container');
  assert(!allTargets.includes(s.hiddenCopy), 'closed disclosure content is not revealed or pre-hidden');
  assert.equal(s.h2.style.transition, 'none', 'CSS transitions cannot chase GSAP frame updates');
  s.io.fire(s.request); s.io.fire(s.formTitle.parentElement);
  emit(s.doc, 'focusin', { target: s.field });
  assert.equal(s.requestTitle.style.opacity, undefined, 'focusing a form completes its surrounding copy');
  assert.equal(s.formTitle.style.opacity, undefined);
  s.motion.matches = true; emit(s.motion, 'change', {});
  assert.equal(s.h1.style.opacity, undefined); assert.equal(s.image.style.transform, undefined);
  assert.equal(s.h2.style.transition, undefined); assert.equal(s.body.dataset.motionState, 'reduced');
}
{
  const s = boot({ intro: true }); const tl = s.timelines[0];
  const draw = tl.steps.find(step => step.to?.strokeDashoffset === 0);
  assert.equal(draw.to.autoRound, false, 'normalized pathLength drawing must preserve fractional dash offsets');
  assert(tl.steps.some(step => step.targets?.includes(s.outline) && step.to.opacity === 0), 'outline fades before the full brand wordmark');
  const outlineFade = tl.steps.find(step => step.targets?.includes(s.outline) && step.to.opacity === 0);
  const logo = tl.steps.find(step => step.targets?.includes(s.logo));
  assert.equal(logo.from.autoAlpha, 0, 'the hidden wordmark starts with an explicit visibility-aware state');
  assert.equal(logo.to.autoAlpha, 1, 'wordmark reveal must override the CSS visibility:hidden');
  assert(outlineFade.at < logo.at);
  const exit = tl.steps.find(step => step.to?.yPercent === -100);
  assert(exit.at + exit.to.duration <= 1.8, 'loader exit is short, never a fake fixed loading wait');
  emit(s.win, 'wheel', {});
  assert.equal(s.html.classList.contains('motion-intro'), false, 'scroll intent dismisses the intro immediately');
  assert.equal(s.sessions[0][1], '1');
}
{
  const s = boot(); emit(s.win, 'pageshow', { persisted: true });
  assert.equal(s.h1.style.opacity, undefined); assert.equal(s.h1.style.transition, undefined);
  assert.equal(s.body.dataset.motionState, 'restored', 'BFCache restores a visible, interactive page');
  const fail = boot({ intro: true, gsapFailure: true });
  assert.equal(fail.html.classList.contains('motion-intro'), false);
  assert.equal(fail.body.dataset.motionState, 'fallback');
}
console.log('site-motion: fail-open, loader timing, disjoint leaves, IO, focus, reduced motion and BFCache checks passed');
