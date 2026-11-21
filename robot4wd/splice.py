"""Splice the 4WD Robot Car section into ../index.html.

The section is car4wd-core.js + projects.js + sensors.js + amsr3.js + car4wd-hud.js, followed by the end marker.
It sits right after the HG7881 + ESP32 section's end marker, before the "Frame loop" banner. Run it again after editing the .js files:
only the text between this section's own markers is replaced, so other sessions' edits elsewhere in index.html are kept.
It also applies small patches to the lab's core: the C++ interpreter's Serial.available / Serial.read get an input queue (run.rx),
and a stacked shield sits on its board's lift (the board can be mounted on the robot's deck).

    python3 -I robot4wd/splice.py
"""
import os
import sys

here = os.path.dirname(os.path.abspath(__file__))
page = os.path.join(here, '..', 'index.html')
START = '/* ---- 4WD Robot Car (18650 Edition) section ----'
END = '/* ---- end of the 4WD Robot Car section ---- */'
AFTER = '/* ---- end of the HG7881 + ESP32 motor driver section ---- */'
FILES = ['car4wd-core.js', 'projects.js', 'sensors.js', 'amsr3.js', 'car4wd-hud.js']
PATCHES = [
    ("      case 'Serial.available': return 0;", "      case 'Serial.available': return run.rx ? run.rx.length : 0;   // input queue (the 4WD robot's drive buttons fill run.rx)"),
    ("      case 'Serial.read': return -1;", "      case 'Serial.read': return run.rx && run.rx.length ? run.rx.shift() : -1;"),
    ("c.stack != null ? SHIELD_Y : c.ins ? BB_H", "c.stack != null ? SHIELD_Y + ((comps.get(c.stack) || {}).lift || 0) : c.ins ? BB_H"),
]

parts = []
for f in FILES:
    path = os.path.join(here, f)
    if os.path.exists(path):
        text = open(path, encoding='utf-8').read().rstrip()
        text = text.replace(END, '').rstrip()
        parts.append(text)
body = '\n'.join(parts) + '\n' + END + '\n'
if not body.startswith(START):
    sys.exit('car4wd-core.js must start with the section marker')
html = open(page, encoding='utf-8').read()
before = os.stat(page).st_mtime
if START in html:
    a = html.index(START)
    b = html.index(END, a) + len(END) + 1
    html = html[:a] + body + html[b:]
else:
    if html.count(AFTER) != 1:
        sys.exit('cannot find the HG7881 + ESP32 end marker exactly once')
    k = html.index(AFTER) + len(AFTER) + 1
    html = html[:k] + body + html[k:]
for old, new in PATCHES:
    if new in html:
        continue
    if html.count(old) != 1:
        sys.exit('patch target not found exactly once: ' + old.strip())
    html = html.replace(old, new)
if os.stat(page).st_mtime != before:
    sys.exit('index.html changed while splicing: run again')
open(page, 'w', encoding='utf-8').write(html)
print('spliced', len(body), 'characters from', ', '.join(f for f in FILES if os.path.exists(os.path.join(here, f))))
