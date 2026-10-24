/**
 * home.js
 *
 * Javascript for the home screen for the larpui toolkit.
 */

'use strict';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const state = {
        drive: 'd',
        speed: 64
};

const el = {
        screen: document.getElementById('screen'),
        speed: document.getElementById('speed'),
        gaugeTrack: document.getElementById('gauge-track'),
        gaugeValue: document.getElementById('gauge-value')
};

let shownSpeed = -1;
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

function frame(now) {
        if (!lastFrame) lastFrame = now;
        const dt = Math.min(0.05, (now - lastFrame) / 1000);
        lastFrame = now;

        let display = state.speed;
        if (state.drive === 'd' && !reduceMotion.matches) {
                display += Math.sin((now / 1000) * 2.3) * 1.15;
        }

        el.screen.dataset.moving = state.speed > 1 ? 'true' : 'false';
        paintSpeed(display);
        requestAnimationFrame(frame);
}

paintSpeed(state.speed);
requestAnimationFrame(frame);
