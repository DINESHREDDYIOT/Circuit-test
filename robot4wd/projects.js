
// ---- 10. Robot projects: ONE robot on ONE table. Four projects × three controllers, each with its own driver, wiring, program
// and properties. A project builds the circuit on the bench (controller, driver, the car's terminal block, sensors, wires) and
// loads the program. The program runs in the lab's interpreter (C++ for the Arduino and the ESP32, blocks for the RBS bit).
// The motor voltages it produces drive the car in the arena, and the mounted sensors read the arena's table. ----
const C4P_CTRL = {
  arduino: { name: 'Arduino Uno', full: 'RBS Learning Board (Arduino Uno compatible)', type: 'arduino', drivers: ['amsr3', 'l293d'], lang: 'C++ (Arduino)' },
  rbsbit: { name: 'RBS bit (micro:bit V2)', full: 'RBS bit, micro:bit V2 compatible, on the RBS bit Driver Expansion Board', type: 'rbsbit', drivers: ['rbsbitdrv'], lang: 'Blocks (MakeCode style) + TypeScript' },
  esp32: { name: 'ESP32 DevKit', full: 'RBS ESP32 DevKit (ESP32 DevKit V1)', type: 'esp32', drivers: ['hg7881'], lang: 'C++ (ESP32 Arduino core 3.x)' },
};
const C4P_DRV = {
  amsr3: { name: 'Arduino Motor Shield Rev3', short: 'Motor Shield Rev3', battery: '2S', channels: 2,
    note: 'Two channels only: both left motors run in parallel on channel A, both right motors on channel B. The L298P needs at least 4.8 V, so the car’s holder is wired 2S (7.4 V).' },
  l293d: { name: 'L293D Motor Shield (AFMotor, 4 channels)', short: 'L293D shield', battery: '2S', channels: 4,
    note: 'Four independent channels, one motor each (M1–M4, AFMotor library). The L293D needs at least 4.5 V on EXT_PWR, so the holder is wired 2S (7.4 V); its 1.4 V drop leaves about 6 V for the TT motors.' },
  rbsbitdrv: { name: 'RBS bit Driver Expansion Board', short: 'RBS bit Driver Expansion Board', battery: '2P', channels: 4,
    note: 'Four channels M1–M4 driven over I²C (PCA9685), using the pxt-motor blocks. The holder is wired 2P (3.7 V) into VIN.' },
  hg7881: { name: 'HG7881 H-Bridge 4CH DC – 2CH Stepper Motor Driver Board', short: 'HG7881 board', battery: '2P', channels: 4,
    note: 'Four L9110S channels A–D, two signal pins each (PWM on one pin forward, on the other backward). The holder is wired 2P (3.7 V) on BAT+/BAT−.' },
};
// pins each controller uses for the sensors, chosen to stay clear of its driver's pins
const C4P_PINS = {
  arduino: { trig: 10, echo: 2, ldrL: 'A2', ldrR: 'A3', irL: 'A2', irC: 'A3', irR: 'A4', joyX: 'A2', joyY: 'A3', joySW: 2, vcc: '5V', gnd: ['GND1', 'GND2', 'GND3'], adc: 1023,
    why: 'The Motor Shield Rev3 uses D3 D8 D9 D11 D12 D13 and A0 A1 (current sensing); the L293D shield uses D3–D8, D11 and D12. D2, D10 and A2–A5 are free with both.' },
  rbsbit: { trig: 'P1', echo: 'P2', ldrL: 'P0', ldrR: 'P1', irL: 'P0', irC: 'P1', irR: 'P2', joyX: 'P1', joyY: 'P2', joySW: 'P0', vcc: 'V', adc: 1023,
    why: 'P0, P1 and P2 are the RBS bit’s analog pins and have G V S headers on the expansion board; the motors use the board’s own I²C driver.' },
  esp32: { trig: 13, echo: 27, ldrL: 34, ldrR: 35, irL: 34, irC: 35, irR: 39, joyX: 34, joyY: 35, joySW: 27, vcc: '3V3', gnd: ['GND', 'GND_2'], adc: 4095,
    why: 'The sensors read on ADC1 pins (GPIO 34, 35, 39: input-only, which suits sensors, and they work with Wi-Fi on). The motors use GPIO 25 26 32 33 18 19 22 23. GPIO 12 is avoided (a boot strapping pin with the board’s pull-ups).' },
};
const C4P_PROJ = {
  basic: { icon: '🚗', name: 'Basic 4WD Movement', level: 'Beginner', mins: 20, sensors: [], show: { track: false, light: false, obstacles: false }, start: [-300, 40, 0],
    what: 'Drive the 4WD robot: forward, backward, left, right, clockwise, anticlockwise and stop.',
    how: 'The program sets each side’s motors with a speed from −255 (full backward) to 255 (full forward). Same speed on both sides goes straight; different speeds turn; opposite speeds spin on the spot (skid steering).',
    objectives: ['Control DC motors through a motor driver', 'Use PWM to set the speed', 'Turn with differential (skid) steering', 'See how a soft start (acceleration) protects the motors and the battery'],
    expected: 'Press Start: the robot runs the demo (forward, backward, left, right, anticlockwise, clockwise, with stops between). The drive buttons send a command to your program, which then holds that movement.',
    mistakes: ['A side runs backward: its motors are wired the other way round (swap the red and black leads, or flip “reverse” on that motor).', 'The robot drifts: trim the left or right motor speed.', 'Nothing moves: is the battery switch ON, and is the driver’s motor supply wired?'],
    challenges: ['Make the robot drive a square', 'Add a figure-of-eight to the demo', 'Make it slow down before it stops'] },
  light: { icon: '💡', name: 'Light Following Robot', level: 'Intermediate', mins: 35, sensors: ['ldrL', 'ldrR'], show: { track: false, light: true, obstacles: false }, start: [-420, 150, 0],
    what: 'The robot turns toward the brighter side and drives to a lamp, using two LDR light sensors at its front corners.',
    how: 'Each LDR module gives a voltage that falls as light rises, so the program reads brightness as “1023 − reading”. The brighter side wins: turn that way. About equal and bright enough: drive forward. Too dark: stop or search.',
    objectives: ['Read analog sensors', 'Compare two sensors to steer', 'Use thresholds (minimum difference, minimum light)', 'Design a search behaviour'],
    expected: 'The robot turns toward the lamp and drives to it, stopping when it is bright enough. Drag the lamp: the robot follows. Switch the lamp off: it searches (or stops).',
    mistakes: ['It turns away from the light: the left and right LDRs are swapped (check A2/A3, P0/P1 or GPIO 34/35).', 'It never moves: the light threshold is above what the sensors read; lower it, or raise the lamp’s intensity.', 'It wobbles: raise the minimum light difference.'],
    challenges: ['Stop at a set distance from the lamp', 'Follow the darker side instead (a “cockroach” robot)', 'Use a second lamp and see which one it chooses'] },
  obstacle: { icon: '📡', name: 'Ultrasonic Obstacle Avoiding Robot', level: 'Intermediate', mins: 40, sensors: ['us'], show: { track: false, light: false, obstacles: true }, start: [-300, 120, 0],
    what: 'The robot drives forward, measures the distance ahead with an HC-SR04 ultrasonic sensor, and stops, backs off and turns when something is too close.',
    how: 'The sensor sends a 10 µs pulse on TRIG; ECHO stays HIGH for as long as the sound takes to come back (58 µs per cm). Closer than the threshold: stop, reverse, turn, measure again.',
    objectives: ['Measure distance with ultrasound (TRIG/ECHO timing)', 'Write a stop–reverse–turn–check routine', 'Use a retry count and a turning preference', 'Handle a timed-out echo (nothing in range)'],
    expected: 'The robot drives around the table without hitting the boxes, walls or cylinders. Add or drag an obstacle in front of it: it stops and turns away.',
    mistakes: ['It reads 0 or 999 all the time: TRIG and ECHO are swapped, or the sensor has no power.', 'It hits low boxes: they are below the beam (about 6 cm high at the sensor).', 'It turns too little: make the turn time longer.'],
    challenges: ['Look both ways before choosing a direction', 'Slow down as things get closer', 'Count obstacles and show the count'] },
  line: { icon: '➰', name: 'IR Line Following Robot', level: 'Intermediate–Advanced', mins: 45, sensors: ['lnL', 'lnC', 'lnR'], show: { track: true, light: false, obstacles: false }, start: [110, 240, 0],
    what: 'The robot follows a black line on the white table with IR line-tracking sensors under its front.',
    how: 'Each TCRT5000 module shines infrared at the table: white reflects (a LOW reading), black tape absorbs (a HIGH reading). The basic mode steers from which sensors see black. The PID mode works out where the line is from the analog readings and corrects smoothly.',
    objectives: ['Read reflectance sensors', 'Turn sensor patterns into steering (a truth table)', 'Tune a PID controller (Kp, Ki, Kd)', 'Recover a lost line and cross junctions'],
    expected: 'The robot follows the oval, crosses the junctions straight on, and finds the line again if it runs off. Draw your own track with Draw line.',
    mistakes: ['It turns away from the line: the left and right sensors are swapped.', 'It shakes from side to side: lower Kp or raise Kd.', 'It loses the line on curves: slow the base speed down or raise Kp.'],
    challenges: ['Stop at a junction and turn left', 'Time a lap', 'Follow the edge of a wide black area'] },
  joystick: { icon: '🕹️', name: 'Joystick Controlled Robot', level: 'Beginner', mins: 30, sensors: [], show: { track: false, light: false, obstacles: true }, start: [-300, 40, 0],
    what: 'Drive the robot with a thumb joystick, like a remote control: push forward to go, pull back to reverse, push left or right to steer, let go to stop. Press the stick to switch between full and slow speed.',
    how: 'A joystick module is two potentiometers and a button. VRx (left–right) and VRy (forward–back) give a voltage the board reads with analogRead: about half-way (512) with the stick at rest. The program measures that centre at the start, ignores a small dead zone around it, and mixes the two axes into the motors: left = forward + turn, right = forward − turn ("arcade" drive). SW connects to GND when you press the stick, so it needs a pull-up resistor (INPUT_PULLUP) to read HIGH the rest of the time.',
    objectives: ['Read a joystick: two analog axes and a push button', 'Calibrate the centre and use a dead zone', 'Mix forward and turn into left and right motor speeds (arcade drive)', 'Read a button that connects to GND with a pull-up', 'Detect a press (the moment the button goes down) to toggle a mode'],
    expected: 'Press Start, then push the joystick on the robot panel (or drag the joystick part’s lever, or use W A S D): the robot drives where you point and stops when you let go. Press the stick (SW) to switch to slow mode for careful driving between the boxes.',
    mistakes: ['Pushing forward drives backward: the module is turned round, or VRy is upside down. Turn on “Invert forward/back”.', 'The robot creeps when you let go: the dead zone is too small, or the stick was pushed while the program measured the centre at the start.', 'Left and right are swapped: turn on “Invert left/right”, or swap the VRx wire.', 'Pressing does nothing: SW needs the pull-up (INPUT_PULLUP, or “set pull … up” on the RBS bit), because pressing only connects it to GND.'],
    challenges: ['Make small pushes finer (an expo curve: square the axis and keep its sign)', 'Sound a buzzer horn while the stick is pressed', 'Make it wireless: a second board reads the joystick and sends the values by radio or Bluetooth'] },
};
// properties: the program's constants (code) and the parts and table they act on (phys)
const C4P_PARAMS = {
  basic: [
    { k: 'SPEED', label: 'Speed (0–255)', tip: 'PWM duty for straight moves: 255 is full speed.', min: 0, max: 255, step: 5, def: 200 },
    { k: 'TURN_SPEED', label: 'Turning speed', tip: 'PWM duty when turning or spinning.', min: 0, max: 255, step: 5, def: 170 },
    { k: 'LEFT_PCT', label: 'Left motors (%)', tip: 'Trim the left side if the robot drifts.', min: 40, max: 100, step: 1, def: 100 },
    { k: 'RIGHT_PCT', label: 'Right motors (%)', tip: 'Trim the right side if the robot drifts.', min: 40, max: 100, step: 1, def: 100 },
    { k: 'MOVE_MS', label: 'Movement duration (ms)', tip: 'How long each straight move lasts in the demo.', min: 200, max: 6000, step: 100, def: 1500 },
    { k: 'TURN_MS', label: 'Turn duration (ms)', tip: 'How long each turn or spin lasts in the demo.', min: 100, max: 4000, step: 50, def: 800 },
    { k: 'PAUSE_MS', label: 'Pause between moves (ms)', tip: 'The stop between two moves.', min: 0, max: 3000, step: 50, def: 400 },
    { k: 'RAMP_MS', label: 'Acceleration: time to full speed (ms)', tip: 'A soft start in four steps; 0 starts at full speed at once.', min: 0, max: 2000, step: 50, def: 300 },
  ],
  light: [
    { k: 'FWD_SPEED', label: 'Forward speed', tip: 'PWM duty when the light is straight ahead.', min: 0, max: 255, step: 5, def: 150 },
    { k: 'TURN_SPEED', label: 'Turning speed', tip: 'PWM duty when turning toward the light.', min: 0, max: 255, step: 5, def: 160 },
    { k: 'SEARCH_SPEED', label: 'Search speed', tip: 'PWM duty when spinning to look for the light.', min: 0, max: 255, step: 5, def: 120 },
    { k: 'MIN_DIFF', label: 'Minimum light difference', tip: 'Left and right must differ by this much (on 0–1023) before the robot turns.', min: 0, max: 300, step: 1, def: 18 },
    { k: 'MIN_LIGHT', label: 'Light threshold', tip: 'Below this brightness on both sides the light counts as lost.', min: 0, max: 1023, step: 5, def: 560 },
    { k: 'ARRIVE_LIGHT', label: 'Stop when this bright', tip: 'At this brightness the robot has arrived and stops (about 35 cm from the lamp at the default intensity).', min: 0, max: 1023, step: 1, def: 950 },
    { k: 'SAMPLE_MS', label: 'Response delay / sampling (ms)', tip: 'Time between two readings.', min: 5, max: 500, step: 5, def: 30 },
    { k: 'SEARCH_MODE', label: 'When the light is lost', tip: 'Wait where it is, or spin slowly to look for the light.', type: 'choice', choices: [[0, 'Stop and wait'], [1, 'Spin slowly to search']], def: 1 },
  ],
  obstacle: [
    { k: 'FWD_SPEED', label: 'Forward speed', tip: 'PWM duty while the way is clear.', min: 0, max: 255, step: 5, def: 170 },
    { k: 'REV_SPEED', label: 'Reverse speed', tip: 'PWM duty when backing off.', min: 0, max: 255, step: 5, def: 160 },
    { k: 'TURN_SPEED', label: 'Turning speed', tip: 'PWM duty when spinning away.', min: 0, max: 255, step: 5, def: 180 },
    { k: 'STOP_CM', label: 'Detection threshold (cm)', tip: 'Closer than this: stop and avoid. 20 cm suits the lab’s 120 × 72 cm table; on a floor you can use more.', min: 5, max: 150, step: 1, def: 20 },
    { k: 'EMERGENCY_CM', label: 'Emergency stop distance (cm)', tip: 'Closer than this: back off straight away.', min: 2, max: 50, step: 1, def: 8 },
    { k: 'REV_MS', label: 'Reverse time (ms)', tip: 'How long to back off. The 3.7 V robots (RBS bit, ESP32) move slower, so they back off for longer.', min: 0, max: 3000, step: 50, def: 450, defBy: { rbsbit: 600, esp32: 700 } },
    { k: 'TURN_MS', label: 'Turn time (ms)', tip: 'How long each turn lasts before measuring again.', min: 50, max: 3000, step: 25, def: 420, defBy: { rbsbit: 550, esp32: 500 } },
    { k: 'SCAN_MS', label: 'Measurement interval (ms)', tip: 'Time between two distance measurements.', min: 10, max: 1000, step: 10, def: 60 },
    { k: 'RETRIES', label: 'Retry count', tip: 'Turns to try before backing off further.', min: 1, max: 10, step: 1, def: 4 },
    { k: 'STUCK_COUNT', label: 'Stuck after (same readings)', tip: 'If the distance does not change for this many readings while driving, something the beam cannot see (a corner at the side) is holding the robot: back off and turn.', min: 3, max: 60, step: 1, def: 15 },
    { k: 'TURN_DIR', label: 'Turning preference', tip: 'Which way to turn away.', type: 'choice', choices: [[0, 'Left'], [1, 'Right'], [2, 'Alternate']], def: 2 },
    { k: 'ECHO_TIMEOUT', label: 'Echo timeout (µs)', tip: 'pulseIn gives up after this long: about 30000 µs is 5 m.', min: 1000, max: 40000, step: 500, def: 25000, only: ['arduino', 'esp32'] },
  ],
  line: [
    { k: 'SENSORS', label: 'Number of IR sensors', tip: 'Two (left, right) or three (left, centre, right).', type: 'choice', choices: [[2, 'Two'], [3, 'Three']], def: 3, rebuild: true },
    { k: 'MODE', label: 'Algorithm', tip: 'Basic: steer from which sensors see black. PID: smooth correction from the analog readings.', type: 'choice', choices: [[0, 'Basic (truth table)'], [1, 'PID']], def: 1 },
    { k: 'BASE_SPEED', label: 'Base speed', tip: 'PWM duty on a straight line.', min: 0, max: 255, step: 5, def: 120 },
    { k: 'TURN_SPEED', label: 'Turning speed', tip: 'PWM duty for corrections in the basic mode.', min: 0, max: 255, step: 5, def: 150 },
    { k: 'SEARCH_SPEED', label: 'Line recovery speed', tip: 'PWM duty when the line is lost and the robot turns to find it.', min: 0, max: 255, step: 5, def: 130 },
    { k: 'BLACK_LEVEL', label: 'Black threshold (0–1023)', tip: 'Above this reading a sensor is on the black line.', min: 50, max: 1000, step: 5, def: 500 },
    { k: 'WHITE_LEVEL', label: 'White level (0–1023)', tip: 'What a sensor reads on white: the PID mode subtracts it.', min: 0, max: 600, step: 5, def: 140 },
    { k: 'KP', label: 'Kp', tip: 'Proportional gain: how hard to correct for the line’s offset.', min: 0, max: 1, step: 0.01, def: 0.14, float: true },
    { k: 'KI', label: 'Ki', tip: 'Integral gain: corrects a steady offset (usually small or 0).', min: 0, max: 0.05, step: 0.001, def: 0, float: true },
    { k: 'KD', label: 'Kd', tip: 'Derivative gain: damps the swinging from side to side.', min: 0, max: 3, step: 0.05, def: 0.8, float: true },
    { k: 'MAX_CORR', label: 'Maximum correction', tip: 'The PID correction is limited to this.', min: 0, max: 255, step: 5, def: 150 },
    { k: 'SAMPLE_MS', label: 'Sampling interval (ms)', tip: 'Time between two readings.', min: 5, max: 200, step: 5, def: 15 },
  ],
  joystick: [
    { k: 'MAX_SPEED', label: 'Maximum speed (0–255)', tip: 'PWM duty with the stick pushed all the way.', min: 0, max: 255, step: 5, def: 220 },
    { k: 'TURN_PCT', label: 'Turning strength (%)', tip: 'How much left–right steers: lower it for gentler turns.', min: 10, max: 100, step: 5, def: 70 },
    { k: 'DEAD_ZONE', label: 'Dead zone (% of the travel)', tip: 'Around the centre the stick counts as “let go”, so the robot does not creep.', min: 0, max: 40, step: 1, def: 10 },
    { k: 'SLOW_PCT', label: 'Slow mode speed (%)', tip: 'Pressing the stick switches between full speed and this.', min: 10, max: 100, step: 5, def: 45 },
    { k: 'INVERT_Y', label: 'Forward/back', tip: 'Turn the axis round if pushing forward drives backward.', type: 'choice', choices: [[0, 'Normal'], [1, 'Inverted']], def: 0 },
    { k: 'INVERT_X', label: 'Left/right', tip: 'Turn the axis round if left and right are swapped.', type: 'choice', choices: [[0, 'Normal'], [1, 'Inverted']], def: 0 },
    { k: 'SAMPLE_MS', label: 'Reading interval (ms)', tip: 'Time between two readings of the joystick.', min: 5, max: 200, step: 5, def: 20 },
  ],
};
// a value can differ by controller (defBy): the 2P robots (RBS bit, ESP32) run at 3.7 V, slower than the 2S Arduino robot, so their timed moves last longer
const c4pDefaults = (proj, ctrl) => Object.fromEntries(C4P_PARAMS[proj].map((p) => [p.k, p.defBy && ctrl && p.defBy[ctrl] != null ? p.defBy[ctrl] : p.def]));
const c4pFmt = (p, v) => (p.float ? Number(v).toFixed(3).replace(/0+$/, '').replace(/\.$/, '.0') : String(Math.round(v)));

