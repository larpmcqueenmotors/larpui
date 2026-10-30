'use strict';

const SCREEN_W = 1920;
const SCREEN_H = 1080;

const APPS = [
        {
                id: 'main',
                name: 'Main Screen',
                icon:
                        '<rect x="22" y="14" width="20" height="34" rx="8" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
                        '<path d="M26 30c0 8 12 8 12 0" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
                        '<circle cx="14" cy="22" r="5" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
                        '<circle cx="50" cy="22" r="5" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
                        '<circle cx="13" cy="46" r="6" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
                        '<circle cx="51" cy="46" r="6" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
                        '<path d="M16 56h32" stroke="currentColor" stroke-width="2.5"/>'
        },
        {
                id: 'map',
                name: 'Map',
                icon:
                        '<path d="M8 48c14-2 16-26 28-24s16 20 24 8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
                        '<circle cx="10" cy="46" r="3" fill="currentColor"/>' +
                        '<circle cx="56" cy="28" r="3" fill="currentColor"/>'
        },
        {
                id: 'energy',
                name: 'Energy',
                icon:
                        '<rect x="12" y="12" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
                        '<rect x="36" y="12" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
                        '<rect x="12" y="36" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
                        '<rect x="36" y="36" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/>'
        }
];

const TOGGLES = [
        { id: 'lights', label: 'Lights', on: true },
        { id: 'lock', label: 'Lock', on: false },
        { id: 'wipers', label: 'Wipers', on: true },
        { id: 'defrost', label: 'Defrost', on: false },
        { id: 'camera', label: 'Camera', on: true },
        { id: 'sentry', label: 'Sentry', on: false },
        { id: 'autopark', label: 'Autopark', on: true },
        { id: 'summon', label: 'Summon', on: false }
];

const DRIVES = ['p', 'r', 'n', 'd'];
const MODES = ['chill', 'sport', 'race'];
const SEATS = ['driver', 'passenger'];

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const state = {
        drive: 'd',
        speed: 64,
        driver: 72,
        passenger: 68,
        heat: { driver: true, passenger: false },
        sheet: null,
        app: 'main',
        mode: 'chill',
        speedLimit: 64,
        toggles: Object.fromEntries(TOGGLES.map((t) => [t.id, t.on]))
};

const el = {
        screen: document.getElementById('screen'),
        clockHm: document.getElementById('clock-hm'),
        clockS: document.getElementById('clock-s'),
        clock: document.getElementById('clock'),
        speed: document.getElementById('speed'),
        gaugeTrack: document.getElementById('gauge-track'),
        gaugeValue: document.getElementById('gauge-value'),
        driver: document.getElementById('val-driver'),
        passenger: document.getElementById('val-passenger'),
        btnApps: document.getElementById('btn-apps'),
        btnControls: document.getElementById('btn-controls'),
        sheetApps: document.getElementById('sheet-apps'),
        sheetControls: document.getElementById('sheet-controls'),
        speedLimitVal: document.getElementById('speed-limit-val'),
        route: document.getElementById('route'),
        dot: document.getElementById('dot')
};

let shownSpeed = -1;
let routeLen = 0;
let routeT = 0.16;
let lastClock = '';
let lastFrame = 0;

function clamp(n, lo, hi) {
        return Math.max(lo, Math.min(hi, n));
}

function arcPath(cx, cy, r, startDeg, endDeg) {
        const rad = (deg) => ((deg - 90) * Math.PI) / 180;
        const x0 = cx + r * Math.cos(rad(startDeg));
        const y0 = cy + r * Math.sin(rad(startDeg));
        const x1 = cx + r * Math.cos(rad(endDeg));
        const y1 = cy + r * Math.sin(rad(endDeg));
        const large = endDeg - startDeg > 180 ? 1 : 0;
        return 'M ' + x0 + ' ' + y0 + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x1 + ' ' + y1;
}

function fitScreen() {
        const scale = Math.min(window.innerWidth / SCREEN_W, window.innerHeight / SCREEN_H);
        el.screen.style.transform = 'scale(' + scale + ')';
}

function renderDrive() {
        document.querySelectorAll('.drive').forEach((btn) => {
                btn.setAttribute('aria-pressed', btn.dataset.drive === state.drive ? 'true' : 'false');
        });
        el.screen.dataset.drive = state.drive;
}

function renderTemps() {
        el.driver.textContent = String(state.driver);
        el.passenger.textContent = String(state.passenger);
        document.querySelectorAll('[data-action="temp"]').forEach((btn) => {
                const seat = btn.dataset.seat;
                const step = Number(btn.dataset.step);
                const value = state[seat];
                btn.disabled = (step > 0 && value >= 90) || (step < 0 && value <= 60);
        });
}

function renderHeat() {
        document.querySelectorAll('[data-action="heat"]').forEach((btn) => {
                btn.setAttribute('aria-pressed', state.heat[btn.dataset.seat] ? 'true' : 'false');
        });
}

function renderApp() {
        document.querySelectorAll('.view').forEach((view) => {
                view.classList.toggle('is-on', view.dataset.app === state.app);
        });
        document.querySelectorAll('.app-pick').forEach((btn) => {
                btn.classList.toggle('is-current', btn.dataset.app === state.app);
        });
        if (state.app === 'map') {
                routeLen = el.route.getTotalLength();
        }
}

function slideSheet(node, open) {
        node.getAnimations().forEach((anim) => anim.cancel());
        if (!open || reduceMotion.matches) return;
        node.animate(
                [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }],
                { duration: 420, easing: 'cubic-bezier(0.22, 0.8, 0.2, 1)', fill: 'forwards' }
        );
}

