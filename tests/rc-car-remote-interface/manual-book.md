# LARP McQueen RC Car Remote - User Manual

A short guide to the Steam Deck RC car remote interface.

This variant is authored for the Steam Deck native display resolution: 1280 by 800.

## Getting Started

From the `rc-car-remote-interface` folder:

    make
    make run

Other useful targets:

    make configure   # generate the CMake build
    make build       # compile kart_cef.app
    make clean       # delete the build/ folder
    make help        # list all targets

To preview the web UI without the native shell, open `web/index.html` in a browser.

## Screen Layout

The top status bar shows the clock, gear selector, battery/range meter, and current drive mode.

The main stage shows one of three apps:

- Main Screen - full-width speed gauge and trip stats
- Map - route overview
- Energy - trip and session tiles

The bottom dock is intentionally compact for remote use. It only contains the Apps and Controls buttons. Climate controls and the volume rocker are not part of this variant.

## Main Controls

Use the gear selector in the status bar to switch between P, R, N, and D. Drive mode changes are handled from the Controls sheet.

Tap the Apps button in the dock to switch between Main Screen, Map, and Energy. Tap the Controls button to open mode and remote toggle controls.

The Controls sheet includes:

- Drive modes: Chill, Sport, Race
- Toggles: Lights, Camera

Press Escape or tap the active dock button again to close an open sheet.

## Developer Notes

The web UI lives in `web/`:

    web/index.html   - structure of the remote interface
    web/kart.css     - Steam Deck 1280x800 layout
    web/kart.js      - interaction and live updates

The native preview app is built with CEF via CMake. Web assets are copied from `web/` into the app bundle; nothing is synced from a parent directory.
