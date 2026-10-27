/**
 * energy.js
 *
 * Energy app for the built-in RC car interface.
 * Session summary tiles: Trip, Avg, Time, Laps.
 */

'use strict';

const EnergyApp = {
        id: 'energy',
        title: 'Energy',

        tiles: [
                { label: 'Trip', value: '18' },
                { label: 'Avg', value: '4.2' },
                { label: 'Time', value: '71' },
                { label: 'Laps', value: '9' }
        ],

        /**
         * Build the energy tile markup.
         * @returns {string}
         */
        renderMarkup() {
                return this.tiles
                        .map(function (tile) {
                                return (
                                        '<div class="energy-tile"><span>' +
                                        tile.label +
                                        '</span><b>' +
                                        tile.value +
                                        '</b></div>'
                                );
                        })
                        .join('');
        }
};

if (typeof module !== 'undefined' && module.exports) {
        module.exports = EnergyApp;
}