// ---- 10a. the C++ programs (Arduino Uno and ESP32) ----
function c4pCppConsts(proj, P, ctrl) {
  return C4P_PARAMS[proj].filter((p) => !p.only || p.only.includes(ctrl)).map((p) => `const ${p.float ? 'float' : 'int'} ${p.k} = ${c4pFmt(p, P[p.k])};${' '.repeat(Math.max(1, 26 - p.k.length - c4pFmt(p, P[p.k]).length))}// ${p.label}`).join('\n');
}
function c4pMotorCpp(ctrl, drv, trim) {
  const scale = trim ? ['left * LEFT_PCT / 100', 'right * RIGHT_PCT / 100'] : ['left', 'right'];
  if (drv === 'amsr3') return `// Arduino Motor Shield Rev3 (L298P): two channels.
// Channel A drives both LEFT motors (front and rear in parallel), channel B both RIGHT motors.
// The right motors are wired the other way round (red to B-) because they are mounted mirrored,
// so a HIGH direction pin drives both sides forward.
const int DIR_A = 12;     // channel A direction
const int PWM_A = 3;      // channel A speed (PWM)
const int BRAKE_A = 9;    // channel A brake
const int DIR_B = 13;     // channel B direction
const int PWM_B = 11;     // channel B speed (PWM)
const int BRAKE_B = 8;    // channel B brake

void motorsBegin() {
  pinMode(DIR_A, OUTPUT);
  pinMode(BRAKE_A, OUTPUT);
  pinMode(DIR_B, OUTPUT);
  pinMode(BRAKE_B, OUTPUT);
}

// one channel: speed from -255 (full backward) to 255 (full forward); 0 brakes
void channel(int dirPin, int pwmPin, int brakePin, int speed) {
  speed = constrain(speed, -255, 255);
  if (speed == 0) {
    analogWrite(pwmPin, 0);
    digitalWrite(brakePin, HIGH);
    return;
  }
  digitalWrite(brakePin, LOW);
  if (speed > 0) digitalWrite(dirPin, HIGH);
  else digitalWrite(dirPin, LOW);
  analogWrite(pwmPin, abs(speed));
}

void drive(int left, int right) {
  channel(DIR_A, PWM_A, BRAKE_A, ${scale[0]});
  channel(DIR_B, PWM_B, BRAKE_B, ${scale[1]});
}`;
  if (drv === 'l293d') return `#include <AFMotor.h>

// L293D Motor Shield (AFMotor library): four independent channels.
// M1 front left, M2 rear left, M3 rear right, M4 front right.
// The right motors are wired the other way round (red to the B terminal) because they are mounted mirrored,
// so FORWARD drives both sides forward.
AF_DCMotor motorFL(1);
AF_DCMotor motorRL(2);
AF_DCMotor motorRR(3);
AF_DCMotor motorFR(4);

void motorsBegin() {
}

// both motors of one side: speed from -255 (full backward) to 255 (full forward); 0 lets them coast
void setLeft(int speed) {
  speed = constrain(speed, -255, 255);
  motorFL.setSpeed(abs(speed));
  motorRL.setSpeed(abs(speed));
  if (speed > 0) { motorFL.run(FORWARD); motorRL.run(FORWARD); }
  else if (speed < 0) { motorFL.run(BACKWARD); motorRL.run(BACKWARD); }
  else { motorFL.run(RELEASE); motorRL.run(RELEASE); }
}

void setRight(int speed) {
  speed = constrain(speed, -255, 255);
  motorFR.setSpeed(abs(speed));
  motorRR.setSpeed(abs(speed));
  if (speed > 0) { motorFR.run(FORWARD); motorRR.run(FORWARD); }
  else if (speed < 0) { motorFR.run(BACKWARD); motorRR.run(BACKWARD); }
  else { motorFR.run(RELEASE); motorRR.run(RELEASE); }
}

void drive(int left, int right) {
  setLeft(${scale[0]});
  setRight(${scale[1]});
}`;
  return `// HG7881 board (four L9110S channels), two signal pins per motor:
// PWM on the first pin = forward, PWM on the second = backward, both 0 = stop.
// The right motors are wired the other way round (red to OB) because they are mounted mirrored.
const int FL_1 = 25;   // motor A: front left
const int FL_2 = 26;
const int RL_1 = 32;   // motor B: rear left
const int RL_2 = 33;
const int FR_1 = 18;   // motor C: front right
const int FR_2 = 19;
const int RR_1 = 22;   // motor D: rear right
const int RR_2 = 23;

void motorsBegin() {
  // LEDC PWM (ESP32 Arduino core 3.x): 1 kHz, 8-bit duty (0-255) on each pin
  ledcAttach(FL_1, 1000, 8);
  ledcAttach(FL_2, 1000, 8);
  ledcAttach(RL_1, 1000, 8);
  ledcAttach(RL_2, 1000, 8);
  ledcAttach(FR_1, 1000, 8);
  ledcAttach(FR_2, 1000, 8);
  ledcAttach(RR_1, 1000, 8);
  ledcAttach(RR_2, 1000, 8);
}

// one motor: speed from -255 (full backward) to 255 (full forward)
void motor(int pin1, int pin2, int speed) {
  speed = constrain(speed, -255, 255);
  if (speed >= 0) {
    ledcWrite(pin1, speed);
    ledcWrite(pin2, 0);
  } else {
    ledcWrite(pin1, 0);
    ledcWrite(pin2, -speed);
  }
}

void drive(int left, int right) {
  left = ${scale[0]};
  right = ${scale[1]};
  motor(FL_1, FL_2, left);
  motor(RL_1, RL_2, left);
  motor(FR_1, FR_2, right);
  motor(RR_1, RR_2, right);
}`;
}
function c4pCpp(ctrl, drv, proj, P) {
  const Pn = C4P_PINS[ctrl], esp = ctrl === 'esp32', D = C4P_DRV[drv], J = C4P_PROJ[proj];
  const pinName = (p) => (esp ? `GPIO ${p}` : typeof p === 'number' ? `D${p}` : p);
  const head = `// ${J.name} · ${C4P_CTRL[ctrl].name} + ${D.name}
// Roboticschools 4WD Robot Car Chassis – 18650 Edition (four TT motors, 2 x 18650 holder wired ${D.battery}).
// The robot panel (Project tab) changes the constants below; you can also edit them here.
`;
  const consts = c4pCppConsts(proj, P, ctrl), motors = c4pMotorCpp(ctrl, drv, proj === 'basic');
  const adcNote = esp ? '// The ESP32 ADC is 12-bit (0-4095): dividing by 4 gives the same 0-1023 scale as the other boards.\n' : '';
  const read = esp ? '(analogRead(pin) / 4)' : 'analogRead(pin)';
  if (proj === 'basic') return `${head}
${consts}

${motors}

int mode = 0;   // 0 = the demo; 1-7 = a command from the Serial monitor (the arena's drive buttons send them)

void setup() {
  Serial.begin(${esp ? 115200 : 9600});
  motorsBegin();
  Serial.println("Basic 4WD movement: send F B L R A C S, or D for the demo");
}

// a soft start: the speed rises to (left, right) in four steps over RAMP_MS
void rampTo(int left, int right) {
  if (RAMP_MS <= 0) {
    drive(left, right);
    return;
  }
  for (int i = 1; i <= 4; i++) {
    drive(left * i / 4, right * i / 4);
    delay(RAMP_MS / 4);
  }
}

// a letter from the Serial monitor: F B L R A C S, D = demo; 0 when nothing came in
int command() {
  if (Serial.available() <= 0) return 0;
  int c = Serial.read();
  if (c == 'F') return 1;
  if (c == 'B') return 2;
  if (c == 'L') return 3;
  if (c == 'R') return 4;
  if (c == 'A') return 5;
  if (c == 'C') return 6;
  if (c == 'S') return 7;
  if (c == 'D') return 8;
  return 0;
}

void doMove(int m) {
  if (m == 1) { Serial.println("Forward"); rampTo(SPEED, SPEED); }
  else if (m == 2) { Serial.println("Backward"); rampTo(-SPEED, -SPEED); }
  else if (m == 3) { Serial.println("Left"); rampTo(TURN_SPEED / 4, TURN_SPEED); }
  else if (m == 4) { Serial.println("Right"); rampTo(TURN_SPEED, TURN_SPEED / 4); }
  else if (m == 5) { Serial.println("Anticlockwise"); rampTo(-TURN_SPEED, TURN_SPEED); }
  else if (m == 6) { Serial.println("Clockwise"); rampTo(TURN_SPEED, -TURN_SPEED); }
  else { Serial.println("Stop"); drive(0, 0); }
}

// waits ms milliseconds; returns 1 early when a command comes in
int waitFor(long ms) {
  long t0 = millis();
  while (millis() - t0 < ms) {
    int c = command();
    if (c != 0) {
      if (c == 8) mode = 0;
      else mode = c;
      return 1;
    }
    delay(10);
  }
  return 0;
}

void loop() {
  if (mode == 0) {
    // the demo: every movement once, a stop between them, then again
    for (int m = 1; m <= 6; m++) {
      doMove(m);
      long hold = TURN_MS;
      if (m <= 2) hold = MOVE_MS;
      if (waitFor(hold)) { doMove(mode == 0 ? 7 : mode); return; }
      doMove(7);
      if (waitFor(PAUSE_MS)) { doMove(mode == 0 ? 7 : mode); return; }
    }
  } else {
    // a command holds its movement until the next one
    int c = command();
    if (c != 0) {
      if (c == 8) mode = 0;
      else mode = c;
      if (mode != 0) doMove(mode);
    }
    delay(20);
  }
}
`;
  if (proj === 'joystick') {
    const pinOf = (p) => (esp ? String(p) : typeof p === 'number' ? String(p) : p), swName = esp ? `GPIO ${Pn.joySW}` : `D${Pn.joySW}`;
    return `${head}
${consts}

const int JOY_X = ${pinOf(Pn.joyX)};     // joystick VRx: left–right (${pinName(Pn.joyX)})
const int JOY_Y = ${pinOf(Pn.joyY)};     // joystick VRy: forward–back (${pinName(Pn.joyY)})
const int JOY_SW = ${pinOf(Pn.joySW)};    // joystick SW: joins GND while you press the stick (${swName})

${motors}

${adcNote}int readAxis(int pin) {
  return ${read};
}

int centreX = 512;   // what each axis reads with the stick at rest: measured in setup()
int centreY = 512;
int slow = 0;        // pressing the stick switches between full speed (0) and slow (1)
int lastPress = 0;
int count = 0;

// one axis: -255 (pushed all the way one side) to 255 (all the way the other side); 0 inside the dead zone
int axis(int pin, int centre, int invert) {
  long v = readAxis(pin) - centre;
  long dead = DEAD_ZONE;
  dead = dead * 512 / 100;
  long span = 1;
  if (v > dead) {
    span = 1023 - centre - dead;
    v = v - dead;
  } else if (v < -dead) {
    span = centre - dead;
    v = v + dead;
  } else {
    return 0;
  }
  if (span < 1) span = 1;
  v = v * 255 / span;
  v = constrain(v, -255, 255);
  if (invert == 1) v = -v;
  return v;
}

void setup() {
  Serial.begin(${esp ? 115200 : 9600});
  motorsBegin();
  pinMode(JOY_SW, INPUT_PULLUP);    // SW only joins GND: the pull-up holds it HIGH until you press
  delay(200);
  centreX = readAxis(JOY_X);        // calibrate: leave the stick at rest while the robot starts
  centreY = readAxis(JOY_Y);
  Serial.println("Joystick robot: push the stick to drive, press it for slow mode");
}

void loop() {
  int fwd = axis(JOY_Y, centreY, INVERT_Y);
  int turn = axis(JOY_X, centreX, INVERT_X);
  turn = turn * TURN_PCT / 100;

  // a press: the moment SW goes LOW toggles slow mode
  int pressed = 0;
  if (digitalRead(JOY_SW) == LOW) pressed = 1;
  if (pressed == 1 && lastPress == 0) {
    slow = 1 - slow;
    if (slow == 1) Serial.println("Slow mode");
    else Serial.println("Full speed");
  }
  lastPress = pressed;

  // arcade drive: forward plus or minus turn, scaled to the top speed
  long top = MAX_SPEED;
  if (slow == 1) top = top * SLOW_PCT / 100;
  long left = constrain(fwd + turn, -255, 255);
  long right = constrain(fwd - turn, -255, 255);
  left = left * top / 255;
  right = right * top / 255;
  drive(left, right);

  count++;
  if (count >= 10) {
    count = 0;
    Serial.print("forward ");
    Serial.print(fwd);
    Serial.print("  turn ");
    Serial.print(turn);
    Serial.print("  left ");
    Serial.print(left);
    Serial.print("  right ");
    Serial.println(right);
  }
  delay(SAMPLE_MS);
}
`;
  }
  if (proj === 'light') return `${head}
${consts}

const int LDR_LEFT = ${esp ? Pn.ldrL : Pn.ldrL};    // left LDR module AO (${pinName(Pn.ldrL)})
const int LDR_RIGHT = ${esp ? Pn.ldrR : Pn.ldrR};   // right LDR module AO (${pinName(Pn.ldrR)})

${motors}

${adcNote}// The LDR module's AO voltage FALLS as the light rises, so brightness = 1023 - reading.
int light(int pin) {
  return 1023 - ${read};
}

void setup() {
  Serial.begin(${esp ? 115200 : 9600});
  motorsBegin();
}

void loop() {
  int left = light(LDR_LEFT);
  int right = light(LDR_RIGHT);
  int diff = left - right;
  Serial.print("left ");
  Serial.print(left);
  Serial.print("  right ");
  Serial.println(right);
  if (left >= ARRIVE_LIGHT || right >= ARRIVE_LIGHT) {
    drive(0, 0);                                   // at the light: stop
  } else if (left < MIN_LIGHT && right < MIN_LIGHT) {
    if (SEARCH_MODE == 1) drive(-SEARCH_SPEED, SEARCH_SPEED);   // light lost: spin slowly to find it
    else drive(0, 0);                              // or wait
  } else if (diff > MIN_DIFF) {
    drive(-TURN_SPEED / 3, TURN_SPEED);            // brighter on the left: turn left
  } else if (-diff > MIN_DIFF) {
    drive(TURN_SPEED, -TURN_SPEED / 3);            // brighter on the right: turn right
  } else {
    drive(FWD_SPEED, FWD_SPEED);                   // about equal: straight on
  }
  delay(SAMPLE_MS);
}
`;
  if (proj === 'obstacle') return `${head}
${consts}

const int TRIG = ${Pn.trig};    // HC-SR04 TRIG (${pinName(Pn.trig)})
const int ECHO = ${Pn.echo};    // HC-SR04 ECHO (${pinName(Pn.echo)})${esp ? '   the sensor runs on 3.3 V here, so ECHO is 3.3 V: safe for the ESP32' : ''}

${motors}

int lastTurn = 1;
long lastD = 0;     // the previous reading
int same = 0;       // how many readings in a row did not change

// distance in cm; 999 when no echo came back in time
long readCm() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long us = pulseIn(ECHO, HIGH, ECHO_TIMEOUT);
  if (us == 0) return 999;
  return us / 58;
}

// turn away, measure again, up to RETRIES times; back off further if still blocked
void avoid() {
  int dir = TURN_DIR;                                // one direction for the whole manoeuvre
  if (TURN_DIR == 2) dir = 1 - lastTurn;             // "Alternate": the other way from last time
  lastTurn = dir;
  for (int tries = 0; tries < RETRIES; tries++) {
    if (dir == 0) drive(-TURN_SPEED, TURN_SPEED);   // spin left
    else drive(TURN_SPEED, -TURN_SPEED);            // spin right
    delay(TURN_MS);
    drive(0, 0);
    delay(120);
    if (readCm() > STOP_CM) return;                  // the way is clear
  }
  drive(-REV_SPEED, -REV_SPEED);
  delay(REV_MS * 2);
  drive(0, 0);
}

void setup() {
  Serial.begin(${esp ? 115200 : 9600});
  motorsBegin();
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
}

void loop() {
  long d = readCm();
  if (d < 999 && d == lastD) same++;
  else same = 0;
  lastD = d;
  Serial.print("distance ");
  Serial.println(d);
  if (d <= EMERGENCY_CM) {
    drive(0, 0);
    delay(100);
    drive(-REV_SPEED, -REV_SPEED);                  // too close: back off first
    delay(REV_MS);
    avoid();
  } else if (d <= STOP_CM) {
    drive(0, 0);                                     // obstacle: stop
    delay(150);
    if (REV_MS > 0) {
      drive(-REV_SPEED, -REV_SPEED);
      delay(REV_MS / 2);
    }
    avoid();
  } else if (same >= STUCK_COUNT) {
    // driving, but the distance does not change: something the beam cannot see (a corner at the side) holds the robot
    same = 0;
    drive(-REV_SPEED, -REV_SPEED);
    delay(REV_MS);
    avoid();
  } else {
    drive(FWD_SPEED, FWD_SPEED);                     // clear: forward
  }
  delay(SCAN_MS);
}
`;
  return `${head}
${consts}

const int IR_LEFT = ${Pn.irL};      // left line sensor AO (${pinName(Pn.irL)})
const int IR_CENTRE = ${Pn.irC};    // centre line sensor AO (${pinName(Pn.irC)}), used with three sensors
const int IR_RIGHT = ${Pn.irR};     // right line sensor AO (${pinName(Pn.irR)})

${motors}

int lastSide = 0;     // -1 = the line was last seen on the left, 1 = on the right
float lastError = 0;
float integral = 0;

${adcNote}// TCRT5000 module AO: HIGH on black (the tape absorbs the infrared), LOW on white
int sense(int pin) {
  return ${read};
}

void setup() {
  Serial.begin(${esp ? 115200 : 9600});
  motorsBegin();
}

void basicMode(int l, int m, int r) {
  if (SENSORS == 2) {
    if (l == 0 && r == 0) drive(BASE_SPEED, BASE_SPEED);                 // the line is between the sensors
    else if (l == 1 && r == 0) { drive(-TURN_SPEED / 2, TURN_SPEED); lastSide = -1; }
    else if (l == 0 && r == 1) { drive(TURN_SPEED, -TURN_SPEED / 2); lastSide = 1; }
    else drive(BASE_SPEED, BASE_SPEED);                                  // a junction: straight on
    return;
  }
  if (l == 0 && m == 1 && r == 0) drive(BASE_SPEED, BASE_SPEED);         // centred
  else if (l == 1 && m == 0 && r == 0) { drive(-TURN_SPEED / 2, TURN_SPEED); lastSide = -1; }   // turn left
  else if (l == 0 && m == 0 && r == 1) { drive(TURN_SPEED, -TURN_SPEED / 2); lastSide = 1; }    // turn right
  else if (l == 1 && m == 1 && r == 0) { drive(BASE_SPEED / 3, BASE_SPEED); lastSide = -1; }    // slight left
  else if (l == 0 && m == 1 && r == 1) { drive(BASE_SPEED, BASE_SPEED / 3); lastSide = 1; }     // slight right
  else if (l == 0 && m == 0 && r == 0) {                                 // line lost: turn toward where it was
    if (lastSide < 0) drive(-SEARCH_SPEED, SEARCH_SPEED);
    else drive(SEARCH_SPEED, -SEARCH_SPEED);
  }
  else drive(BASE_SPEED, BASE_SPEED);                                    // a junction (all black): straight on
}

void pidMode(int a, int b, int c) {
  // how dark each sensor sees, with the white level taken off
  int dl = max(0, a - WHITE_LEVEL);
  int dm = max(0, b - WHITE_LEVEL);
  int dr = max(0, c - WHITE_LEVEL);
  if (SENSORS == 2) dm = 0;
  int total = dl + dm + dr;
  if (total < 60) {                                                      // line lost
    if (lastSide < 0) drive(-SEARCH_SPEED, SEARCH_SPEED);
    else drive(SEARCH_SPEED, -SEARCH_SPEED);
    return;
  }
  float error = (dr - dl) * 1000.0 / total;                               // -1000 (line on the left) ... 1000 (on the right)
  if (error < -100) lastSide = -1;
  if (error > 100) lastSide = 1;
  integral = constrain(integral + error, -20000, 20000);
  float correction = KP * error + KI * integral + KD * (error - lastError);
  lastError = error;
  correction = constrain(correction, -MAX_CORR, MAX_CORR);
  drive(BASE_SPEED + correction, BASE_SPEED - correction);
}

void loop() {
  int a = sense(IR_LEFT);
  int b = sense(IR_CENTRE);
  int c = sense(IR_RIGHT);
  if (SENSORS == 2) b = 0;
  int l = a > BLACK_LEVEL ? 1 : 0;
  int m = b > BLACK_LEVEL ? 1 : 0;
  int r = c > BLACK_LEVEL ? 1 : 0;
  Serial.print(a);
  Serial.print(" ");
  Serial.print(b);
  Serial.print(" ");
  Serial.println(c);
  if (MODE == 1) pidMode(a, b, c);
  else basicMode(l, m, r);
  delay(SAMPLE_MS);
}
`;
}
// a constant changed: rewrite only its line, so the student's other edits stay
function c4pCppSet(code, p, v) { return code.replace(new RegExp(`^(const (?:int|float) ${p.k} = )[^;]*;`, 'm'), `$1${c4pFmt(p, v)};`); }

