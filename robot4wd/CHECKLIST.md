# 4WD Robot Car Simulator: Implementation Checklist

This is the working checklist for the "4-Wheel Drive Robot Car Chassis – 18650 Edition" simulator in `index.html`. It is kept up to date between sessions.

Status marks:
- `[x]` done and tested in the lab's simulation. Nothing here has been tested on real hardware.
- `[~]` partly done.
- `[ ]` not started.

## User corrections (2026-11-21)

1. ONE robot on ONE table, with all 12 controller × project combinations.
2. Later, and stronger: the robot must be the existing setup, in the lab's existing viewport. The user ruled out:
   - another window, simulation or arena;
   - a separate joystick app;
   - a second WebGL renderer or animation loop;
   - a modal over the simulation;
   - duplicated components.

## Why the robot opened separately, and the fix

**Cause.** Lab parts and wires only stand at fixed places, in quarter turns, and wires are built from the pins' world positions. So the first version put a digital twin of the car in `car4wd-arena.js`:
- a second THREE.WebGLRenderer;
- its own requestAnimationFrame loop;
- a full-screen overlay with a modal gallery;
- copies of the bench controller and driver.

**Fix.** `car4wd-arena.js` is deleted. The robot is now the real lab parts:
- The controller, driver and sensors are mounted on the car part with `props.onCar = {x, z, y, rot, flip}`.
- When the robot drives, one transform T = pose·home⁻¹ carries the car, every mounted, stacked and docked part, and the wires between them, in the lab's own scene (`car4Carry`).
- Everything updates from the car's tick in the lab's frame loop.
- The table objects (line track, lamps, obstacles, fence) are meshes in the lab's scene.
- The robot panel is a collapsible box inside `#stage`.

Tests count WebGL contexts and requestAnimationFrame callbacks from page load:
- 2 contexts before and after: the lab's renderer and its own thumbnail renderer;
- no new animation loop.

## Status

1. [x] **In-viewport integration.** The robot drives on the lab's 1200 × 720 mm workplane.
   - **Reset robot** returns it to where the car part stands.
   - Dragging the car moves its home, and the mounted parts follow.
   - A part dragged off the car comes off the robot.
   - Deleting the car leaves its parts on the bench.
   - The lab functions it wraps all fall through for anything that is not on the robot:
     - `rebuildWire` (built at home);
     - `collides` (the robot's own parts don't block it);
     - `buildFlows` (the current-flow and signal dots ride with the robot);
     - `removeComp`, `clearAll` and `spawnProps`.
2. [x] **Car model**
   - Transparent two-plate acrylic chassis, 4 TT motors on brackets, 4 wheels, the 2 × 18650 holder, a terminal block, a switch, a sensor power strip and brass spacers.
   - **New, following the kit photos:** the real Uno + shield / RBS bit Driver Expansion Board / ESP32 + HG7881 sit on the top plate on brass standoffs, and the line sensors hang under the front on posts.
   - Four motors, each tied to its own wheel.
   - Exploded view and part highlighting.
