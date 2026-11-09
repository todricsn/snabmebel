const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'assets', 'site-motion.js'), 'utf8');
function node(tokens, parent = null, bottom = 200) {
  const classes = new Set(), listeners = {}, attrs = {};
  const n = { tokens, parentElement: parent, dataset: {}, listeners, attrs, tagName: tokens[0].toUpperCase(), children: [], rect: { top: bottom - 100, bottom },
    classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x) },
    style: { removeProperty(key) { delete this[key]; } },
    matches(selector) { return selector.split(',').some(key => tokens.includes(key.trim()) || (key === '[hidden]' && this.hidden)); },
    closest(selector) { for (let p = this; p; p = p.parentElement) if (p.matches(selector)) return p; return null; },
    contains(other) { for (let p = other; p; p = p.parentElement) if (p === this) return true; return false; },
    getClientRects() { return this.closest('[hidden]') ? [] : [{}]; },
    getBoundingClientRect() { return this.rect; },
    querySelectorAll(selector) { return this.queries?.[selector] || []; },
    querySelector(selector) { return this.singles?.[selector] || null; },
    getAttribute(key) { return attrs[key]; },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    removeEventListener(type, fn) { listeners[type] = (listeners[type] || []).filter(x => x !== fn); }
  };
  if (parent) parent.children.push(n);
  return n;
}
function boot({ gsap = true, scrollTrigger = true, reduced = false, intro = false, gsapFailure = false, syncEnter = false, focusedBlock = false, initialVisible = false } = {}) {
  const body = node(['body']), html = node(['html']), main = node(['main'], body);
  const hero = node(['section', '.hero', 'main section'], main);
  const h1 = node(['h1'], hero), p = node(['p'], hero), image = node(['img'], hero);
  const block = node(['section', 'main section'], main, 1400);
  if (initialVisible) block.rect = { top: 40, bottom: 400 };
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
  const win = node(['window']); win.scrollY = 0; win.innerHeight = 800; win.__snabMotionFallback = 42;
  const timelines = [], clearCalls = [], setCalls = [], timers = [], sessions = [], triggers = [], registeredPlugins = [];
  const engine = {
    registerPlugin(plugin) { registeredPlugins.push(plugin); },
    set(targets, vars) {
      if (gsapFailure) throw Error('simulated GSAP failure');
      setCalls.push({ targets: [...targets], vars });
      if (vars.clearProps) {
        clearCalls.push([...targets]);
        targets.forEach(target => {
          vars.clearProps.split(',').forEach(prop => delete target.style[prop]);
          if (vars.clearProps.includes('transform')) ['x', 'y', 'scale', 'force3D'].forEach(prop => delete target.style[prop]);
        });
      }
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
  const plugin = { create(options) {
    const trigger = { options, killed: false, kill() { this.killed = true; }, fire() { options.onEnter(this); } };
    triggers.push(trigger);
    if (syncEnter) trigger.fire();
    return trigger;
  } };
  win.ScrollTrigger = scrollTrigger ? plugin : undefined;
  const doc = node(['document']); doc.body = body; doc.documentElement = html; doc.activeElement = focusedBlock ? h2 : body;
  doc.querySelector = selector => ({ main, '.site-intro': overlay })[selector] || null;
  doc.getElementById = id => id === 'request' ? request : null;
  vm.runInNewContext(source, { document: doc, window: win, matchMedia: () => motion,
    location: { hash: '' }, clearTimeout: id => timers.push(id),
    sessionStorage: { setItem: (key, value) => sessions.push([key, value]) } });
  return { body, html, hero, h1, p, image, block, li, h2, copy, hiddenCopy, request, requestTitle, formTitle, field,
    outline, logo, motion, win, doc, timelines, clearCalls, setCalls, timers, sessions, triggers, plugin, registeredPlugins };
}
function emit(target, type, event) { (target.listeners[type] || []).forEach(fn => fn(event)); }
function triggerFor(s, root) { return s.triggers.find(trigger => trigger.options.trigger === root); }
function assertNoFade(s, targets) {
  const vars = s.setCalls.filter(call => !call.vars.clearProps && call.targets.some(target => targets.includes(target))).map(call => call.vars);
  s.timelines.forEach(tl => tl.steps.forEach(step => {
    if (step.targets?.some(target => targets.includes(target))) vars.push(step.from || {}, step.to || {});
  }));
  vars.forEach(value => ['opacity', 'autoAlpha', 'visibility', 'scale', 'scaleX', 'scaleY', 'willChange'].forEach(prop =>
    assert(!Object.hasOwn(value, prop), `visible scroll content must never receive ${prop}`)));
}
{
  const s = boot({ gsap: false, intro: true });
  assert.equal(s.html.classList.contains('motion-intro'), false, 'missing GSAP must never leave the loader on screen');
  assert.equal(s.body.dataset.motionState, 'fallback');
  assert.equal(s.sessions[0][0], 'snabmebel-intro-v1'); assert.equal(s.sessions[0][1], '1');
  assert(s.timers.includes(42), 'engine clears the head bootstrap fail-safe');
}
{
  const s = boot({ scrollTrigger: false, intro: true });
  assert.equal(s.timelines.length, 0, 'missing ScrollTrigger leaves readable content without starting motion');
  assert.equal(s.html.classList.contains('motion-intro'), false);
  assert.equal(s.body.dataset.motionState, 'fallback');
  assert.equal(s.h1.style.opacity, undefined);
}
{
  const s = boot({ reduced: true, intro: true });
  assert.equal(s.timelines.length, 0, 'reduced motion starts no timeline');
  assert.equal(s.triggers.length, 0, 'reduced motion registers no scroll triggers');
  assert.equal(s.html.classList.contains('motion-intro'), false);
}
{
  const s = boot();
  assert.equal(s.timelines.length, 1, 'first screen is orchestrated while scroll scenes wait for ScrollTrigger');
  assert.equal(s.registeredPlugins.length, 1); assert.equal(s.registeredPlugins[0], s.plugin);
  assert.equal(s.triggers.length, Number(s.body.dataset.motionScenes) - 1, 'one trigger per non-hero scene');
  assert.equal(new Set(s.triggers.map(trigger => trigger.options.trigger)).size, s.triggers.length);
  s.triggers.forEach(trigger => { assert.equal(trigger.options.once, true); assert.equal(trigger.options.start, 'top bottom+=80'); });
  assert(!triggerFor(s, s.hero), 'the hero has its own first-screen choreography');
  assert.equal(s.h2.style.opacity, undefined, 'below-fold copy is visible by default');
  assert(!triggerFor(s, s.h2), 'ScrollTrigger observes scene containers, never leaf copy');
  s.block.rect = { top: 820, bottom: 1200 }; s.h2.rect = { top: 840, bottom: 910 };
  triggerFor(s, s.block).fire();
  assertNoFade(s, [s.h1, s.p, s.image, s.h2, s.copy]);
  const scrollTimeline = s.timelines.at(-1), timelineCount = s.timelines.length;
  triggerFor(s, s.block).fire();
  assert.equal(s.timelines.length, timelineCount, 'a repeated entry callback cannot restart an active reveal');
  const allTargets = s.timelines.flatMap(tl => tl.steps.flatMap(step => step.targets || []));
  for (const a of allTargets) for (const b of allTargets) if (a !== b) assert(!a.contains(b), 'ancestor and descendant must never be animated together');
  assert(!allTargets.includes(s.li), 'nested heading/copy own the reveal rather than their list container');
  assert(!allTargets.includes(s.hiddenCopy), 'closed disclosure content is not revealed or pre-hidden');
  assert.equal(s.h2.style.transition, 'none', 'CSS transitions cannot chase GSAP frame updates');
  const setup = s.setCalls.find(call => !call.vars.clearProps && call.targets.includes(s.h2));
  assert.equal(setup.vars.force3D, false, 'text movement does not force a compositing layer');
  scrollTimeline.options.onComplete();
  assert(triggerFor(s, s.block).killed, 'completed scenes kill their scroll trigger');
  triggerFor(s, s.block).fire();
  assert.equal(s.timelines.length, timelineCount, 'completed scenes remain visible on reentry');
  triggerFor(s, s.request).fire(); triggerFor(s, s.formTitle.parentElement).fire();
  emit(s.doc, 'focusin', { target: s.field });
  assert.equal(s.requestTitle.style.opacity, undefined, 'focusing a form completes its surrounding copy');
  assert.equal(s.formTitle.style.opacity, undefined);
  s.motion.matches = true; emit(s.motion, 'change', {});
  assert.equal(s.h1.style.opacity, undefined); assert.equal(s.image.style.transform, undefined);
  assert.equal(s.h2.style.transition, undefined); assert.equal(s.body.dataset.motionState, 'reduced');
  assert(s.triggers.every(trigger => trigger.killed), 'motion preference changes kill all pending triggers');
}
{
  const s = boot();
  const trigger = triggerFor(s, s.block), count = s.timelines.length;
  s.block.rect = { top: 20, bottom: 400 }; s.h2.rect = { top: 40, bottom: 110 };
  trigger.fire();
  assert(trigger.killed, 'late entry is completed immediately when its content is already on screen');
  assert.equal(s.timelines.length, count, 'late entry never moves or hides copy the visitor is reading');
  assert.equal(s.h2.style.y, undefined); assert.equal(s.h2.style.opacity, undefined);
  assertNoFade(s, [s.h2, s.copy]);
  const visible = boot({ initialVisible: true });
  assert(!triggerFor(visible, visible.block), 'initially visible content is not registered for a future reveal');
  assert.equal(visible.h2.style.y, undefined); assert.equal(visible.h2.style.opacity, undefined);
}
{
  const s = boot({ syncEnter: true, focusedBlock: true });
  assert(triggerFor(s, s.block).killed, 'synchronous entry finishing before create returns still kills the trigger');
  assert.equal(s.h2.style.opacity, undefined, 'focused content never receives a hidden state');
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
  tl.steps.find(step => step.fn).fn();
  assert.equal(s.h1.style.opacity, 0, 'only the hero covered by the loader may start transparent');
  emit(s.win, 'wheel', {});
  assert.equal(s.html.classList.contains('motion-intro'), false, 'scroll intent dismisses the intro immediately');
  assert.equal(s.sessions[0][1], '1');
}
{
  const s = boot(); emit(s.win, 'pageshow', { persisted: true });
  assert.equal(s.h1.style.opacity, undefined); assert.equal(s.h1.style.transition, undefined);
  assert(s.triggers.every(trigger => trigger.killed), 'BFCache restoration clears all pending triggers');
  assert.equal(s.body.dataset.motionState, 'restored', 'BFCache restores a visible, interactive page');
  const fail = boot({ intro: true, gsapFailure: true });
  assert.equal(fail.html.classList.contains('motion-intro'), false);
  assert.equal(fail.body.dataset.motionState, 'fallback');
}
console.log('site-motion: ScrollTrigger lifecycle, visible late entry, loader timing, disjoint leaves, focus, reduced motion and BFCache checks passed');
