# RBS bit: 3D board model

A Three.js model of the RBS bit microcontroller board, built from real geometry: the PCB is a solid with its holes and edge notches cut through, and every physical part is its own mesh (or small group of meshes) with an id, a name and a description. A simulator can find any part, highlight it, light it, press it or wire to it.

| File | What it is |
|---|---|
| `rbs-bit.js` | The reusable ES module: `createRBSBit()`, `RBS_BIT_SPEC`, `RBS_BIT_VIEWS` |
| `viewer.html` | Standalone viewer: orthographic and perspective cameras, eight views, part info, LED toggles, buttons, wires |
| `embed.pl` | Copies `rbs-bit.js` into `../index.html` so the one-file lab carries the same model (`../build.sh` runs it) |

## Use it

The module imports `three` and `three/addons/…` (an import map or a bundler provides them; the lab and the viewer use three 0.165.0). It draws its print onto canvases once, so load your fonts first.

```js
import { createRBSBit } from './rbs-bit.js';

await document.fonts.ready;
const bit = createRBSBit({ highlightColor: 0xf26b3a });
scene.add(bit.group);                          // lies flat, front up; rotate the group to stand it up

bit.setLed(2, 2, true);                        // column, row (0–4); true/false or a brightness 0–1
bit.setDisplay(['09090', '99999', '99999', '09990', '00900']);
bit.pressButton('A', true);                    // 'A', 'B' or 'RESET'
bit.setStatusLed('power', true);               // 'power', 'usb' or 'mic'

const hit = raycaster.intersectObjects(bit.pickables)[0];
const { part, led, pin, button } = bit.resolve(hit?.object);   // ids of what was hit
bit.highlight(part);                           // tint and frame it; bit.hover(id) frames only
console.log(bit.info(part).name, bit.info(part).description);

renderer.setAnimationLoop(() => { bit.update(clock.getDelta()); renderer.render(scene, camera); });
```

| Member | |
|---|---|
| `group` | The board's `THREE.Group` |
| `pins` | The five rings: `{ id: 'P0' \| 'P1' \| 'P2' \| '3V' \| 'GND', name, kind, description, part, radius, position, backPosition }`. `position` is the centre of the ring's hole on the front face, where a wire lands |
| `contacts` | The 20 small edge contacts and guard strips, with their net and position |
| `leds` | The 25 display LEDs, row by row: `{ id, col, row, level, target }` |
| `buttons` | `A`, `B`, `RESET`: `{ part, pressed, actuator, travel }` |
| `parts` | `Map` of every part: `{ id, name, category, description, meshes }` |
| `pickables` | Meshes to raycast against (print decals and LED glows are left out) |
| `resolve(object)` | `{ part, led, pin, button }` for a picked mesh |
| `highlight(id)`, `hover(id)`, `info(id)` | Select a part, frame a hovered part, read a part |
| `setLed`, `toggleLed`, `getLed`, `setDisplay`, `clearDisplay` | The display |
| `pressButton(id, down)`, `isPressed(id)`, `setStatusLed(id, on)` | Buttons and the three status LEDs |
| `setDesignColor(color)` | Colour of the printed design (the sawtooth and the A/B flags): a name from `RBS_BIT_DESIGN_COLORS` (cyan, orange, green, pink, purple, yellow, red, white) or any three.js colour; also `createRBSBit({ designColor })` |
| `setBoardColor(color)` | Solder mask colour: a name from `RBS_BIT_COLORS` (black, blue, green, red, purple, teal) or any three.js colour; also `createRBSBit({ boardColor })` |
| `update(dt)` | Call every frame: LEDs fade in and out, button caps travel |
| `dispose()` | Remove the board and free what it made |

### Coordinates

Millimetres. The board lies flat with its front (the LEDs) facing +y, the edge connector at +z and the USB edge at −z. The PCB's back face is y = 0 and its front face y = 1.6; back parts hang down to y = −5.5 (the battery socket). To stand it upright facing +z, as the viewer does, set `group.rotation.x = Math.PI / 2`.

### Part ids

`pcb` · `led-1-1` … `led-5-5` (row, column) · `button-a`, `button-b` · `touch-logo` · `mic-led` · `pad-P0`, `pad-P1`, `pad-P2`, `pad-3V`, `pad-GND` · `edge-P3` … `edge-P20`, `guard-3V-left`, `guard-3V-right`, `guard-GND-left`, `guard-GND-right` · `usb` · `reset-button` · `battery-connector` · `processor` · `usb-interface` · `motion-sensor` · `speaker` · `microphone` · `antenna` · `crystal` · `regulator` · `led-power`, `led-usb` · small parts by designator (`c5`, `r4`, `t3`, …)

## Dimensions

