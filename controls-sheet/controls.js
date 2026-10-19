/**
 * controls.js
 *
 * Javascript for the controls sheet for the larpui toolkit.
 */

'use strict';

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

const MODES = ['chill', 'sport', 'race'];

const state = {
        mode: 'chill',
        speedLimit: 64,
        toggles: Object.fromEntries(TOGGLES.map((t) => [t.id, t.on]))
};

const el = {
        screen: document.getElementById('screen'),
        speedLimitVal: document.getElementById('speed-limit-val')
};

function renderMode() {
        document.querySelectorAll('[data-action="mode"]').forEach((btn) => {
                btn.setAttribute('aria-pressed', btn.dataset.mode === state.mode ? 'true' : 'false');
        });
}

function renderToggles() {
        document.querySelectorAll('[data-toggle]').forEach((btn) => {
                btn.setAttribute('aria-pressed', state.toggles[btn.dataset.toggle] ? 'true' : 'false');
        });
}

function buildChrome() {
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

el.screen.addEventListener('click', onClick);
el.screen.addEventListener('input', onInput);
buildChrome();
renderMode();
renderToggles();
