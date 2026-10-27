/**
 * main.js
 *
 * Main Screen app for the RC car remote interface.
 * Speed gauge and trip stats.
 */

'use strict';

const MainApp = {
        id: 'main',
        title: 'Main Screen',

        /**
         * Paint the speed number and arc gauge.
         * @param {object} el - { speed, gaugeTrack, gaugeValue }
         * @param {number} display - current speed to show
         * @param {string} drive - active gear (affects gauge color)
         * @param {number} shownSpeed - last painted integer speed
         * @returns {number} updated shownSpeed
         */
        paintSpeed(el, display, drive, shownSpeed) {
                const rounded = Math.max(0, Math.round(display));
                if (rounded !== shownSpeed) {
                        shownSpeed = rounded;
                        el.speed.textContent = String(rounded);
                }

                const start = -120;
                const sweep = 240;
                const frac = Math.max(0, Math.min(1, display / 80));

                el.gaugeTrack.setAttribute('d', this.arcPath(200, 186, 150, start, start + sweep));
                el.gaugeValue.setAttribute(
                        'd',
                        frac < 0.015 ? '' : this.arcPath(200, 186, 150, start, start + sweep * frac)
                );
                el.gaugeValue.style.stroke = drive === 'd' ? '#f50000' : '#f3f0e8';

                return shownSpeed;
        },

        arcPath(cx, cy, r, startDeg, endDeg) {
                const rad = (deg) => ((deg - 90) * Math.PI) / 180;
                const x0 = cx + r * Math.cos(rad(startDeg));
                const y0 = cy + r * Math.sin(rad(startDeg));
                const x1 = cx + r * Math.cos(rad(endDeg));
                const y1 = cy + r * Math.sin(rad(endDeg));
                const large = endDeg - startDeg > 180 ? 1 : 0;
                return 'M ' + x0 + ' ' + y0 + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x1 + ' ' + y1;
        }
};

if (typeof module !== 'undefined' && module.exports) {
        module.exports = MainApp;
}
