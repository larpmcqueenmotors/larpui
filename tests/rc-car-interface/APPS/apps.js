/**
 * apps.js
 *
 * App catalog for the built-in RC car interface.
 * Mirrors APPS/info.list and points at each app folder.
 */

'use strict';

const APPS = [
        {
                id: 'main',
                title: 'Main Screen',
                description:
                        'Default drive view with a 3D supercar in its lane, a speed gauge, and trip stats.',
                path: 'main/'
        },
        {
                id: 'map',
                title: 'Map',
                description:
                        'Route map across labeled places with a marker that travels along the path.',
                path: 'map/'
        },
        {
                id: 'energy',
                title: 'Energy',
                description:
                        'Quick session summary with trip, average speed, time, and laps readouts.',
                path: 'energy/'
        }
];

function getAppById(id) {
        return APPS.find((app) => app.id === id) || null;
}

function listApps() {
        return APPS.slice();
}

if (typeof module !== 'undefined' && module.exports) {
        module.exports = { APPS, getAppById, listApps };
}