// ---- 10b. the RBS bit programs: blocks (the lab runs them) and the same program as MakeCode TypeScript ----
// Each node carries its Blockly JSON (b) and its TypeScript (ts), so both versions always match.
const C4B = (() => {
  const vid = (n) => 'c4v_' + n, inp = (e) => ({ block: e.b });
  const op = (o, a, b) => ({ b: { type: 'math_arithmetic', fields: { OP: o }, inputs: { A: inp(a), B: inp(b) } }, ts: `(${a.ts} ${{ ADD: '+', MINUS: '-', MULTIPLY: '*', DIVIDE: '/' }[o]} ${b.ts})` });
  const X = {
    n: (v) => ({ b: { type: 'math_number', fields: { NUM: v } }, ts: String(v) }),
    v: (n) => ({ b: { type: 'variables_get', fields: { VAR: { id: vid(n) } } }, ts: n }),
    add: (a, b) => op('ADD', a, b), sub: (a, b) => op('MINUS', a, b), mul: (a, b) => op('MULTIPLY', a, b), div: (a, b) => op('DIVIDE', a, b),
    cmp: (o, a, b) => ({ b: { type: 'logic_compare', fields: { OP: o }, inputs: { A: inp(a), B: inp(b) } }, ts: `${a.ts} ${{ EQ: '==', NEQ: '!=', LT: '<', LTE: '<=', GT: '>', GTE: '>=' }[o]} ${b.ts}` }),
    and: (a, b) => ({ b: { type: 'logic_operation', fields: { OP: 'AND' }, inputs: { A: inp(a), B: inp(b) } }, ts: `(${a.ts} && ${b.ts})` }),
    or: (a, b) => ({ b: { type: 'logic_operation', fields: { OP: 'OR' }, inputs: { A: inp(a), B: inp(b) } }, ts: `(${a.ts} || ${b.ts})` }),
    con: (x, lo, hi) => ({ b: { type: 'math_constrain', inputs: { VALUE: inp(x), LOW: inp(lo), HIGH: inp(hi) } }, ts: `Math.constrain(${x.ts}, ${lo.ts}, ${hi.ts})` }),
    aread: (pin) => ({ b: { type: 'rbs_analog_read', fields: { PIN: pin } }, ts: `pins.analogReadPin(AnalogPin.${pin})` }),
    sonar: (t, e) => ({ b: { type: 'rbx_sonar_ping', fields: { TRIG: t, ECHO: e, UNIT: 'cm' } }, ts: `sonar.ping(DigitalPin.${t}, DigitalPin.${e}, PingUnit.Centimeters)` }),
    dread: (pin) => ({ b: { type: 'rbs_digital_read', fields: { PIN: pin } }, ts: `pins.digitalReadPin(DigitalPin.${pin})` }),
  };
  const S = {
    set: (n, e) => ({ b: { type: 'variables_set', fields: { VAR: { id: vid(n) } }, inputs: { VALUE: inp(e) } }, ts: [`${n} = ${e.ts}`] }),
    motor: (m, dir, e) => ({ b: { type: 'rbsdrv_motor_run', fields: { MOTOR: m, DIR: dir }, inputs: { SPEED: inp(e) } }, ts: [`motor.MotorRun(motor.Motors.${m}, motor.Dir.${dir === '1' ? 'CW' : 'CCW'}, ${e.ts})`] }),
    stop: () => ({ b: { type: 'rbsdrv_stop_all' }, ts: ['motor.motorStopAll()'] }),
    pause: (e) => ({ b: { type: 'rbs_pause', inputs: { MS: inp(e) } }, ts: [`basic.pause(${e.ts})`] }),
    pull: (pin, mode) => ({ b: { type: 'rbs_set_pull', fields: { PIN: pin, PULL: mode } }, ts: [`pins.setPull(DigitalPin.${pin}, PinPullMode.${{ up: 'PullUp', down: 'PullDown', none: 'PullNone' }[mode]})`] }),
    arrow: (a) => ({ b: { type: 'rbs_show_arrow', fields: { ARROW: a } }, ts: [`basic.showArrow(ArrowNames.${{ N: 'North', S: 'South', E: 'East', W: 'West' }[a]})`] }),
    icon: (i) => ({ b: { type: 'rbs_show_icon', fields: { ICON: i } }, ts: [`basic.showIcon(IconNames.${i[0].toUpperCase() + i.slice(1)})`] }),
    value: (name, e) => ({ b: { type: 'rbs_serial_value', inputs: { NAME: { block: { type: 'text', fields: { TEXT: name } } }, VALUE: inp(e) } }, ts: [`serial.writeValue("${name}", ${e.ts})`] }),
    if: (branches, els) => {
      const ins = {}, ts = [];
      branches.forEach(([c, body], i) => { ins['IF' + i] = inp(c); if (body.length) ins['DO' + i] = { block: chain(body) }; ts.push(`${i ? '} else if' : 'if'} (${c.ts}) {`, ...body.flatMap((s) => s.ts.map((l) => '    ' + l))); });
      if (els && els.length) { ins.ELSE = { block: chain(els) }; ts.push('} else {', ...els.flatMap((s) => s.ts.map((l) => '    ' + l))); }
      ts.push('}');
      return { b: { type: 'controls_if', ...(branches.length > 1 || els ? { extraState: { ...(branches.length > 1 ? { elseIfCount: branches.length - 1 } : {}), ...(els ? { hasElse: true } : {}) } } : {}), inputs: ins }, ts };
    },
    whileDo: (c, body) => ({ b: { type: 'controls_whileUntil', fields: { MODE: 'WHILE' }, inputs: { BOOL: inp(c), ...(body.length ? { DO: { block: chain(body) } } : {}) } }, ts: [`while (${c.ts}) {`, ...body.flatMap((s) => s.ts.map((l) => '    ' + l)), '}'] }),
  };
  function chain(list) { const bs = list.map((s) => ({ ...s.b })); for (let i = bs.length - 2; i >= 0; i--) bs[i].next = { block: bs[i + 1] }; return bs[0]; }
  // a side's two motors at a signed speed: the left motors are M1 (front) and M2 (rear), the right M3 (front) and M4 (rear);
  // the right motors are wired the other way round, so CW drives both sides forward
  const side = (ms, e) => [S.if([[X.cmp('GTE', e, X.n(0)), ms.map((m) => S.motor(m, '1', X.con(e, X.n(0), X.n(255))))]], ms.map((m) => S.motor(m, '-1', X.con(X.sub(X.n(0), e), X.n(0), X.n(255)))))];
  const drive = (l, r) => [...side(['M1', 'M2'], l), ...side(['M3', 'M4'], r)];
  const fixed = (l, r) => [...['M1', 'M2'].map((m) => S.motor(m, l.dir, l.e)), ...['M3', 'M4'].map((m) => S.motor(m, r.dir, r.e))];
  return { X, S, chain, drive, fixed, vid };
})();
function c4pBlocks(proj, P) {
  const { X, S, chain, drive, fixed, vid } = C4B, Pn = C4P_PINS.rbsbit, v = X.v, n = X.n;
  const params = C4P_PARAMS[proj].filter((p) => !p.only || p.only.includes('rbsbit'));
  const extra = { basic: ['mode', 'sl', 'sr', 'tl', 'tr', 'ql', 'qr'], light: ['left', 'right', 'diff'], obstacle: ['d', 'tries', 'dir', 'lastTurn', 'clear', 'lastD', 'same'], line: ['a', 'b', 'c', 'l', 'm', 'r', 'lastSide', 'dl', 'dm', 'dr', 'total', 'error', 'lastError', 'integral', 'corr'], joystick: ['cx', 'cy', 'dead', 'fv', 'tv', 'fwd', 'turn', 'pressed', 'lastPress', 'slow', 'top', 'left', 'right'] }[proj];
  const vars = [...params.map((p) => p.k), ...extra];
  const setup = params.map((p) => S.set(p.k, n(P[p.k])));
  let start = [], forever = [], events = [];
  const pct = (e, side) => (proj === 'basic' ? X.div(X.mul(e, v(side === 'L' ? 'LEFT_PCT' : 'RIGHT_PCT')), n(100)) : e);
  const go = (l, r) => drive(pct(l, 'L'), pct(r, 'R'));
  // a move with known directions: dl/dr = '1' (forward: CW) or '-1' (backward: CCW), speeds as positive expressions
  const mv = (dl, el, dr, er) => fixed({ dir: dl, e: proj === 'basic' ? X.div(X.mul(el, v('LEFT_PCT')), n(100)) : el }, { dir: dr, e: proj === 'basic' ? X.div(X.mul(er, v('RIGHT_PCT')), n(100)) : er });
  if (proj === 'basic') {
    // speeds for each side, worked out once: straight (s), turning (t) and a quarter of turning (q), with the left/right trim
    const pct = (e, k) => X.div(X.mul(e, v(k)), n(100));
    const speeds = [S.set('sl', pct(v('SPEED'), 'LEFT_PCT')), S.set('sr', pct(v('SPEED'), 'RIGHT_PCT')), S.set('tl', pct(v('TURN_SPEED'), 'LEFT_PCT')), S.set('tr', pct(v('TURN_SPEED'), 'RIGHT_PCT')), S.set('ql', X.div(v('tl'), n(4))), S.set('qr', X.div(v('tr'), n(4)))];
    const mvv = (dl, l, dr, r, k = 1) => fixed({ dir: dl, e: k === 1 ? v(l) : X.div(v(l), n(2)) }, { dir: dr, e: k === 1 ? v(r) : X.div(v(r), n(2)) });
    // the demo in the forever loop; button A = next movement, B = stop (press B again for the demo)
    const moves = [['N', '1', 'sl', '1', 'sr', 'MOVE_MS'], ['S', '-1', 'sl', '-1', 'sr', 'MOVE_MS'], ['W', '1', 'ql', '1', 'tr', 'TURN_MS'], ['E', '1', 'tl', '1', 'qr', 'TURN_MS'], ['W', '-1', 'tl', '1', 'tr', 'TURN_MS'], ['E', '1', 'tl', '-1', 'tr', 'TURN_MS']];
    const ramp = ([, dl, l, dr, r]) => [S.if([[X.cmp('GT', v('RAMP_MS'), n(0)), [...mvv(dl, l, dr, r, 2), S.pause(X.div(v('RAMP_MS'), n(2)))]]]), ...mvv(dl, l, dr, r)];
    const demo = X.cmp('EQ', v('mode'), n(0));
    start = [...setup, ...speeds, S.set('mode', n(0)), S.icon('happy')];
    forever = [S.if([[demo, moves.flatMap((m) => [S.if([[X.cmp('EQ', v('mode'), n(0)), [S.arrow(m[0]), ...ramp(m), S.pause(X.sub(v(m[5]), X.div(v('RAMP_MS'), n(2))))]]]), S.if([[X.cmp('EQ', v('mode'), n(0)), [S.stop(), S.pause(v('PAUSE_MS'))]]])])]], [S.pause(n(50))])];
    events = [{ type: 'rbs_on_button', fields: { BUTTON: 'A' }, body: [S.set('mode', X.add(v('mode'), n(1))), S.if([[X.cmp('GT', v('mode'), n(6)), [S.set('mode', n(1))]]]), S.if(moves.map((m, i) => [X.cmp('EQ', v('mode'), n(i + 1)), [S.arrow(m[0]), ...mvv(m[1], m[2], m[3], m[4])]]))], tsHead: 'input.onButtonPressed(Button.A, function () {' },
      { type: 'rbs_on_button', fields: { BUTTON: 'B' }, body: [S.if([[X.cmp('EQ', v('mode'), n(7)), [S.set('mode', n(0)), S.icon('happy')]]], [S.set('mode', n(7)), S.stop(), S.icon('no')])], tsHead: 'input.onButtonPressed(Button.B, function () {' }];
  }
  if (proj === 'light') {
    start = [...setup];
    forever = [S.set('left', X.sub(n(1023), X.aread(Pn.ldrL))), S.set('right', X.sub(n(1023), X.aread(Pn.ldrR))), S.set('diff', X.sub(v('left'), v('right'))),
      S.value('left', v('left')), S.value('right', v('right')),
      S.if([[X.or(X.cmp('GTE', v('left'), v('ARRIVE_LIGHT')), X.cmp('GTE', v('right'), v('ARRIVE_LIGHT'))), [S.stop()]],
        [X.and(X.cmp('LT', v('left'), v('MIN_LIGHT')), X.cmp('LT', v('right'), v('MIN_LIGHT'))), [S.if([[X.cmp('EQ', v('SEARCH_MODE'), n(1)), mv('-1', v('SEARCH_SPEED'), '1', v('SEARCH_SPEED'))]], [S.stop()])]],
        [X.cmp('GT', v('diff'), v('MIN_DIFF')), mv('-1', X.div(v('TURN_SPEED'), n(3)), '1', v('TURN_SPEED'))],
        [X.cmp('GT', X.sub(n(0), v('diff')), v('MIN_DIFF')), mv('1', v('TURN_SPEED'), '-1', X.div(v('TURN_SPEED'), n(3)))]],
      mv('1', v('FWD_SPEED'), '1', v('FWD_SPEED'))),
      S.pause(v('SAMPLE_MS'))];
  }
  if (proj === 'obstacle') {
    const ping = () => [S.set('d', X.sonar(Pn.trig, Pn.echo)), S.if([[X.cmp('EQ', v('d'), n(0)), [S.set('d', n(999))]]])];
    const back = (ms) => [...mv('-1', v('REV_SPEED'), '-1', v('REV_SPEED')), S.pause(ms)];
    const avoid = [S.set('tries', n(0)), S.set('clear', n(0)),
      S.set('dir', v('TURN_DIR')), S.if([[X.cmp('EQ', v('TURN_DIR'), n(2)), [S.set('dir', X.sub(n(1), v('lastTurn')))]]]), S.set('lastTurn', v('dir')),   // one direction per manoeuvre
      S.whileDo(X.and(X.cmp('LT', v('tries'), v('RETRIES')), X.cmp('EQ', v('clear'), n(0))), [
        S.if([[X.cmp('EQ', v('dir'), n(0)), mv('-1', v('TURN_SPEED'), '1', v('TURN_SPEED'))]], mv('1', v('TURN_SPEED'), '-1', v('TURN_SPEED'))),
        S.pause(v('TURN_MS')), S.stop(), S.pause(n(120)), ...ping(),
        S.if([[X.cmp('GT', v('d'), v('STOP_CM')), [S.set('clear', n(1))]]]), S.set('tries', X.add(v('tries'), n(1)))]),
      S.if([[X.cmp('EQ', v('clear'), n(0)), [...back(X.mul(v('REV_MS'), n(2))), S.stop()]]])];
    start = [...setup, S.set('lastTurn', n(1)), S.set('lastD', n(0)), S.set('same', n(0))];
    forever = [...ping(), S.if([[X.and(X.cmp('LT', v('d'), n(999)), X.cmp('EQ', v('d'), v('lastD'))), [S.set('same', X.add(v('same'), n(1)))]]], [S.set('same', n(0))]), S.set('lastD', v('d')), S.value('distance', v('d')),
      S.if([[X.cmp('LTE', v('d'), v('EMERGENCY_CM')), [S.stop(), S.pause(n(100)), ...back(v('REV_MS')), ...avoid]],
        [X.cmp('LTE', v('d'), v('STOP_CM')), [S.stop(), S.pause(n(150)), S.if([[X.cmp('GT', v('REV_MS'), n(0)), back(X.div(v('REV_MS'), n(2)))]]), ...avoid]],
        [X.cmp('GTE', v('same'), v('STUCK_COUNT')), [S.set('same', n(0)), ...back(v('REV_MS')), ...avoid]]],
      mv('1', v('FWD_SPEED'), '1', v('FWD_SPEED'))),
      S.pause(v('SCAN_MS'))];
  }
  if (proj === 'line') {
    const lost = [S.if([[X.cmp('LT', v('lastSide'), n(0)), mv('-1', v('SEARCH_SPEED'), '1', v('SEARCH_SPEED'))]], mv('1', v('SEARCH_SPEED'), '-1', v('SEARCH_SPEED')))];
    const bit = (out, raw) => S.if([[X.cmp('GT', v(raw), v('BLACK_LEVEL')), [S.set(out, n(1))]]], [S.set(out, n(0))]);
    const eq = (a, b, c) => X.and(X.and(X.cmp('EQ', v('l'), n(a)), X.cmp('EQ', v('m'), n(b))), X.cmp('EQ', v('r'), n(c)));
    const fwd = mv('1', v('BASE_SPEED'), '1', v('BASE_SPEED')), half = X.div(v('TURN_SPEED'), n(2));
    const basic3 = S.if([[eq(0, 1, 0), fwd],
      [eq(1, 0, 0), [...mv('-1', half, '1', v('TURN_SPEED')), S.set('lastSide', n(-1))]],
      [eq(0, 0, 1), [...mv('1', v('TURN_SPEED'), '-1', half), S.set('lastSide', n(1))]],
      [eq(1, 1, 0), [...mv('1', X.div(v('BASE_SPEED'), n(3)), '1', v('BASE_SPEED')), S.set('lastSide', n(-1))]],
      [eq(0, 1, 1), [...mv('1', v('BASE_SPEED'), '1', X.div(v('BASE_SPEED'), n(3))), S.set('lastSide', n(1))]],
      [eq(0, 0, 0), lost]], fwd);
    const basic2 = S.if([[X.and(X.cmp('EQ', v('l'), n(1)), X.cmp('EQ', v('r'), n(0))), [...mv('-1', half, '1', v('TURN_SPEED')), S.set('lastSide', n(-1))]],
      [X.and(X.cmp('EQ', v('l'), n(0)), X.cmp('EQ', v('r'), n(1))), [...mv('1', v('TURN_SPEED'), '-1', half), S.set('lastSide', n(1))]]], fwd);
    const dark = (out, raw) => S.set(out, X.con(X.sub(v(raw), v('WHITE_LEVEL')), n(0), n(1023)));
    const pid = [dark('dl', 'a'), dark('dm', 'b'), dark('dr', 'c'), S.if([[X.cmp('EQ', v('SENSORS'), n(2)), [S.set('dm', n(0))]]]),
      S.set('total', X.add(X.add(v('dl'), v('dm')), v('dr'))),
      S.if([[X.cmp('LT', v('total'), n(60)), lost]], [
        S.set('error', X.div(X.mul(X.sub(v('dr'), v('dl')), n(1000)), v('total'))),
        S.if([[X.cmp('LT', v('error'), n(-100)), [S.set('lastSide', n(-1))]], [X.cmp('GT', v('error'), n(100)), [S.set('lastSide', n(1))]]]),
        S.set('integral', X.con(X.add(v('integral'), v('error')), n(-20000), n(20000))),
        S.set('corr', X.add(X.add(X.mul(v('KP'), v('error')), X.mul(v('KI'), v('integral'))), X.mul(v('KD'), X.sub(v('error'), v('lastError'))))),
        S.set('lastError', v('error')), S.set('corr', X.con(v('corr'), X.sub(n(0), v('MAX_CORR')), v('MAX_CORR'))),
        ...go(X.add(v('BASE_SPEED'), v('corr')), X.sub(v('BASE_SPEED'), v('corr')))])];
    start = [...setup, S.set('lastSide', n(1)), S.set('lastError', n(0)), S.set('integral', n(0))];
    forever = [S.set('a', X.aread(Pn.irL)), S.set('b', X.aread(Pn.irC)), S.set('c', X.aread(Pn.irR)), S.if([[X.cmp('EQ', v('SENSORS'), n(2)), [S.set('b', n(0))]]]),
      bit('l', 'a'), bit('m', 'b'), bit('r', 'c'), S.value('left', v('a')), S.value('right', v('c')),
      S.if([[X.cmp('EQ', v('MODE'), n(1)), pid], [X.cmp('EQ', v('SENSORS'), n(2)), [basic2]]], [basic3]),
      S.pause(v('SAMPLE_MS'))];
    // with two sensors on P0 and P2, the centre input reads nothing: P1 is left free
  }
  if (proj === 'joystick') {
    // one axis, as in the C++ version: 0 inside the dead zone, then -255…255 over the rest of the travel
    const axis = (out, raw, centre, inv) => [S.set(raw, X.sub(raw === 'fv' ? X.aread(Pn.joyY) : X.aread(Pn.joyX), v(centre))),
      S.if([[X.cmp('GT', v(raw), v('dead')), [S.set(out, X.div(X.mul(X.sub(v(raw), v('dead')), n(255)), X.sub(X.sub(n(1023), v(centre)), v('dead'))))]],
        [X.cmp('LT', v(raw), X.sub(n(0), v('dead'))), [S.set(out, X.div(X.mul(X.add(v(raw), v('dead')), n(255)), X.sub(v(centre), v('dead'))))]]], [S.set(out, n(0))]),
      S.set(out, X.con(v(out), n(-255), n(255))), S.if([[X.cmp('EQ', v(inv), n(1)), [S.set(out, X.sub(n(0), v(out)))]]])];
    start = [...setup, S.pull(Pn.joySW, 'up'), S.pause(n(200)), S.set('cx', X.aread(Pn.joyX)), S.set('cy', X.aread(Pn.joyY)),
      S.set('dead', X.div(X.mul(v('DEAD_ZONE'), n(512)), n(100))), S.set('slow', n(0)), S.set('lastPress', n(0)), S.icon('happy')];
    forever = [...axis('fwd', 'fv', 'cy', 'INVERT_Y'), ...axis('turn', 'tv', 'cx', 'INVERT_X'), S.set('turn', X.div(X.mul(v('turn'), v('TURN_PCT')), n(100))),
      // SW joins GND when pressed: 0 means pressed; the moment it goes down toggles slow mode
      S.if([[X.cmp('EQ', X.dread(Pn.joySW), n(0)), [S.set('pressed', n(1))]]], [S.set('pressed', n(0))]),
      S.if([[X.and(X.cmp('EQ', v('pressed'), n(1)), X.cmp('EQ', v('lastPress'), n(0))), [S.set('slow', X.sub(n(1), v('slow'))), S.value('slow', v('slow'))]]]),
      S.set('lastPress', v('pressed')),
      S.set('top', v('MAX_SPEED')), S.if([[X.cmp('EQ', v('slow'), n(1)), [S.set('top', X.div(X.mul(v('MAX_SPEED'), v('SLOW_PCT')), n(100)))]]]),
      S.set('left', X.div(X.mul(X.con(X.add(v('fwd'), v('turn')), n(-255), n(255)), v('top')), n(255))),
      S.set('right', X.div(X.mul(X.con(X.sub(v('fwd'), v('turn')), n(-255), n(255)), v('top')), n(255))),
      ...drive(v('left'), v('right')), S.value('forward', v('fwd')), S.value('turn', v('turn')),
      S.pause(v('SAMPLE_MS'))];
  }
  const blocks = [{ type: 'rbs_on_start', x: 20, y: 20, inputs: { DO: { block: chain(start) } } }, { type: 'rbs_forever', x: 20, y: 40 + start.length * 30, inputs: forever.length ? { DO: { block: chain(forever) } } : {} }];
  events.forEach((e, i) => blocks.push({ type: e.type, x: 520, y: 20 + i * 260, fields: e.fields, inputs: { DO: { block: chain(e.body) } } }));
  const json = { variables: vars.map((k) => ({ name: k, id: vid(k) })), blocks: { languageVersion: 0, blocks } };
  const J = C4P_PROJ[proj], ind = (list) => list.flatMap((s) => s.ts.map((l) => '    ' + l));
  const ts = [`// ${J.name} · RBS bit (micro:bit V2) + RBS bit Driver Expansion Board`, '// MakeCode TypeScript: the same program as the blocks. Extensions: pxt-motor (DFRobot motor driver) and sonar.',
    '// Motors: M1 front left, M2 rear left, M3 front right, M4 rear right (the right ones wired the other way round).', '',
    ...vars.map((k) => `let ${k} = 0`), '', ...start.flatMap((s) => s.ts), ...events.flatMap((e) => [e.tsHead, ...ind(e.body), '})']),
    'basic.forever(function () {', ...ind(forever), '})', ''].join('\n');
  return { json, ts };
}
// a property changed in a blocks program: set the number in its "set … to" block (in on start), keeping the student's edits
function c4pBlocksSet(k, v) {
  const ws = typeof blocksWs !== 'undefined' ? blocksWs : null; if (!ws) return false; let done = false;
  for (const b of ws.getAllBlocks(false)) {
    if (b.type !== 'variables_set') continue; const vr = b.getField('VAR') && b.getField('VAR').getVariable && b.getField('VAR').getVariable(); if (!vr || vr.name !== k) continue;
    const t = b.getInputTargetBlock('VALUE'); if (t && t.type === 'math_number') { t.setFieldValue(String(v), 'NUM'); done = true; break; }
  }
  if (done) { try { blocksJson = window.Blockly.serialization.workspaces.save(ws); } catch { /* the workspace keeps it */ } save(); }
  return done;
}

