'use strict';

const SCREEN_W = 1920;
const SCREEN_H = 1080;

const APPS = [
  { id: 'zindle', name: 'Main Screen', icon: '<rect x="22" y="14" width="20" height="34" rx="8" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M26 30c0 8 12 8 12 0" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="14" cy="22" r="5" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="50" cy="22" r="5" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="13" cy="46" r="6" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="51" cy="46" r="6" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M16 56h32" stroke="currentColor" stroke-width="2.5"/>' },
  { id: 'ploq', name: 'Map', icon: '<path d="M8 48c14-2 16-26 28-24s16 20 24 8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="10" cy="46" r="3" fill="currentColor"/><circle cx="56" cy="28" r="3" fill="currentColor"/>' },
  { id: 'varn', name: 'Media', icon: '<path d="M14 20h36M14 32h36M14 44h24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' },
  { id: 'wulp', name: 'Energy', icon: '<rect x="12" y="12" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/><rect x="36" y="12" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/><rect x="12" y="36" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/><rect x="36" y="36" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/>' }
];

const TOGGLES = ['brim', 'nox', 'wex', 'plim', 'harn', 'kess', 'vell', 'quor'];
const TOGGLE_LABELS = {
  brim: 'Lights',
  nox: 'Lock',
  wex: 'Wipers',
  plim: 'Defrost',
  harn: 'Camera',
  kess: 'Sentry',
  vell: 'Autopark',
  quor: 'Summon'
};
const MODE_LABELS = { blim: 'Chill', plex: 'Sport', vorn: 'Race' };
const VARN = [
  'Morning Mix',
  'Night Drive',
  'Garage Beats',
  'Highway Hits',
  'City Loop',
  'Rain Session',
  'Charge Chill',
  'Open Road'
];

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

const state = {
  drive: 'zor',
  speed: 64,
  flarn: 72,
  marn: 68,
  glow: { flarn: true, marn: false },
  sheet: null,
  app: 'zindle',
  mode: 'blim',
  glim: 64,
  toggles: { brim: true, nox: false, wex: true, plim: false, harn: true, kess: false, vell: true, quor: false },
  varn: [true, false, true, false, false, true, false, true]
};

const el = {
  screen: document.getElementById('screen'),
  clockHm: document.getElementById('clock-hm'),
  clockS: document.getElementById('clock-s'),
  clock: document.getElementById('clock'),
  speed: document.getElementById('speed'),
  gaugeTrack: document.getElementById('gauge-track'),
  gaugeValue: document.getElementById('gauge-value'),
  flarn: document.getElementById('val-flarn'),
  marn: document.getElementById('val-marn'),
  btnApps: document.getElementById('btn-apps'),
  btnControls: document.getElementById('btn-controls'),
  sheetApps: document.getElementById('sheet-apps'),
  sheetControls: document.getElementById('sheet-controls'),
  glimVal: document.getElementById('glim-val'),
  route: document.getElementById('route'),
  dot: document.getElementById('dot')
};

let shownSpeed = -1;
let routeLen = 0;
let routeT = 0.16;
let lastClock = '';

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function arc(cx, cy, r, a0, a1) {
  const pt = (deg) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const [x0, y0] = pt(a0);
  const [x1, y1] = pt(a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return 'M ' + x0 + ' ' + y0 + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x1 + ' ' + y1;
}

function fit() {
  const scale = Math.min(window.innerWidth / SCREEN_W, window.innerHeight / SCREEN_H);
  el.screen.style.transform = 'scale(' + scale + ')';
}

function renderDrive() {
  document.querySelectorAll('.drive').forEach((button) => {
    button.setAttribute('aria-pressed', button.dataset.drive === state.drive ? 'true' : 'false');
  });
  el.screen.dataset.drive = state.drive;
}

function renderTemps() {
  el.flarn.textContent = String(state.flarn);
  el.marn.textContent = String(state.marn);
  document.querySelectorAll('[data-action="temp"]').forEach((button) => {
    const which = button.dataset.which;
    const step = Number(button.dataset.step);
    const value = state[which];
    button.disabled = (step > 0 && value >= 90) || (step < 0 && value <= 60);
  });
}

function renderGlow() {
  document.querySelectorAll('[data-action="glow"]').forEach((button) => {
    button.setAttribute('aria-pressed', state.glow[button.dataset.which] ? 'true' : 'false');
  });
}

function renderApp() {
  document.querySelectorAll('.view').forEach((view) => {
    view.classList.toggle('is-on', view.dataset.app === state.app);
  });
  document.querySelectorAll('.app-pick').forEach((button) => {
    button.classList.toggle('is-current', button.dataset.app === state.app);
  });
  if (state.app === 'ploq') {
    routeLen = el.route.getTotalLength();
  }
}

function slideSheet(node, open) {
  node.getAnimations().forEach((anim) => anim.cancel());
  if (!open || reduce.matches) return;
  node.animate(
    [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }],
    { duration: 420, easing: 'cubic-bezier(0.22, 0.8, 0.2, 1)', fill: 'forwards' }
  );
}