3. [x] **Camera views** (in the lab's viewport, relative to the robot):
   - isometric, front, back, left, right, top, perspective, whole table, follow;
   - bottom: it opens the 84° orbit limit and cuts away the desk below the workplane while it lasts.
4. [x] **Joystick**
   - Base and knob, mouse and touch (pointer events), 8 directions, differential mixing.
   - Settings: dead zone, maximum and minimum speed, acceleration, deceleration, turning sensitivity.
   - Stops on release. Arrow buttons, Stop and a speed slider.
   - Each motor on its own: only with 4-channel drivers (disabled for the paired Rev3).
5. [x] **Keyboard:** W A S D drive and Space is an emergency stop. Keys are ignored while typing (inputs, the code editor, Blockly).
6. [x] **Control modes**
   - Manual joystick, manual keyboard, program, light / obstacle / line following (each loads its project), virtual Bluetooth remote, voice.
   - Manual control stops a running program. Starting a program hands the motors back to it.
   - The mode chip shows who drives.
7. [x] **One motor path.** Manual commands go through the driver model to the motors: battery voltage, the driver's minimum voltage and drop, paired channels on the Rev3. The same physics serves the joystick, the keys and the programs.
8. [x] **Safety override (manual).** The ultrasonic looks ahead by the stopping distance and cuts forward drive at once, with a warning. Reversing and turning still work. Without an ultrasonic, the panel says it cannot work.
9. [x] **Bluetooth (virtual only).** Each joystick direction becomes F / B / L / R / S, sent to the running program's Serial input (the Basic project on Arduino and ESP32), with a log. The RBS bit's blocks cannot read a stream, and the panel says so.
10. [x] **Voice:** the browser's SpeechRecognition (forward, back, left, right, stop) where it exists. Otherwise it says why it can't: unsupported, or the microphone is blocked.
11. [x] **Overlays** (View tab):
    - wheels, motor direction, wiring, sensor beams, sensor values, path, collision outline;
    - obstacles, light source, line track.
12. [x] **Table tools:** line track presets or drawing, lamps, and obstacles (add, drag, resize, rotate, duplicate, delete). Reset table. It stays the same table for every project.
13. [x] **Hardware and compatibility tables** (Project tab):
    - controller × driver (✓ set up / ✗ does not fit / – could be wired by hand);
    - the drivers' channels, current, supply, battery wiring and drop;
    - the sensor pins per controller.
14. [x] **12 projects** (16 with both Arduino drivers). Each has its own wiring, program and properties; see the results below.
15. [x] **Properties.** The car's readings in the lab's properties panel cover pose, speed, mode, motors, battery, controller, driver, sensors and project.
16. [ ] **Servo scanning:** none of the 12 setups has a servo, so the ultrasonic looks straight ahead. The kit's SG90 pan bracket is not modelled yet.
17. [~] **Compiling the generated code:** see "Compilation" below.
18. [ ] **Real hardware:** nothing was tried on a real robot.

## Test results (2026-11-21, headless Chrome, simulation only)

**Harness:** `scratchpad/hud/` (`mk.py`, `run.sh`, `common.pre.js`, `m.js`, `x.js`, `h2.js`, `o.js`, `r3.js`, `v2.js`).
- The page is the spliced index.html with a test hook.
- The solver, part ticks and physics are stepped every 50 ms.
- The programs run in the lab's own interpreters: C++, or the blocks.

**Program runs (16 setups).** Every wire connected in all 16.

| Setup | Basic (7 s) | Light (16 s): distance to the lamp | Obstacle (30 s) | Line (18 s): mean / max error, distance |
|---|---|---|---|---|
| Arduino + Motor Shield Rev3 | 2.6 m, 111 rpm | 851 → 413 mm, stops | 5.6 m, 0 bumps | 6.7 / 16.6 mm, 4.7 m |
| Arduino + L293D | 2.6 m, 117 rpm | 851 → 403 mm | 4.6 m, 5 bumps (3 box, 2 wall) | 6.7 / 17.0 mm, 4.9 m |
| RBS bit + Driver Expansion Board | 1.4 m, 69 rpm | 851 → 431 mm | 2.5 m, 0 bumps | 8.0 / 23.7 mm, 2.0 m |
| ESP32 + HG7881 | 1.7 m, 48 rpm | 851 → 439 mm | 3.0 m, 0 bumps | 7.9 / 13.7 mm, 2.1 m |

- **Basic:** after the demo, the test sends F (or presses A on the RBS bit) and the robot drives until the table's edge stops it. Those contacts are expected.
- **Obstacle avoidance:** the defaults changed during this work.
  - STOP_CM is now 20 cm, because the table is 72 cm wide.
  - The 3.7 V robots (RBS bit, ESP32) back off and turn for longer.
  - A program bug was fixed: "Alternate" switched direction on every retry inside one manoeuvre, so the robot rocked in place. It now keeps one direction per manoeuvre.

**Manual control and integration (`m.js`, 32 checks, all pass; re-run on the final build)**
- **Viewport:** the panel is inside the stage; no new WebGL context; the table objects are in the lab scene; the parts are mounted inside the car outline.
- **Joystick:**
  - forward: 795 mm in 2 s, up to the table's edge;
  - the board, shield and wires ride on the car;
  - release stops it;
  - 8 directions;
  - a 9 % push inside the dead zone does nothing;
  - speed limit: 224 vs 748 mm/s;
  - acceleration ramp: 25 % after 0.5 s.
- **Keyboard:** W drives, release stops, A turns, Space stops, keys are ignored while typing.
- **Safety override:** stops at 11.9 cm for a 12 cm setting; reversing is still allowed; switched off, the box stops the robot physically.
- **Reset and table:** Reset robot; overlay toggles; show and hide obstacles; Reset table; 8 camera views.
- **Modes:** manual stops the program; Start hands the motors back.
- **Virtual Bluetooth:** F and S reach the Arduino program's Serial input and it drives.
- **Individual motors:** HG7881 FL alone at 48 rpm; on the paired Rev3 it is refused.
- **Voice:** "listening" in Chrome.
- **Loops:** no new requestAnimationFrame callbacks.

**Hardware, switching, editor (`x.js`, 11 checks, all pass; re-run on the final build)**
- **Battery:** 2S sags 8.40 → 8.34 V at 0.5 A and charge goes down. The Rev3 refuses a 2P pack (0 V on the motors, with a check message).
- **Switching:** the driver from the panel (Rev3 → L293D); the controller and project, keeping one robot, one controller and the student's added box.
- **Editor:** it holds the project's C++ (with the right constants) or the RBS bit's blocks.
- **Mounting:** standoffs and posts are there.
- **Compatibility tables:** ✓ 4, ✗ 6, – 2.
- **Removal and views:** deleting the robot leaves its parts on the bench, upright; the bottom view opens and then restores.
- **Flow dots:** the current-flow dots follow the robot (the farthest is 106 mm from it, 399 mm from the start).

**Save and reload (`r3.js`)**
- 21 of 21 wires came back.
- Kp 0.2 was kept in the properties and in the code.
- Mounts are identical, and the shield is stacked at the board's deck height (y 100 over 84).
- The robot is at home, and the panel is shown.

## Compilation

- **Arduino Uno, 8 sketches** (Rev3 × 4 and L293D × 4): all compile with no errors or warnings.
  - Tool: the Arduino IDE's arduino-cli, board `arduino:avr:uno`, AVR core 1.8.7, Adafruit "AFMotor" library v1 for the L293D shield.
  - Flash use: 2.8–4.9 KB of 32 KB.
  - RAM use: 200–314 bytes of 2 KB.
- **RBS bit, 4 MakeCode TypeScript programs: NOT compile-verified.**
  - MakeCode for micro:bit (headless, editor-controller mode) produced a hex for all four. The project carried the DFRobot pxt-motor source and a `sonar.ping` stand-in with the pxt-sonar API.
  - But a deliberately broken control program also produced a hex in that mode. It called a function that doesn't exist and put a string into a number.
  - Neither Monaco's markers nor MakeCode's own Problems list showed its errors ("Problems 0").
  - So these runs prove nothing about the TypeScript. The RBS bit programs are tested only in the lab's simulation, as blocks.
  - To verify them: open each program in MakeCode with the pxt-motor and sonar extensions and look at the Problems list, or download the hex.
- **ESP32, 4 sketches:** not compiled. This Mac has no ESP32 Arduino core installed. They run in the lab's interpreter only.

**Published:** artifact v28 (2026-11-21). dist/site rebuilt for localhost:8800.

## Added 2026-11-21: Joystick Controlled Robot (all 3 controllers) and the new robot panel

- [x] **Joystick Controlled Robot**, the fifth project. It uses the lab's existing dual-axis joystick module (no new part).
  - The module stays on the bench (front-left corner), wired to the robot like a tethered remote. Its wires are redrawn as the robot drives (up to about 8 times a second).
  - Arduino: VRx A2, VRy A3, SW D2. RBS bit: P1, P2, P0 (a G V S cable for P1). ESP32: GPIO 34, 35, 27.
  - Each program:
    - calibrates the centre at start and applies a dead zone;
    - mixes left = forward + turn, right = forward − turn (arcade drive);
    - reads SW with a pull-up and toggles slow mode on a press.
  - Properties: maximum speed, turning strength, dead zone, slow-mode speed, axis inversion, reading interval.
  - In this project's Program mode, the panel's joystick, arrows and W A S D move the module's lever, and the program does the driving. **Press stick (SW)** presses the module.
- [x] **Robot panel redesign:**
  - header with the project icon, controller and driver;
  - status bar (speed, battery, program);
  - mode buttons, with Light / Obstacle / Line quick loads;
  - a larger joystick with a direction pointer, and a top-view wheel dashboard;
  - controller and driver buttons and project cards;
  - "How it works · what you learn" (objectives, what you should see, mistakes, challenges);
  - fold-away checks, wiring and hardware tables; chip toggles; a camera grid.
- [x] **4WD Robot menu:** a grid of 5 projects × 3 controllers, with the current setup ticked. It closes with Escape or a click outside.

**Tests (headless Chrome, simulation)**
- **All four joystick setups:** every wire connected (17/17 Arduino, 13/13 RBS bit, 26/26 ESP32), and the module stays on the bench.
- **Pushing forward** drove the robot forward (Arduino 492 mm in 1 s, RBS bit 308 mm, ESP32 340 mm), and the program's serial showed `forward 253 … left 218 right 218`.
- **Letting go** stopped it (0 mm/s), and the module sprang back to 50/50.
- **Turns** went both ways:
  - Rev3: heading +82° in 0.4 s left, −65° right;
  - L293D: +59° / −56°;
  - RBS bit: +15° / −14°;
  - ESP32: +24° / −24°.
- **SW press** switched to slow mode on every board ("Slow mode" / `slow:1`).
- **The cable wires** ended at the moving robot after it drove 34 cm away (8–80 mm from its centre) and stayed at the joystick (19 mm).
- **Compiled:** both new Arduino sketches compile for the Uno (3.9 KB and 4.3 KB). All 10 Arduino sketches compile.
- **Not compiled:** the ESP32 sketch (no ESP32 core here). The RBS bit TypeScript is not compile-verified (see Compilation).

## Added 2026-11-21: a neat wiring harness on every robot project

- [x] **The problem:** robot wires were drawn as the lab's jumper arcs, lifted over the tallest part on their path. The car's own outline was always on the path, plus up to 26 mm of stacking per wire, so every wire arched high over the robot.
- [x] **The harness** (`car4Harness`), drawn in the car's frame so it rides with the car:
  - out of the pin over the nearest edge of the part;
  - down to a channel 1.3 mm above the top plate (under the boards on standoffs);
  - square runs, then up into the other pin;
  - wires between the same two parts run 1.3 mm apart as a ribbon, one channel level per bundle;
  - Dupont housings on header pins.
- [x] **JST plugs** on every motor and battery lead, seated in the driver's JST adapters with the lab's own `jstSeat`. The Rev3's paired motors share one plug (Y-lead). A **Connectors** check lists which plug each motor and the battery use, and warns when a lead isn't on a JST connector of its kind.
- [x] **The joystick cable** (bench to robot) lies flat on the table, climbs the robot's side, and is redrawn as the robot moves (`car4TetherDraw`).
- [x] **Behind the drawing:**
  - the lab's wires stay for the circuit, the wiring table and picking; their arcs are hidden and their current-flow dots follow the harness;
  - a part taken off the robot gets its normal jumper back;
  - the View tab's Wiring toggle shows or hides the harness and the cable.

## Results after the harness, the solid laptop and the re-laid table (2026-11-21, headless Chrome, simulation)

- **Laptop and layout:**
  - The lab's laptop (back-left of the table) is now solid for the robot, and the ultrasonic sees it.
  - The line tracks keep 200 mm curves: tighter ones swing the line out past the sensor bar.
  - The tracks, the obstacle course and every start sit clear of the laptop. A saved table with a line or obstacle under the laptop is re-laid.
  - A turn blocked by a corner slides off it, as a skid-steer car scrapes.
- **Compatibility sweep, 20 setups** (5 projects; Arduino with the Rev3 and the L293D, RBS bit, ESP32):
  - every wire connected;
  - the harness on every robot, its highest wire 17–43 mm above the deck (the old arcs were about 120 mm), and no lab arcs left visible;
  - the Connectors check reports JST OK on all 20.
  - The connectors in use:
    - Rev3: FL+RL and FR+RR on Motor A/B (Y-leads), battery on Vin;
    - L293D: M1–M4 and EXT_PWR;
    - RBS bit Driver Expansion Board: M1–M4 and VIN;
    - HG7881: A–D and Power.
- **Programs:**
  - Basic: all 4 drive.
  - Light: all 4 stop 419–440 mm from the lamp (from 851).
  - Line (mean / max error, distance):
    - Rev3: 7.2 / 16 mm, 4.8 m;
    - L293D: 7.0 / 19 mm, 5.0 m;
    - RBS bit: 8.2 / 18 mm, 2.0 m;
    - ESP32: 8.4 / 12 mm, 2.3 m.
  - Obstacle avoidance (30 s, run after Basic and Light on the same table):
    - Rev3: 4.8 m, 4 contacts;
    - L293D: 5.8 m, 5;
    - RBS bit: 2.4 m, 2;
    - ESP32: 3.0 m, 7.
    - No robot gets stuck. The contacts are box, wall or laptop corners outside the 15° beam, or scrapes while turning.
  - Joystick: all 4 turn both ways, drive, stop on release, and switch to slow mode on SW. The cable ends sit at the robot and the joystick.
- **Suites:** manual 32/32, hardware 11/11, save/reload 21/21 wires.
- **Compiled:** all 10 Arduino Uno sketches (arduino-cli).

## Values that are not verified (marked "illustrative" in the UI and editable)

- **Dimensions** come from the generated reference sheet: measure the kit.
- **TT motor:** 6 V rated, 200 rpm with no load, 0.12 A with no load, 0.8 A stalled, about 1:48.
- **18650 cells:** 2000 mAh, 0.06 Ω, 5 A.
- **Physics:** mass 0.45 kg, μ 0.8, lateral μ 0.6, slip stiffness.
- **Driver drops:** L298 1.8 V, L293D 1.4 V, L9110S 0.4 V, RBS bit Driver Expansion Board 0.3 V.
- **LDR curve:** GL5528-like. **TCRT5000 output levels.**
- **The light-following project** dims the room (ambient 3) and sets the LDR sensitivity to 40 %.

## Known limits

- **A wire from the robot to a part on the bench** (not on the robot) does not follow the robot.
- **Headless test pages draw few frames,** so camera flights were checked through their targets, not finished on screen.
- **Voice** was only checked to start listening. Real recognition needs a microphone and a browser page outside claude.ai.
- **Bluetooth** is a virtual link to the simulated program, not a radio.

## Files

`robot4wd/car4wd-core.js`, `projects.js`, `sensors.js`, `amsr3.js` and `car4wd-hud.js`. `python3 -I robot4wd/splice.py` writes them into index.html and applies two patches to the lab core:
- Serial input (`run.rx`);
- a stacked shield rides on its board's lift.
