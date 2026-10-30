# LARP McQueen RC Car Remote - User Manual

A short guide to the Steam Deck RC car remote interface: status bar,
drive modes, apps, and remote vehicle controls.

Authored for the Steam Deck native display: 1280 by 800.
The layout scales to fit your window while keeping the same proportions.


## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Screen Layout](#2-screen-layout)
3. [Drive Selector](#3-drive-selector)
4. [Main Screen](#4-main-screen)
5. [Map](#5-map)
6. [Energy](#6-energy)
7. [Apps Sheet](#7-apps-sheet)
8. [Controls Sheet](#8-controls-sheet)
9. [Dock](#9-dock)
10. [Keyboard Shortcuts](#10-keyboard-shortcuts)
11. [Quick Reference](#11-quick-reference)


## 1. Getting Started

### Build and run (desktop app)

From the `rc-car-remote-interface` folder:

    make

    make run

Other useful targets:

    make configure   # generate the CMake build
    make build       # compile ui_cef.app
    make clean       # delete the build/ folder
    make help        # list all targets

### Open the web UI alone

Open this file in a browser:

    web/index.html

No build step is required for the web UI alone.


## 2. Screen Layout

The screen has three horizontal bands.

### Top - Status bar

- Clock (hours, minutes, and seconds)
- Drive selector: P, R, N, D
- Battery / range meter (312 mi)
- Current drive mode label (Chill, Sport, or Race)

### Middle - Stage

Shows one of three apps at a time:

- Main Screen - speed gauge and trip stats
- Map - route overview
- Energy - trip and session tiles

Bottom sheets (Apps or Controls) can slide up over this area.

### Bottom - Dock

Compact remote dock with:

- Apps button (grid icon)
- Controls button (sliders icon)

Climate controls, seat heat, volume, and the home-screen lane/ui
widget are not part of this Steam Deck remote variant.


## 3. Drive Selector

Tap a letter in the center of the status bar.

| Button | Meaning              | Speed behavior          |
|--------|----------------------|-------------------------|
| P      | Park                 | Speed settles to 0      |
| R      | Reverse              | Speed settles to 0      |
| N      | Neutral              | Speed settles near 22   |
| D      | Drive                | Speed settles near 64   |

Notes:

- The active letter is highlighted.
- On Drive (D), the speed gauge arc is red.
- On other gears, the gauge arc is light.


## 4. Main Screen

Default view when the interface opens.

### Speed gauge

- Arc gauge and large speed number (mph)
- Speed follows the selected gear (see section 3)

### Trip stats

- Trip distance
- Average speed
- Time
- Range meter matching the status bar


## 5. Map

Open Map from the Apps sheet (see section 7).

You will see:

- A curved route across labeled places:
  Depot, Ridge, Cove, Peak, Bay
- A moving marker that travels along the route

The marker loops continuously while Map is open
(unless reduced motion is enabled in the OS).


## 6. Energy

Open Energy from the Apps sheet.

Four readouts:

- Trip
- Avg
- Time
- Laps

Use this view for a quick energy / session summary.


## 7. Apps Sheet

1. Tap the Apps button (grid of four squares) in the dock.
2. The Apps sheet slides up from the bottom.
3. Choose an app:

   - Main Screen
   - Map
   - Energy

4. The sheet closes and that view fills the stage.

To close the sheet without changing apps:

- Tap the Apps button again, or
- Press Escape


## 8. Controls Sheet

1. Tap the Controls button (three lines with knobs) in the dock.
2. The Controls sheet slides up.

### Drive mode

Choose one:

- Chill
- Sport
- Race

The selected mode appears in the top-right status bar.

### Remote toggles

Tap any tile to turn it on or off.
Pressed tiles are active.

| Toggle | Default |
|--------|---------|
| Lights | On      |
| Camera | On      |

There is no speed slider, lock, wipers, sentry, autopark, or summon
control in this remote variant.

To close the Controls sheet:

- Tap the Controls button again, or
- Press Escape


## 9. Dock

The dock is intentionally compact for Steam Deck remote use.

Buttons:

- Apps - open the Apps sheet
- Controls - open the Controls sheet

Not included in this variant:

- Driver / passenger climate
- Seat heat
- Volume rocker


## 10. Keyboard Shortcuts

| Key     | Action                              |
|---------|-------------------------------------|
| Escape  | Close the open Apps or Controls sheet |

There are no other keyboard shortcuts in this interface.
Most interaction is with the pointer (mouse, touch, or Steam Deck controls).


## 11. Quick Reference

### Open apps

    Dock -> Apps (grid) -> Main Screen | Map | Energy

### Open vehicle controls

    Dock -> Controls (sliders) -> Mode | Lights | Camera

### Change gear

    Status bar -> P | R | N | D

### Close a sheet

    Escape
    or tap the same dock button again


## Tips

- Only one sheet (Apps or Controls) is open at a time.
  Opening one closes the other.
- Switching apps always closes the Apps sheet.
- If you prefer less motion, enable "Reduce motion" in your
  operating system. Sheet animations and map motion will ease off.
- The screen is authored at 1280 by 800 and scales to fit
  any window size.


## File Map (for developers)

    web/index.html   - structure of the remote interface
    web/ui.css     - Steam Deck 1280x800 look and layout
    web/ui.js      - interaction and live updates

The desktop preview app is built with CEF (Chromium Embedded Framework)
via CMake. Web assets are copied from `web/` into the app bundle;
nothing is synced from a parent directory.


- End of manual -