| | Value | Source |
|---|---|---|
| Outline | 51.60 × 42.00 mm | Published V2 hardware documentation |
| Overall depth | 11.65 mm: buttons 4.55 mm above the front, battery socket 5.50 mm below the back | Published V2 hardware documentation |
| PCB | 1.6 mm, 2 layers, black matte mask, ENIG | 11.65 − 4.55 − 5.50; V2 bill of materials |
| Edge contacts | 25 on the front (5 rings for 4 mm plugs, 20 small strips on a 1.27 mm pitch), in the published order | Published edge connector pinout |
| Ring positions | −21.59, −11.43, 0, +11.43, +21.59 mm from the centre | Derived: 40 positions on the 1.27 mm pitch, each ring four positions wide |
| Packages | 0603 LEDs, 6 mm tactile switches, 7 × 7 mm processor, 5 × 5 mm USB chip, 2 × 2 mm motion sensor, 8.5 mm speaker, 3.76 × 2.95 mm microphone, 3.2 × 2.5 mm crystal | V2 bill of materials |
| LED pitch 4.0 mm, button and back-part positions, corner radii, notch size | Approximate | No placement file is published: taken from the reference drawing and photos |

## The viewer

```sh
./build.sh                      # from the repo root: also refreshes the lab's copy of the module
python3 -m http.server 8765
# open http://localhost:8765/dist/rbs-bit/viewer.html
```

Drag to turn, scroll to zoom, right-drag to pan. The top bar switches between orthographic and perspective cameras and picks the front, back, left, right, top, bottom, isometric or 3D view. Click a part to highlight it and read what it is; click an LED to switch it; hold A, B or Reset to press them; turn on **Connect wires** and click two rings (or one ring twice) to clip on crocodile leads.

## In the lab

`index.html` carries a copy of `rbs-bit.js` in `<script type="module" id="rbs-bit-lib">`, which sets `window.RBS_BIT`. The lab's `rbsbit` part builds the board from it, uses the five rings as its wiring pins and the 3V ring as a 3.3 V supply, and passes clicks through: a click shows the part under the pointer, and while the simulation runs a click on an LED switches it and A and B can be held down. After editing `rbs-bit.js`, run `./build.sh` to refresh that copy.

Clicking the RBS bit opens the code panel's **Blocks** tab: a Blockly 10.4.3 workspace (loaded from cdnjs the first time) with the lab's own block colours. **Start simulation** runs the blocks on the RBS bit:

| Category | Blocks |
|---|---|
| Events | on start · forever (20 ms between rounds) · when button A / B / A+B is pressed · when logo is pressed / released · when pin P0 / P1 / P2 is pressed / released (touch: hold the ring, or a banana clipped to it) · when shaken / tilted left / tilted right / logo up / logo down · every … ms |
| Display | show icon (22 pictures) · show leds (5 × 5 grid) · show arrow · show number · show text (scrolls) · clear screen · pause · plot (with brightness) · unplot · toggle · LED is on · LED brightness · bar graph · set brightness |
| Input | button A / B / A+B is pressed · logo is pressed · pin P0 / P1 / P2 is pressed · acceleration x / y / z / strength · rotation pitch / roll · compass heading · temperature · light level · sound level · running time |
| Sound | play tone (note picker) for a beat length · ring tone · rest · play melody (12 tunes: until done, in background, looping) · stop all sounds · tempo · play tone in Hz on a pin. Sound plays on the board's own speaker; a buzzer on that ring plays it too |
| Game | create sprite · move · turn · change / set x, y, direction, brightness · if on edge, bounce · touching another sprite / the edge · delete · score · life · start countdown · game over (the display flashes, then scrolls GAME OVER and the score) |
| Loops, Logic, Variables, Math, Text, Lists, Functions | repeat · while · for · for each · break / continue · if/else · compare · and/or/not · random number / true-false · modulo · round · square root etc. · smaller / larger · constrain · map · even / odd / prime · join · length · number from text · part of text · lists (make, length, get, set, find) · functions with inputs and return values |
| Pins | digital write / read · analog write (0–1023) / read · servo write · set pull up / down / none, on P0–P2 and on P8 and P12–P16 (reachable through the expansion board's headers); 3.3 V, a 10 MΩ pull-down when not driven, like the real board |
| Serial | write line · write number · write value (Output → Serial monitor) |

The runner (`blocksRuntime` in `index.html`) copies the blocks into plain data when you press Start, then runs every event script as its own fiber, so a `pause` in one script lets the others run. While it runs, the board's toolbar shows controls for the sensors the program uses (tilt sliders, Shake, temperature, light, compass, sound, Hold A+B); hold the gold logo to touch it.

**Power.** Start asks how the board is powered: **USB cable** grows a micro-USB cable from the laptop's second port into the board's socket (3.3 V, the yellow USB LED flashes while the blocks upload), **Battery holder** unplugs it and plugs a 2 × 18650 Li-ion holder into the battery socket: two cells in parallel (3.7 V) with an on/off slide switch, and a small 3.3 V regulator board on the lead, since the socket takes 3 to 3.3 V. Click the holder's switch (or the toolbar's Battery ON/OFF) to cut the power. While docked in the expansion board, the choice is **Expansion board** instead. The toolbar's Power buttons switch it without running. While the board is selected, the top bar shows its design colours (the board itself stays black).

**Adding blocks from another part.** Push a setup function into `BK_EXT_SETUP` (it gets `Blockly` right after the RBS bit's blocks are defined, before the workspace opens; push categories into `BK_TOOLBOX.contents`), and register how each block runs in `BK_EXT[type] = function* (n, I, api) { … }`. `yield* I('NAME')` evaluates an input, `yield { sleep: ms }` pauses that script, value blocks return their value, and `api` is `{ c, num, truthy, txt, pinOut(pin, fraction), pinIn(pin), vdd() }`.