function renderSheet() {
  const apps = state.sheet === 'apps';
  const controls = state.sheet === 'controls';
  el.sheetApps.classList.toggle('open', apps);
  el.sheetControls.classList.toggle('open', controls);
  el.sheetApps.setAttribute('aria-hidden', apps ? 'false' : 'true');
  el.sheetControls.setAttribute('aria-hidden', controls ? 'false' : 'true');
  el.btnApps.setAttribute('aria-pressed', apps ? 'true' : 'false');
  el.btnControls.setAttribute('aria-pressed', controls ? 'true' : 'false');
  slideSheet(el.sheetApps, apps);
  slideSheet(el.sheetControls, controls);
}

function renderMode() {
  const read = document.getElementById('mode-read');
  if (read) read.textContent = MODE_LABELS[state.mode] || state.mode;
  document.querySelectorAll('[data-action="mode"]').forEach((button) => {
    button.setAttribute('aria-pressed', button.dataset.mode === state.mode ? 'true' : 'false');
  });
}

function renderToggles() {
  document.querySelectorAll('[data-toggle]').forEach((button) => {
    button.setAttribute('aria-pressed', state.toggles[button.dataset.toggle] ? 'true' : 'false');
  });
}

function renderVarn() {
  document.querySelectorAll('.varn-row').forEach((row, index) => {
    row.setAttribute('aria-pressed', state.varn[index] ? 'true' : 'false');
  });
}

function paintSpeed(display) {
  const rounded = Math.max(0, Math.round(display));
  if (rounded !== shownSpeed) {
    shownSpeed = rounded;
    el.speed.textContent = String(rounded);
  }
  const start = -120;
  const sweep = 240;
  const frac = clamp(display / 80, 0, 1);
  el.gaugeTrack.setAttribute('d', arc(200, 186, 150, start, start + sweep));
  if (frac < 0.015) {
    el.gaugeValue.setAttribute('d', '');
  } else {
    el.gaugeValue.setAttribute('d', arc(200, 186, 150, start, start + sweep * frac));
  }
  el.gaugeValue.style.stroke = state.drive === 'zor' ? '#f50000' : '#f3f0e8';
}

function tickClock(date) {
  let h = date.getHours();
  h = h % 12 || 12;
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  const key = h + ':' + m + ':' + s;
  if (key === lastClock) return;
  lastClock = key;
  el.clockHm.textContent = h + ':' + m;
  el.clockS.textContent = ':' + s;
  el.clock.setAttribute('datetime', date.toISOString());
}

function openApp(name) {
  if (!APPS.some((app) => app.id === name)) return;
  state.app = name;
  state.sheet = null;
  renderApp();
  renderSheet();
}