// ---- 10c. building a project on the bench: the parts, the wires (each listed in the wiring table), the car's mounts ----
const C4P_COL = { red: '#e2443a', black: '#2a2730', yellow: '#f1c232', green: '#2ea36c', blue: '#2f7ed8', orange: '#f28a2e', white: '#e9e6f0', purple: '#8e5cd9' };
function c4pBuild(ctrl, drv, proj, P) {
  const J = C4P_PROJ[proj], W = [], add = (type, x, z, rot = 0, props) => createComp(type, x, z, rot, props);
  const wire = (a, ap, b, bp, col, what) => { const w = addWire(`${a.id}:${ap}`, `${b.id}:${bp}`, col, false); W.push({ from: `${c4pName(a)} ${ap}`, to: `${c4pName(b)} ${bp}`, what, col, ok: !!w }); return w; };
  clearAll(true);
  const [sx, sz] = J.start, car = add('car4wd', sx, sz, 0);
  car.props.cfg = { battery: { wiring: C4P_DRV[drv].battery } }; car.props.on = true; car.props.src = 'circuit'; car.props.soc = 1; delete car.state.soc;
  const L = car4Lv(car4Cfg(car, 'dims')), deck = L.top + 9;   // boards stand on 9 mm brass standoffs on the top plate
  // a part mounted on the car: placed at (x, z) on the car, lifted to y, turned rot quarter turns; it rides with the car
  const mount = (o, x, z, y, rot = 0, flip = false) => { o.props.onCar = { x, z, y, rot, ...(flip ? { flip: true } : {}) }; o.props.carId = car.id; setCompPos(o, sx + x, sz + z); return o; };
  const pk = { car };
  if (ctrl === 'arduino') {
    const board = mount(add('arduino', sx + 52, sz, 0), 52, 0, deck), sh = add(drv, sx + 52, sz, 0);
    if (drv === 'amsr3' && typeof amsr3Stack === 'function') amsr3Stack(sh, board); else stackShield(sh, board);
    pk.board = board; pk.drv = sh;
    if (drv === 'amsr3') {
      wire(car, 'FL+', sh, 'MA+', C4P_COL.red, 'Front left motor + (channel A, with rear left)'); wire(car, 'FL-', sh, 'MA-', C4P_COL.black, 'Front left motor −');
      wire(car, 'RL+', sh, 'MA+2', C4P_COL.red, 'Rear left motor + (the second wire in the A+ screw: in parallel on channel A)'); wire(car, 'RL-', sh, 'MA-2', C4P_COL.black, 'Rear left motor − (A− screw)');
      wire(car, 'FR+', sh, 'MB-', C4P_COL.red, 'Front right motor red to B− (mounted mirrored)'); wire(car, 'FR-', sh, 'MB+', C4P_COL.black, 'Front right motor black to B+');
      wire(car, 'RR+', sh, 'MB-2', C4P_COL.red, 'Rear right motor red to B− (the second wire in that screw: in parallel)'); wire(car, 'RR-', sh, 'MB+2', C4P_COL.black, 'Rear right motor black to B+');
      wire(car, 'B+', sh, 'PWR+', C4P_COL.red, 'Battery + (2S, 7.4 V) to the shield’s motor power Vin'); wire(car, 'B-', sh, 'PWR-', C4P_COL.black, 'Battery − to the shield’s GND');
    } else {
      const M = { FL: 1, RL: 2, RR: 3, FR: 4 };
      for (const m of ['FL', 'RL', 'RR', 'FR']) { const right = m[1] === 'R', k = M[m]; wire(car, m + '+', sh, `M${k}${right ? 'B' : 'A'}`, C4P_COL.red, `${CAR4_MN[m]} motor + to M${k}${right ? ' (wired the other way round: mirrored)' : ''}`); wire(car, m + '-', sh, `M${k}${right ? 'A' : 'B'}`, C4P_COL.black, `${CAR4_MN[m]} motor −`); }
      wire(car, 'B+', sh, 'EXT+', C4P_COL.red, 'Battery + (2S, 7.4 V) to EXT_PWR +'); wire(car, 'B-', sh, 'EXT-', C4P_COL.black, 'Battery − to EXT_PWR −');
    }
  } else if (ctrl === 'rbsbit') {
    const h = mount(add('rbsbitdrv', sx + 56, sz, 0), 56, 0, deck), bit = add('rbsbit', sx + 56, sz, 0); setDock(bit, h, true); const [dx, dz] = dockXZ(h); setCompPos(bit, dx, dz);
    pk.board = bit; pk.drv = h; bit.props.attached = true; bit.props.power = 'dock';
    const M = { FL: '1A', RL: '1B', FR: '2A', RR: '2B' };
    for (const m of ['FL', 'RL', 'FR', 'RR']) { const right = m[1] === 'R', ch = M[m]; wire(car, m + '+', h, ch + (right ? '-' : '+'), C4P_COL.red, `${CAR4_MN[m]} motor + to ${RBB_MOTOR_OF[ch]} (${ch})${right ? ', the other way round: mirrored' : ''}`); wire(car, m + '-', h, ch + (right ? '+' : '-'), C4P_COL.black, `${CAR4_MN[m]} motor −`); }
    wire(car, 'B+', h, 'VIN+', C4P_COL.red, 'Battery + (2P, 3.7 V) to VIN +'); wire(car, 'B-', h, 'VIN-', C4P_COL.black, 'Battery − to VIN −');
  } else {
    const e = mount(add('esp32', sx + 26, sz, 3), 26, 0, deck, 3), h = mount(add('hg7881', sx + 76, sz, 1), 76, 0, deck, 1); pk.board = e; pk.drv = h;
    const CH = { FL: 'A', RL: 'B', FR: 'C', RR: 'D' }, gpio = { A: [25, 26], B: [32, 33], C: [18, 19], D: [22, 23] };
    for (const m of ['FL', 'RL', 'FR', 'RR']) { const k = CH[m], right = m[1] === 'R'; wire(car, m + '+', h, `M${k}_${right ? 'OB' : 'OA'}`, C4P_COL.red, `${CAR4_MN[m]} motor + to motor ${k}${right ? ' (the other way round: mirrored)' : ''}`); wire(car, m + '-', h, `M${k}_${right ? 'OA' : 'OB'}`, C4P_COL.black, `${CAR4_MN[m]} motor −`); }
    for (const k of ['A', 'B', 'C', 'D']) [1, 2].forEach((i) => wire(e, ESP_GPIO[gpio[k][i - 1]], h, k + i, typeof HG_WIRE_COL !== 'undefined' ? HG_WIRE_COL[k][i - 1] : C4P_COL.yellow, `GPIO ${gpio[k][i - 1]} → ${k}${i} (motor ${k} ${i === 1 ? 'forward' : 'backward'} PWM)`));
    wire(e, 'GND', h, 'GND', C4P_COL.black, 'Common ground: ESP32 GND to the board’s GND');
    wire(car, 'B+', h, 'BAT+', C4P_COL.red, 'Battery + (2P, 3.7 V) to BAT+'); wire(car, 'B-', h, 'BAT-', C4P_COL.black, 'Battery − to BAT−');
  }
  // the sensors, mounted at the front of the car; power through the car's sensor power strip (one wire per pin)
  const Pn = C4P_PINS[ctrl], sens = (proj === 'line' && P.SENSORS === 2) ? ['lnL', 'lnR'] : J.sensors, S = car4Cfg(car, 'sensors');
  const pinId = (p) => (ctrl === 'esp32' ? ESP_GPIO[p] : typeof p === 'number' ? 'D' + p : p);
  const on = (pin) => (ctrl === 'arduino' && pk.drv && pk.drv.pinMap && pk.drv.pinMap[pin] ? pk.drv : pk.board);
  if (ctrl !== 'rbsbit' && sens.length) {
    const gp = ctrl === 'esp32' ? 'GND_2' : 'GND2';
    wire(on(Pn.vcc), Pn.vcc, car, 'V1', C4P_COL.red, `${Pn.vcc === '5V' ? '5 V' : '3.3 V'} to the car’s sensor power strip (V1)`); wire(on(gp), gp, car, 'G1', C4P_COL.black, 'GND to the sensor power strip (G1)');
  }
  sens.forEach((mt, i) => {
    const type = mt === 'us' ? 'ultrasonic' : mt.startsWith('ldr') ? 'ldra' : 'irline';
    if (!TYPES[type]) { W.push({ from: `${type} part`, to: '-', what: 'This sensor part is not in the lab yet', col: '#999', ok: false }); return; }
    const M0 = CAR4_MOUNTS[mt], mx = M0.x, mz = M0.down ? M0.z * S.lineSpacing : M0.z, my = mt === 'us' ? L.top + 3 : M0.down ? S.lineHeight + 2 : L.top;
    const s = mount(add(type, sx + mx, sz + mz, 0), mx, mz, my, 0, !!M0.down); s.props.carMount = mt; if (type === 'ldra') s.props.sens = 40;
    pk[mt] = s;
    const sig = type === 'ultrasonic' ? null : 'AO', pin = { ldrL: Pn.ldrL, ldrR: Pn.ldrR, lnL: Pn.irL, lnC: Pn.irC, lnR: Pn.irR }[mt];
    if (ctrl === 'rbsbit') {
      if (type === 'ultrasonic') { bkxCable(pk.drv, Pn.trig, s, 'TRIG', 'VCC', 'GND', C4P_COL.yellow); wire(pk.drv, Pn.echo, s, 'ECHO', C4P_COL.blue, `ECHO → ${Pn.echo}`); W.push({ from: `RBS bit Driver Expansion Board ${Pn.trig} (G V S)`, to: 'HC-SR04 GND VCC TRIG', what: 'Power (3.3 V) and TRIG through one 3-wire cable', col: C4P_COL.yellow, ok: true }); }
      else { bkxCable(pk.drv, pin, s, sig, 'VCC', 'GND', C4P_COL.yellow); W.push({ from: `RBS bit Driver Expansion Board ${pin} (G V S)`, to: `${c4pName(s)} GND VCC ${sig}`, what: `${CAR4_MOUNTS[mt].name}: a 3-wire cable, signal on ${pin}`, col: C4P_COL.yellow, ok: true }); }
    } else {
      wire(car, `V${i + 2}`, s, 'VCC', C4P_COL.red, `${c4pName(s)} power from the strip (V${i + 2})`); wire(car, `G${i + 2}`, s, 'GND', C4P_COL.black, `${c4pName(s)} ground from the strip (G${i + 2})`);
      if (type === 'ultrasonic') { wire(on(pinId(Pn.trig)), pinId(Pn.trig), s, 'TRIG', C4P_COL.yellow, `TRIG ← ${ctrl === 'esp32' ? 'GPIO ' : 'D'}${Pn.trig}`); wire(on(pinId(Pn.echo)), pinId(Pn.echo), s, 'ECHO', C4P_COL.blue, `ECHO → ${ctrl === 'esp32' ? 'GPIO ' : 'D'}${Pn.echo}`); }
      else wire(on(pinId(pin)), pinId(pin), s, sig, mt.endsWith('L') ? C4P_COL.green : mt.endsWith('R') ? C4P_COL.blue : C4P_COL.orange, `${CAR4_MOUNTS[mt].name}: AO → ${ctrl === 'esp32' ? 'GPIO ' + pin : pin}`);
    }
  });
  // the joystick project: the joystick module stays on the bench, in your hand's reach (the front-left corner), wired to the robot
  // like a tethered remote; its wires follow the robot as it drives
  if (proj === 'joystick' && TYPES.joystick) {
    const joy = add('joystick', -520, 290, 0); joy.props.x = 50; joy.props.y = 50; pk.joy = joy;
    const vName = ctrl === 'arduino' ? '5 V' : '3.3 V', pn = (p) => (ctrl === 'esp32' ? 'GPIO ' + p : typeof p === 'number' ? 'D' + p : p);
    if (ctrl === 'rbsbit') {
      bkxCable(pk.drv, Pn.joyX, joy, 'VRx', 'VCC', 'GND', C4P_COL.yellow);
      W.push({ from: `Expansion board ${Pn.joyX} (G V S)`, to: 'Joystick GND +5V VRx', what: 'Power (3.3 V) and VRx (left–right) through one 3-wire cable', col: C4P_COL.yellow, ok: true });
      wire(pk.drv, Pn.joyY, joy, 'VRy', C4P_COL.green, `VRy (forward–back) → ${Pn.joyY}`);
      wire(pk.drv, Pn.joySW, joy, 'SW', C4P_COL.blue, `SW (press) → ${Pn.joySW}; the program turns its pull-up on`);
    } else {
      const gp = ctrl === 'esp32' ? 'GND_2' : 'GND2';
      wire(on(Pn.vcc), Pn.vcc, car, 'V1', C4P_COL.red, `${vName} to the car’s power strip (V1)`); wire(on(gp), gp, car, 'G1', C4P_COL.black, 'GND to the power strip (G1)');
      wire(car, 'V2', joy, 'VCC', C4P_COL.red, `Joystick +5V pin from the strip (V2): ${vName}${ctrl === 'esp32' ? ', so VRx and VRy stay inside the ADC’s 0–3.3 V' : ''}`);
      wire(car, 'G2', joy, 'GND', C4P_COL.black, 'Joystick GND from the strip (G2)');
      wire(on(pinId(Pn.joyX)), pinId(Pn.joyX), joy, 'VRx', C4P_COL.green, `VRx (left–right) → ${pn(Pn.joyX)}`);
      wire(on(pinId(Pn.joyY)), pinId(Pn.joyY), joy, 'VRy', C4P_COL.blue, `VRy (forward–back) → ${pn(Pn.joyY)}`);
      wire(on(pinId(Pn.joySW)), pinId(Pn.joySW), joy, 'SW', C4P_COL.orange, `SW (press) → ${pn(Pn.joySW)} with INPUT_PULLUP`);
    }
  }
  car4SyncMounts(car);
  return { car, pk, W };
}
const c4pName = (c) => (c.type === 'breadboard' ? 'Breadboard' : c.type === 'car4wd' ? 'Car terminal block' : c.type === 'arduino' ? 'Arduino Uno' : c.type === 'amsr3' ? 'Motor Shield Rev3' : c.type === 'l293d' ? 'L293D shield' : c.type === 'rbsbitdrv' ? 'Expansion board' : c.type === 'rbsbit' ? 'RBS bit' : c.type === 'esp32' ? 'ESP32' : c.type === 'hg7881' ? 'HG7881' : c.type === 'ldra' ? 'LDR' : c.type === 'irline' ? 'IR line sensor' : c.type === 'ultrasonic' ? 'HC-SR04' : (TYPES[c.type] || {}).name || c.type);
// the table for a project: the same table, with the objects that project needs shown
function c4pTable(car, proj) {
  const E = car4Env(car), J = C4P_PROJ[proj], off = (x, z) => Math.abs(x) > PLANE.w / 2 - 20 || Math.abs(z) > PLANE.d / 2 - 20 || car4UnderLaptop(x, z);   // off the table, or under the laptop
  E.show = { ...J.show };
  if (!E.strokes.length || E.strokes.some((st) => st.pts.some(([x, z]) => off(x, z)))) { E.strokes = car4Preset('oval').strokes; E.shape = 'oval'; }
  if (!E.lights.length || E.lights.some((l) => off(l.x, l.z))) E.lights = car4Preset('light').lights;
  if (!E.obstacles.length || E.obstacles.some((o) => off(o.x, o.z))) E.obstacles = car4Preset('obstacles').obstacles;
  E.ambient = proj === 'light' ? 3 : 12;
  if (proj === 'light') { const l = E.lights[0]; l.on = true; if (!l.placed) Object.assign(l, { level: 90, x: 380, z: -140, y: 140, radius: 300, placed: true }); }
  E.ver = (E.ver || 1) + 1; delete car.state.trk; car4Reset(car);
}
function c4pLoad(ctrl, proj, drv, params, opts = {}) {
  ctrl = C4P_CTRL[ctrl] ? ctrl : 'arduino'; proj = C4P_PROJ[proj] ? proj : 'basic'; drv = C4P_CTRL[ctrl].drivers.includes(drv) ? drv : C4P_CTRL[ctrl].drivers[0];
  if (!TYPES[drv]) { const alt = C4P_CTRL[ctrl].drivers.find((k) => TYPES[k]); if (alt) { toast(`The ${C4P_DRV[drv].name} is not in this lab yet: using the ${C4P_DRV[alt].name}.`); drv = alt; } }
  const keepEnv = opts.env || (() => { const old = [...comps.values()].find((o) => o.type === 'car4wd'); return old && old.props.env ? JSON.parse(JSON.stringify(old.props.env)) : null; })();
  const P = { ...c4pDefaults(proj, ctrl), ...(params || {}) };
  const { car, W } = c4pBuild(ctrl, drv, proj, P);
  if (keepEnv) car.props.env = keepEnv;   // ONE table: what the student put on it stays
  if (opts.env) { car4Env(car).ver = (car4Env(car).ver || 1) + 1; delete car.state.trk; car4Reset(car); } else c4pTable(car, proj);
  car.props.proj = { ctrl, proj, drv, params: P, wiring: W.map(({ from, to, what, ok }) => ({ from, to, what, ok })) };
  // the program
  if (ctrl === 'rbsbit') { const { json, ts } = c4pBlocks(proj, P); car.props.proj.ts = ts; setTimeout(() => { bkxLoadBlocks(json); if (opts.code) c4pApplyCode(opts.code); }, 0); }
  else { setLang('cpp'); ta.value = opts.code || c4pCpp(ctrl, drv, proj, P); syncLang(); clearError(); renderEditor(); }
  changed(); renderLibrary($('#libSearch').value); save();
  if (typeof c4hudProject === 'function') c4hudProject(car);
  return car;
}
function c4pApplyCode(code) { if (typeof code === 'object' && code.blocks) bkxLoadBlocks(code); else if (typeof code === 'string') { ta.value = code; syncLang(); renderEditor(); } }
function c4pOf(car) { return car && car.props.proj; }
function c4pSet(car, k, v) {   // a property changed: rewrite the program's constant (and restart a running program)
  const pr = c4pOf(car); if (!pr) return; const p = C4P_PARAMS[pr.proj].find((q) => q.k === k); if (!p) return;
  v = p.type === 'choice' ? Number(v) : clamp(Number(v), p.min, p.max); if (!Number.isFinite(v)) return; pr.params[k] = v; save();
  if (p.rebuild) { const was = run.state !== 'stopped'; c4pLoad(pr.ctrl, pr.proj, pr.drv, pr.params); if (was) c4pRun(true); return; }
  const was = run.state !== 'stopped';
  if (pr.ctrl === 'rbsbit') { if (!c4pBlocksSet(k, v)) { const { json, ts } = c4pBlocks(pr.proj, pr.params); pr.ts = ts; bkxLoadBlocks(json); } else pr.ts = c4pBlocks(pr.proj, pr.params).ts; }
  else { const code = c4pCppSet(codeLang === 'cpp' ? ta.value : (codeBuf.cpp || ''), p, v); if (codeLang === 'cpp') { ta.value = code; syncLang(); renderEditor(); } else codeBuf.cpp = code; }
  if (was) { stopProgram(); setTimeout(() => c4pRun(true), 60); }
}
function c4pRun(start = true) {   // Start / Stop from the arena: the RBS bit gets its power from the expansion board, Serial input is cleared
  if (!start || run.state !== 'stopped') { stopProgram(); return; }
  run.rx = []; const bit = rbsbitComp && rbsbitComp();
  if (codeLang === 'blocks' && bit) { if (bit.dock != null) startProgram({ power: 'dock' }); else startProgram({ power: 'usb' }); }
  else startProgram();
}
function c4pSend(ch) { if (run.state !== 'running') { toast('Press Start first: the command goes to your running program.'); return false; } run.rx = run.rx || []; run.rx.push(ch.charCodeAt(0)); return true; }
function c4pPress(key) {   // presses a button on the RBS bit for a moment, as a finger would
  const bit = rbsbitComp && rbsbitComp(); if (!bit || run.state !== 'running') { toast('Press Start first.'); return; }
  bit.state.held = key; if (typeof pressComp === 'function') pressComp(bit, true); else bit.state.pressed = true;
  setTimeout(() => { if (typeof pressComp === 'function') pressComp(bit, false); else bit.state.pressed = false; }, 220);
}
// the wiring table, the components list
function c4pComponents(pr) {
  const D = C4P_DRV[pr.drv], C = C4P_CTRL[pr.ctrl], J = C4P_PROJ[pr.proj];
  const sensors = (pr.proj === 'line' && pr.params.SENSORS === 2 ? ['lnL', 'lnR'] : J.sensors).map((m) => (m === 'us' ? 'HC-SR04 ultrasonic sensor (front centre)' : m.startsWith('ldr') ? `LDR light sensor module, analog (${CAR4_MOUNTS[m].name.toLowerCase()})` : `IR line tracking sensor TCRT5000 (${CAR4_MOUNTS[m].name.toLowerCase()})`));
  if (pr.proj === 'joystick') sensors.push('Dual-axis joystick module (VRx, VRy, SW), on long jumper wires');
  return [CAR4.name + ': 4 TT gear motors, 4 wheels, 2 acrylic plates', `2 × 18650 cells in the holder, wired ${D.battery} (${D.battery === '2S' ? '7.4' : '3.7'} V nominal)`, C.full, D.name, ...sensors, 'Jumper wires'];
}
// a student's own versions, kept in this browser apart from the templates
const C4P_STORE = 'rbs-c4p-saves';
function c4pSaves() { try { return JSON.parse(localStorage.getItem(C4P_STORE) || '[]'); } catch { return []; } }
function c4pPutSaves(list) { try { localStorage.setItem(C4P_STORE, JSON.stringify(list)); return true; } catch { toast('This browser does not let the page store projects.'); return false; } }
function c4pSnapshot(car, name) {
  const pr = c4pOf(car); if (!pr) return null;
  const code = pr.ctrl === 'rbsbit' ? (() => { try { return window.Blockly.serialization.workspaces.save(blocksWs); } catch { return blocksJson; } })() : ta.value;
  return { name, t: Date.now(), ctrl: pr.ctrl, proj: pr.proj, drv: pr.drv, params: { ...pr.params }, env: JSON.parse(JSON.stringify(car4Env(car))), cfg: JSON.parse(JSON.stringify(car.props.cfg || {})), code };
}
function c4pOpenSnapshot(s) { const car = c4pLoad(s.ctrl, s.proj, s.drv, s.params, { env: s.env, code: s.code }); if (s.cfg) car.props.cfg = s.cfg; if (typeof c4hudProject === 'function') c4hudProject(car); save(); return car; }
