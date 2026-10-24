/**
 * dock.js
 *
 * Javascript for the dock for the larpui toolkit.
 */

'use strict';

const state = {
        sheet: null
};

const el = {
        screen: document.getElementById('screen'),
        btnApps: document.getElementById('btn-apps'),
        btnControls: document.getElementById('btn-controls')
};

function renderSheet() {
        const appsOpen = state.sheet === 'apps';
        const controlsOpen = state.sheet === 'controls';

        el.btnApps.setAttribute('aria-pressed', appsOpen ? 'true' : 'false');
        el.btnControls.setAttribute('aria-pressed', controlsOpen ? 'true' : 'false');
}

function onClick(event) {
        const target = event.target.closest('[data-action]');
        if (!target || !el.screen.contains(target)) return;

        if (target.dataset.action === 'sheet') {
                const name = target.dataset.sheet;
                state.sheet = state.sheet === name ? null : name;
                renderSheet();
        }
}

el.screen.addEventListener('click', onClick);
renderSheet();
