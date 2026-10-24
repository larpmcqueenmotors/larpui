/**
 * map.js
 *
 * Javascript for the map view for the larpui toolkit.
 */

'use strict';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const el = {
        route: document.getElementById('route'),
        dot: document.getElementById('dot')
};

let routeLen = 0;
let routeT = 0.16;
let lastFrame = 0;

function frame(now) {
        if (!lastFrame) lastFrame = now;
        const dt = Math.min(0.05, (now - lastFrame) / 1000);
        lastFrame = now;

        if (!reduceMotion.matches) {
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

routeLen = el.route.getTotalLength();
requestAnimationFrame(frame);