function renderSheet() {
        const appsOpen = state.sheet === 'apps';
        const controlsOpen = state.sheet === 'controls';

        el.sheetApps.classList.toggle('open', appsOpen);
        el.sheetControls.classList.toggle('open', controlsOpen);
        el.sheetApps.setAttribute('aria-hidden', appsOpen ? 'false' : 'true');
        el.sheetControls.setAttribute('aria-hidden', controlsOpen ? 'false' : 'true');
        el.btnApps.setAttribute('aria-pressed', appsOpen ? 'true' : 'false');
        el.btnControls.setAttribute('aria-pressed', controlsOpen ? 'true' : 'false');

        slideSheet(el.sheetApps, appsOpen);
        slideSheet(el.sheetControls, controlsOpen);
}

function renderMode() {
        const label = document.getElementById('mode-read');
        if (label) {
                label.textContent = state.mode.charAt(0).toUpperCase() + state.mode.slice(1);
        }
        document.querySelectorAll('[data-action="mode"]').forEach((btn) => {
                btn.setAttribute('aria-pressed', btn.dataset.mode === state.mode ? 'true' : 'false');
        });
}

function renderToggles() {
        document.querySelectorAll('[data-toggle]').forEach((btn) => {
                btn.setAttribute('aria-pressed', state.toggles[btn.dataset.toggle] ? 'true' : 'false');
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

        el.gaugeTrack.setAttribute('d', arcPath(200, 186, 150, start, start + sweep));
        el.gaugeValue.setAttribute(
                'd',
                frac < 0.015 ? '' : arcPath(200, 186, 150, start, start + sweep * frac)
        );
        el.gaugeValue.style.stroke = state.drive === 'd' ? '#f50000' : '#f3f0e8';
}

function tickClock(date) {
        let h = date.getHours() % 12;
        if (h === 0) h = 12;
        const m = String(date.getMinutes()).padStart(2, '0');
        const s = String(date.getSeconds()).padStart(2, '0');
        const key = h + ':' + m + ':' + s;
        if (key === lastClock) return;
        lastClock = key;
        el.clockHm.textContent = h + ':' + m;
        el.clockS.textContent = ':' + s;
        el.clock.setAttribute('datetime', date.toISOString());
}

function openApp(id) {
        if (!APPS.some((app) => app.id === id)) return;
        state.app = id;
        state.sheet = null;
        renderApp();
        renderSheet();
}

function buildChrome() {
        const sheet = document.getElementById('sheet-apps');
        APPS.forEach((app) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'app-pick';
                btn.dataset.action = 'app';
                btn.dataset.app = app.id;
                btn.innerHTML =
                        '<span class="app-icon icon-' + app.id + '">' +
                        '<svg viewBox="0 0 64 64" aria-hidden="true">' + app.icon + '</svg>' +
                        '</span><span class="app-name">' + app.name + '</span>';
                sheet.appendChild(btn);
        });

        document.getElementById('control-tiles').innerHTML = TOGGLES.map((t) => {
                return (
                        '<button type="button" class="tile" data-action="toggle" data-toggle="' +
                        t.id +
                        '">' +
                        t.label +
                        '</button>'
                );
        }).join('');
}

function onClick(event) {
        const target = event.target.closest('[data-action]');
        if (!target || !el.screen.contains(target)) return;

        const action = target.dataset.action;

        if (action === 'drive') {
                if (DRIVES.includes(target.dataset.drive)) {
                        state.drive = target.dataset.drive;
                        renderDrive();
                }
                return;
        }

        if (action === 'temp') {
                const seat = target.dataset.seat;
                if (!SEATS.includes(seat)) return;
                state[seat] = clamp(state[seat] + Number(target.dataset.step), 60, 90);
                renderTemps();
                return;
        }

        if (action === 'heat') {
                const seat = target.dataset.seat;
                if (!SEATS.includes(seat)) return;
                state.heat[seat] = !state.heat[seat];
                renderHeat();
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
                if (MODES.includes(target.dataset.mode)) {
                        state.mode = target.dataset.mode;
                        renderMode();
                }
                return;
        }

        if (action === 'toggle') {
                const key = target.dataset.toggle;
                if (!(key in state.toggles)) return;
                state.toggles[key] = !state.toggles[key];
                renderToggles();
        }
}

function onInput(event) {
        if (event.target.id === 'speed-limit') {
                state.speedLimit = Number(event.target.value);
                el.speedLimitVal.textContent = String(state.speedLimit);
        }
}

function onKeydown(event) {
        if (event.key === 'Escape' && state.sheet) {
                state.sheet = null;
                renderSheet();
        }
}

function targetSpeed() {
        if (state.drive === 'd') return 64;
        if (state.drive === 'n') return 22;
        return 0;
}

function frame(now) {
        if (!lastFrame) lastFrame = now;
        const dt = Math.min(0.05, (now - lastFrame) / 1000);
        lastFrame = now;

        const goal = targetSpeed();
        state.speed += (goal - state.speed) * (1 - Math.exp(-dt * 1.7));

        let display = state.speed;
        if (state.drive === 'd' && Math.abs(state.speed - 64) < 1.6 && !reduceMotion.matches) {
                display += Math.sin((now / 1000) * 2.3) * 1.15;
        }

        el.screen.dataset.moving = state.speed > 1 ? 'true' : 'false';
        paintSpeed(display);
        tickClock(new Date());

        if (state.app === 'map' && !reduceMotion.matches) {
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

el.screen.addEventListener('click', onClick);
el.screen.addEventListener('input', onInput);
window.addEventListener('keydown', onKeydown);
window.addEventListener('resize', fitScreen);

buildChrome();
fitScreen();
renderDrive();
renderTemps();
renderHeat();
renderApp();
renderSheet();
renderMode();
renderToggles();
paintSpeed(state.speed);
tickClock(new Date());
requestAnimationFrame(frame);
