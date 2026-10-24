/**
 * apps.js
 *
 * Javascript for the apps sheet for the larpui toolkit.
 */

'use strict';

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

const state = {
        app: 'main'
};

const el = {
        screen: document.getElementById('screen'),
        sheetApps: document.getElementById('sheet-apps')
};

function renderApp() {
        document.querySelectorAll('.app-pick').forEach((btn) => {
                btn.classList.toggle('is-current', btn.dataset.app === state.app);
        });
}

function buildChrome() {
        APPS.forEach((app) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'app-pick';
                btn.dataset.action = 'app';
                btn.dataset.app = app.id;
                btn.innerHTML =
                        '<span class="app-icon icon-' +
                        app.id +
                        '">' +
                        '<svg viewBox="0 0 64 64" aria-hidden="true">' +
                        app.icon +
                        '</svg>' +
                        '</span><span class="app-name">' +
                        app.name +
                        '</span>';
                el.sheetApps.appendChild(btn);
        });
}

function onClick(event) {
        const target = event.target.closest('[data-action]');
        if (!target || !el.screen.contains(target)) return;

        if (target.dataset.action === 'app') {
                if (!APPS.some((app) => app.id === target.dataset.app)) return;
                state.app = target.dataset.app;
                renderApp();
        }
}

el.screen.addEventListener('click', onClick);
buildChrome();
renderApp();
