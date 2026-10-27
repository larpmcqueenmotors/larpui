/**
 * map.js
 *
 * Map app for the RC car remote interface.
 * Moves the route marker along the path while Map is open.
 */

'use strict';

const MapApp = {
        id: 'map',
        title: 'Map',

        routeLen: 0,
        routeT: 0.16,

        /**
         * Cache the route path length when Map becomes active.
         * @param {SVGGeometryElement} route
         */
        onOpen(route) {
                this.routeLen = route.getTotalLength();
        },

        /**
         * Advance the marker along the route.
         * @param {SVGGeometryElement} route
         * @param {SVGCircleElement} dot
         * @param {number} dt - seconds since last frame
         * @param {boolean} reduceMotion
         */
        tick(route, dot, dt, reduceMotion) {
                if (reduceMotion) return;

                if (!this.routeLen) {
                        this.routeLen = route.getTotalLength();
                }
                if (!this.routeLen) return;

                this.routeT = (this.routeT + dt * 0.045) % 1;
                const point = route.getPointAtLength(this.routeLen * this.routeT);
                dot.setAttribute('cx', point.x);
                dot.setAttribute('cy', point.y);
        }
};

if (typeof module !== 'undefined' && module.exports) {
        module.exports = MapApp;
}