function buildChrome() {
  const apps = document.getElementById('sheet-apps');
  APPS.forEach((app) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'app-pick';
    button.dataset.action = 'app';
    button.dataset.app = app.id;
    button.innerHTML = '<span class="app-icon icon-' + app.id + '"><svg viewBox="0 0 64 64" aria-hidden="true">' + app.icon + '</svg></span><span class="app-name">' + app.name + '</span>';
    apps.appendChild(button);
  });

  const tileMarkup = TOGGLES.map((name) => {
    const label = TOGGLE_LABELS[name] || name;
    return '<button type="button" class="tile" data-action="toggle" data-toggle="' + name + '">' + label + '</button>';
  }).join('');
  document.getElementById('control-tiles').innerHTML = tileMarkup;

  const list = document.getElementById('varn-list');
  VARN.forEach((name, index) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'varn-row';
    row.dataset.action = 'varn';
    row.dataset.index = String(index);
    row.innerHTML = '<span>' + name + '</span><span class="mark" aria-hidden="true"></span>';
    list.appendChild(row);
  });
}

el.screen.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target || !el.screen.contains(target)) return;
  const action = target.dataset.action;

  if (action === 'drive') {
    const drive = target.dataset.drive;
    if (drive === 'nul' || drive === 'snar' || drive === 'vex' || drive === 'zor') {
      state.drive = drive;
      renderDrive();
    }
    return;
  }

  if (action === 'temp') {
    const which = target.dataset.which;
    if (which !== 'flarn' && which !== 'marn') return;
    state[which] = clamp(state[which] + Number(target.dataset.step), 60, 90);
    renderTemps();
    return;
  }

  if (action === 'glow') {
    const which = target.dataset.which;
    if (which !== 'flarn' && which !== 'marn') return;
    state.glow[which] = !state.glow[which];
    renderGlow();
    return;
  }

  if (action === 'sheet') {
    const name = target.dataset.sheet;
    state.sheet = state.sheet === name ? null : name;
    renderSheet();
    return;
  }

  if (action === 'app') {
    openApp(target.dataset.app);
    return;
  }

  if (action === 'mode') {
    const mode = target.dataset.mode;
    if (mode === 'blim' || mode === 'plex' || mode === 'vorn') {
      state.mode = mode;
      renderMode();
    }
    return;
  }

  if (action === 'toggle') {
    const key = target.dataset.toggle;
    if (!Object.prototype.hasOwnProperty.call(state.toggles, key)) return;
    state.toggles[key] = !state.toggles[key];
    renderToggles();
    return;
  }

  if (action === 'varn') {
    const index = Number(target.dataset.index);
    if (!Number.isInteger(index) || !VARN[index]) return;
    state.varn[index] = !state.varn[index];
    renderVarn();
  }
});

el.screen.addEventListener('input', (event) => {
  const target = event.target;
  if (target.id === 'hush') return;
  if (target.id === 'glim') {
    state.glim = Number(target.value);
    el.glimVal.textContent = String(state.glim);
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.sheet) {
    state.sheet = null;
    renderSheet();
  }
});

window.addEventListener('resize', fit);

function frame(now) {
  if (!frame.last) frame.last = now;
  const dt = Math.min(0.05, (now - frame.last) / 1000);
  frame.last = now;

  const goal = state.drive === 'zor' ? 64 : state.drive === 'vex' ? 22 : 0;
  state.speed += (goal - state.speed) * (1 - Math.exp(-dt * 1.7));
  let display = state.speed;
  if (state.drive === 'zor' && Math.abs(state.speed - 64) < 1.6 && !reduce.matches) {
    display += Math.sin(now / 1000 * 2.3) * 1.15;
  }
  el.screen.dataset.moving = state.speed > 1 ? 'true' : 'false';
  paintSpeed(display);

  tickClock(new Date());

  if (state.app === 'ploq' && !reduce.matches) {
    if (!routeLen) routeLen = el.route.getTotalLength();
    if (routeLen) {
      routeT = (routeT + dt * 0.045) % 1;
      const point = el.route.getPointAtLength(routeLen * routeT);
      el.dot.setAttribute('cx', point.x);
      el.dot.setAttribute('cy', point.y);
    }
  }

  requestAnimationFrame(frame);
}

buildChrome();
fit();
renderDrive();
renderTemps();
renderGlow();
renderApp();
renderSheet();
renderMode();
renderToggles();
renderVarn();
paintSpeed(state.speed);
tickClock(new Date());
requestAnimationFrame(frame);
