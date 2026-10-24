/**
 * status.js
 *
 * Javascript for the status bar for the larpui toolkit.
 */

'use strict';

const DRIVES = ['p', 'r', 'n', 'd'];

const state = {
        drive: 'd',
        mode: 'chill'
};

const el = {
        screen: document.getElementById('screen'),
        clockHm: document.getElementById('clock-hm'),
        clockS: document.getElementById('clock-s'),
        clock: document.getElementById('clock')
};

let lastClock = '';

function renderDrive() {
        document.querySelectorAll('.drive').forEach((btn) => {
                btn.setAttribute('aria-pressed', btn.dataset.drive === state.drive ? 'true' : 'false');
        });
        el.screen.dataset.drive = state.drive;
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

function onClick(event) {
        const target = event.target.closest('[data-action]');
        if (!target || !el.screen.contains(target)) return;

        const action = target.dataset.action;

        if (action === 'drive') {
                if (DRIVES.includes(target.dataset.drive)) {
                        state.drive = target.dataset.drive;
                        renderDrive();
                }
        }
}

function frame() {
        tickClock(new Date());
        requestAnimationFrame(frame);
}

el.screen.addEventListener('click', onClick);
renderDrive();
renderMode();
tickClock(new Date());
requestAnimationFrame(frame);
