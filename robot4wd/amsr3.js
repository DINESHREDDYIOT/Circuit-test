/* ---- Arduino Motor Shield Rev3 section ----
   TYPES.amsr3: the Arduino Motor Shield Rev3, an L298P dual full bridge on an Uno-size shield. It stacks on the RBS Learning
   Board like the L293D Motor Shield (shield: true: a drop on the board sets c.stack; amsr3Stack() does the same from code) and
   passes every board pin through its stacking headers.
   Official pinout (Arduino): channel A = DIR D12, PWM D3, BRAKE D9, current sensing A0; channel B = DIR D13, PWM D11, BRAKE D8,
   current sensing A1. 1.65 V per A (3.3 V at 2 A). Up to 2 A a channel. The motor supply comes in on the Vin / GND screw terminal.
   Two channels only: a 4WD car runs both left motors in parallel on A and both right motors on B.
   Screw-terminal pins: MA+ MA− MB+ MB− (motor outputs) and PWR+ PWR− (motor supply; PWR− is GND). MA+2 … MB−2 are a second
   wire in the same screw terminal (the same contact), so two motors can share a channel without a breadboard.
   A white JST-XH adapter is clamped in each motor pair and in Vin/GND, as on the other shields (jstPorts).
   Source: robot4wd/amsr3.js. */

// ---- 1. the board as data (mm; layout positions in the Uno frame: x from the USB edge, z from the digital-header edge) ----
const AMSR3 = {
  name: 'Arduino Motor Shield Rev3', short: 'Motor Shield Rev3',
  pcb: 0x0b7f86, pcbHex: '#0b7f86',   // Arduino teal solder mask
  vih: 2.3,      // L298 input HIGH level (VIH min): a DIR, PWM or BRAKE pin above it reads HIGH
  vsMin: 4.8,    // the L298 needs Vs ≥ VIH + 2.5 V; below that the bridge doesn't run
  vsMax: 18,     // absolute limit at the Vin screw terminal (Arduino); 7–12 V recommended
  // Illustrative L298 saturation drop (source + sink transistors). The datasheet's VCEsat values grow with the current
  // (about 1.8 V min, 3.2 V max at 1 A, both transistors), so the output resistance below adds the current-dependent part.
  drop: 1.8,
  rout: 0.5,     // Ω in each output, so the motor loop (A+ to A−) sees about 1 Ω (illustrative)
  vPerA: 1.65,   // current sensing: 1.65 V per A (3.3 V at the 2 A maximum)
  snsMax: 3.5,   // the sense amplifier runs on 5 V: its output tops out near 3.5 V
  snsR: 100,     // Ω, the sense amplifier's output into A0 / A1 (illustrative)
  imax: 2,       // A per channel
  ch: {
    A: { dir: 'D12', pwm: 'D3', brk: 'D9', sns: 'A0', p: 'MA+', m: 'MA-', jumper: 'SNS0' },
    B: { dir: 'D13', pwm: 'D11', brk: 'D8', sns: 'A1', p: 'MB+', m: 'MB-', jumper: 'SNS1' },
  },
};
const AMSR3_K = ['A', 'B'];
const AMSR3_L = {
  holes: MOUNT.map(([x, z]) => [x, z, 1.6]),
  term: { x: 4.6, motor: 20.0, power: 38.5 },   // the two blue screw terminals on the left edge, wire holes facing out
  screws: { 'MA+': 12.38, 'MA-': 17.46, 'MB+': 22.54, 'MB-': 27.62, 'PWR+': 35.96, 'PWR-': 41.04 },
  pairs: { A: 14.92, B: 25.08, P: 38.5 },        // the middle of each screw pair: a JST-XH adapter is clamped in each
  l298: [30.0, 26.0], lm358: [51.0, 37.0], logic: [49.5, 15.0],
  diodes: [[22.5, 14.0], [27.5, 14.0], [32.5, 14.0], [37.5, 14.0], [22.5, 38.8], [27.5, 38.8], [32.5, 38.8], [37.5, 38.8]],
  sense: [[42.0, 26.0], [45.6, 26.0]],          // 0.15 Ω current-sense resistors (2512)
  cap: [17.5, 41.0],
  ledX: 13.4, leds: [['A+', 12.38, 0xffc93a], ['A-', 17.46, 0x3a8dff], ['B+', 22.54, 0xffc93a], ['B-', 27.62, 0x3a8dff]],
  smd: [[16.4, 12.38, 'res', false], [16.4, 17.46, 'res', false], [16.4, 22.54, 'res', false], [16.4, 27.62, 'res', false],
    [55.0, 34.2, 'res', false], [55.0, 36.2, 'res', false], [55.0, 38.2, 'res', false], [55.0, 40.2, 'res', false],
    [40.6, 20.4, 'cap', true], [40.6, 31.8, 'cap', true], [49.5, 19.9, 'cap', false], [44.2, 9.6, 'res', true], [55.0, 9.6, 'res', true], [12.2, 35.2, 'cap', true]],
  // TinkerKit connectors: inputs IN2 / IN3 (white, A2 / A3), outputs OUT5 / OUT6 (orange, D5 / D6), two 4-pin TWI (white)
  tk: [{ id: 'IN2', n: 3, x: 60.5, z: 16.2, orange: false, alongZ: true }, { id: 'IN3', n: 3, x: 60.5, z: 25.2, orange: false, alongZ: true },
    { id: 'OUT5', n: 3, x: 60.5, z: 34.2, orange: true, alongZ: true }, { id: 'OUT6', n: 3, x: 60.5, z: 43.2, orange: true, alongZ: true },
    { id: 'TWI', n: 4, x: 33.0, z: 45.0, orange: false, alongZ: false }, { id: 'TWI', n: 4, x: 44.5, z: 45.0, orange: false, alongZ: false }],
  jumpers: [['Vin Connect', 12.4, 31.6], ['BRAKE A', 38.2, 8.2], ['BRAKE B', 43.4, 8.2], ['SNS0', 49.0, 44.6], ['SNS1', 56.2, 44.6]],
};
// copper under the mask (Uno mm): [width, points]
const AMSR3_TRACES = [
  [1.2, [[8.4, 12.38], [19.0, 12.38], [23.0, 16.4], [24.3, 18.9]]], [1.2, [[8.4, 17.46], [17.4, 17.46], [20.5, 20.6], [22.0, 20.6]]],
  [1.2, [[8.4, 22.54], [17.0, 22.54], [20.0, 25.5], [22.0, 25.5]]], [1.2, [[8.4, 27.62], [17.0, 27.62], [20.5, 31.0], [24.3, 33.1]]],
  [1.8, [[8.4, 35.96], [24.0, 35.96], [27.0, 33.4]]], [1.8, [[8.4, 41.04], [13.0, 41.04]]],
  [0.3, [[31.5, 3.8], [31.5, 9.0], [44.6, 9.0], [46.0, 11.2]]], [0.3, [[28.96, 3.8], [28.96, 9.8], [43.4, 9.8], [45.0, 11.6]]],
  [0.3, [[39.12, 3.8], [39.12, 8.2], [47.0, 8.2], [48.2, 11.2]]], [0.3, [[41.66, 3.8], [41.66, 7.4], [49.5, 7.4], [50.4, 11.2]]],
  [0.3, [[58.42, 3.8], [56.0, 9.0], [56.0, 19.5], [40.0, 19.5], [38.5, 21.0]]], [0.3, [[34.04, 3.8], [34.04, 10.4], [39.8, 10.4], [39.8, 17.2], [36.6, 19.2]]],
  [0.3, [[45.6, 18.6], [45.6, 21.0], [39.0, 21.8]]], [0.3, [[53.4, 18.6], [53.4, 22.0], [39.0, 30.2]]],
  [0.6, [[45.6, 29.4], [45.6, 33.0], [49.0, 34.2]]], [0.6, [[42.0, 29.4], [42.0, 32.6], [48.4, 33.6]]],
  [0.3, [[50.8, 49.5], [50.8, 44.5], [49.6, 40.2]]], [0.3, [[53.34, 49.5], [53.34, 44.5], [52.4, 40.2]]],
  [0.3, [[55.88, 49.5], [56.6, 46.5], [57.2, 20.0], [58.6, 16.2]]], [0.3, [[58.42, 49.5], [57.6, 30.0], [58.6, 25.2]]],
];
const AMSR3_HDR = new Set(UNO_HEADERS.flatMap(([names]) => names));
const amsr3Node = (n) => (/^GND/.test(n) ? 'GND' : n === 'SDA' ? 'A4' : n === 'SCL' ? 'A5' : n);   // a stacking-header pin → the board's own node
const AMSR3_USE = {
  D12: ['DIR A', 'Motor A direction: HIGH drives A+ positive, LOW drives A− positive'],
  D3: ['PWM A', 'Motor A speed: analogWrite(3, 0–255) sets the duty. 0 switches channel A off and the motor coasts'],
  D9: ['BRAKE A', 'Motor A brake: HIGH puts A+ and A− at the same voltage, so the motor is shorted and stops fast'],
  A0: ['SNS0', 'Motor A current sensing: 1.65 V per A (3.3 V at 2 A); read it with analogRead(A0). The shield drives this pin'],
  D13: ['DIR B', 'Motor B direction: HIGH drives B+ positive, LOW drives B− positive (the board’s L LED follows it)'],
  D11: ['PWM B', 'Motor B speed: analogWrite(11, 0–255) sets the duty. 0 switches channel B off and the motor coasts'],
  D8: ['BRAKE B', 'Motor B brake: HIGH puts B+ and B− at the same voltage, so the motor is shorted and stops fast'],
  A1: ['SNS1', 'Motor B current sensing: 1.65 V per A (3.3 V at 2 A); read it with analogRead(A1). The shield drives this pin'],
  A2: ['IN2', 'Also on the white TinkerKit connector IN2'], A3: ['IN3', 'Also on the white TinkerKit connector IN3'],
  D5: ['OUT5', 'Also on the orange TinkerKit connector OUT5'], D6: ['OUT6', 'Also on the orange TinkerKit connector OUT6'],
  SDA: ['TWI', 'Also on the TinkerKit TWI connectors'], SCL: ['TWI', 'Also on the TinkerKit TWI connectors'],
};
function amsr3HdrPin(id, x, y, z) {
  if (id === 'NC') return { id, name: 'NC', desc: 'Not connected: this socket is empty inside, as on the board', x, y, z };
  let base;
  if (/^D\d+$/.test(id)) { const n = +id.slice(1); base = `Pin ${n}${PWM.has(n) ? ' (~PWM)' : ''}`; }
  else if (/^A\d$/.test(id)) base = id;
  else if (/^GND/.test(id)) base = 'GND';
  else base = (PIN_INFO[id] || [id])[0];
  const use = AMSR3_USE[id];
  return { id, name: use ? `${base} · ${use[0]}` : base, desc: use ? `${use[1]}. The board’s ${base}, passed through the stacking header` : `The board’s ${base}, passed through the stacking header`, x, y, z };
}
const AMSR3_TERM_PIN = {
  'MA+': ['A+ (motor A)', 'Motor A output +: DIR A (pin 12) HIGH makes it the positive side. One motor, or the two left motors of a 4WD car in parallel (A+ 2nd wire takes the second). A JST-XH adapter is clamped in A+ and A−: a motor’s JST plug pushes in'],
  'MA-': ['A− (motor A)', 'Motor A output −: DIR A (pin 12) LOW makes it the positive side'],
  'MB+': ['B+ (motor B)', 'Motor B output +: DIR B (pin 13) HIGH makes it the positive side. One motor, or the two right motors of a 4WD car in parallel (B+ 2nd wire takes the second). A JST-XH adapter is clamped in B+ and B−'],
  'MB-': ['B− (motor B)', 'Motor B output −: DIR B (pin 13) LOW makes it the positive side'],
  'PWR+': ['Vin (motor power +)', 'Motor supply + on the Vin screw terminal: 7–12 V is best. The L298P needs 4.8 V or more; 18 V is the absolute maximum. Up to 2 A a channel. (On a real shield this also feeds the board’s VIN through the Vin Connect jumper; the lab’s board stays on USB power.)'],
  'PWR-': ['GND (motor power −)', 'Motor supply −: the shield’s GND, the same as the board’s GND through the stacking header'],
};
const AMSR3_TERMS = ['PWR+', 'PWR-', 'MA+', 'MA-', 'MB+', 'MB-', 'MA+2', 'MA-2', 'MB+2', 'MB-2'];
const AMSR3_NOTE = 'Two channels only: on a 4WD car both left motors run in parallel on A and both right motors on B. Vout ≈ Vin − 1.8 V (an illustrative L298P drop) less about 1 Ω × the current. 2 A a channel; 1.65 V per A on A0 and A1.';

// ---- 2. the model: teal Uno-size shield, L298P (PowerSO-20) in the middle, blue screw terminals, stacking headers, TinkerKit ----
// Sizes, the outline, the stacking headers and the connectors follow the Rev3's documentation. Where the small parts sit (logic
// chip, LM358, diodes, 0.15 Ω sense resistors, direction LEDs) and the terminal order are illustrative, not measured from a board.
function amsr3TopTex() {
  return cached('amsr3:top', () => {
    const S = 26, W = UNO_W, D = UNO_D, L = AMSR3_L, { c, g } = makeCanvas(W * S, D * S);
    g.fillStyle = AMSR3.pcbHex; g.fillRect(0, 0, W * S, D * S);
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.06; g.drawImage(NOISE, 0, 0, W * S, D * S); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.save(); g.scale(S, S); g.lineCap = 'round'; g.lineJoin = 'round';
    // copper under the solder mask: a shade lighter than the mask
    g.strokeStyle = 'rgba(150, 236, 232, 0.17)';
    for (const [w, pts] of AMSR3_TRACES) { g.lineWidth = w; g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(x, z) : g.moveTo(x, z))); g.stroke(); }
    // tinned pads under the chips' feet, the diodes' tabs and the LEDs
    g.fillStyle = '#c9ccd1';
    const pad = (x, z, w, d) => g.fillRect(x - w / 2, z - d / 2, w, d);
    for (let i = 0; i < 10; i++) for (const s of [-1, 1]) pad(L.l298[0] + (i - 4.5) * 1.27, L.l298[1] + s * 6.85, 0.7, 1.5);
    for (const [[x, z], n] of [[L.lm358, 8], [L.logic, 14]]) for (let i = 0; i < n / 2; i++) for (const s of [-1, 1]) pad(x + (i - (n / 2 - 1) / 2) * 1.27, z + s * 2.75, 0.62, 1.3);
    for (const [x, z] of L.diodes) for (const s of [-1, 1]) pad(x, z + s * 2.25, 1.8, 1.5);
    for (const [, z] of L.leds) for (const s of [-1, 1]) pad(L.ledX + s * 0.65, z, 0.55, 0.95);
    // mounting holes: tinned rings (cut through below)
    for (const [x, z, r] of L.holes) { g.fillStyle = '#c3c6cb'; g.beginPath(); g.arc(x, z, r + 0.9, 0, Math.PI * 2); g.fill(); }
    // white silkscreen outlines
    g.strokeStyle = 'rgba(244, 248, 248, 0.92)'; g.lineWidth = 0.2;
    const box = (x, z, w, d) => g.strokeRect(x - w / 2, z - d / 2, w, d);
    box(L.term.x, L.term.motor, 8.0, 20.9); box(L.term.x, L.term.power, 8.0, 10.6);
    box(L.l298[0], L.l298[1], 17.2, 12.6); g.fillStyle = 'rgba(244,248,248,.92)'; g.beginPath(); g.arc(L.l298[0] - 8.0, L.l298[1] + 7.3, 0.35, 0, Math.PI * 2); g.fill();
    box(L.lm358[0], L.lm358[1], 5.6, 4.6); box(L.logic[0], L.logic[1], 9.4, 4.6);
    for (const [x, z] of L.diodes) { box(x, z, 3.1, 5.0); g.beginPath(); g.moveTo(x - 1.55, z - 1.6); g.lineTo(x + 1.55, z - 1.6); g.stroke(); }
    for (const [x, z] of L.sense) box(x, z, 3.9, 7.2);
    for (const [, z] of L.leds) box(L.ledX, z, 2.3, 1.4);
    for (const t of L.tk) { const len = 2.0 * (t.n - 1) + 4.6; if (t.alongZ) box(t.x, t.z, 5.0, len); else box(t.x, t.z, len, 5.0); }
    g.beginPath(); g.arc(L.cap[0], L.cap[1], 3.45, 0, Math.PI * 2); g.stroke();
    g.restore();
    // the print
    const T = (t, x, z, size, o = {}) => drawText(g, S, t, x, z, size, { color: '#f3f7f7', weight: 700, ...o });
    const up = -Math.PI / 2;
    [['A+', 'MA+'], ['A−', 'MA-'], ['B+', 'MB+'], ['B−', 'MB-'], ['Vin', 'PWR+'], ['GND', 'PWR-']].forEach(([t, id]) => T(t, 10.45, L.screws[id], t.length > 2 ? 1.05 : 1.3, { weight: 800 }));
    // the digital pins' numbers, then what the shield uses them for
    const fn = { D13: 'DIR B', D12: 'DIR A', D11: 'PWM B', D9: 'BRAKE A', D8: 'BRAKE B', D3: 'PWM A' };
    for (const [names, x0, z] of UNO_HEADERS.slice(0, 2)) names.forEach((n, i) => {
      if (n === 'SCL' || n === 'SDA') return; const x = x0 + i * P;
      T(n === 'GND1' ? 'GND' : n === 'AREF' ? 'AREF' : (PWM.has(+n.slice(1)) ? '~' : '') + n.slice(1), x, z + 1.6, 0.95, { rot: up, align: 'right', weight: 800 });
      if (fn[n]) T(fn[n], x, z + 4.05, 0.95, { rot: up, align: 'right', weight: 800 });
    });
    T('SNS0', 50.8, 48.9, 0.95, { rot: up, align: 'left', weight: 800 }); T('SNS1', 53.34, 48.9, 0.95, { rot: up, align: 'left', weight: 800 });
    for (const t of L.tk) if (t.alongZ) T(t.id, t.x - 3.6, t.z, 0.9, { rot: up, weight: 800 }); else T('TWI', t.x, t.z - 3.25, 0.9, { weight: 800 });
    T('IC1', L.l298[0] - 10.3, L.l298[1], 1.0, { rot: up }); T('IC2', L.lm358[0] - 3.9, L.lm358[1], 0.9, { rot: up }); T('IC3', L.logic[0] - 5.7, L.logic[1], 0.9, { rot: up });
    T('RS1', L.sense[0][0], L.sense[0][1] - 4.6, 0.85); T('RS2', L.sense[1][0], L.sense[1][1] - 4.6, 0.85); T('C1', L.cap[0], L.cap[1] - 4.4, 0.9); T('+', L.cap[0] - 2.2, L.cap[1] - 2.4, 1.1, { weight: 800 });
    T('MOTOR SHIELD Rev3', 13.6, 45.9, 2.0, { weight: 800, spacing: 0.04 });
    T('L298P dual full bridge · 2 A a channel', 13.6, 47.65, 0.85, { weight: 600 });
    // trim to the board outline and open the mounting holes
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-out';
    const o = new Path2D(); o.rect(0, 0, W * S, D * S); UNO_OUTLINE.forEach(([x, z], i) => (i ? o.lineTo(x * S, z * S) : o.moveTo(x * S, z * S))); o.closePath(); g.fill(o, 'evenodd');
    for (const [x, z, r] of L.holes) { g.beginPath(); g.arc(x * S, z * S, r * S, 0, Math.PI * 2); g.fill(); }
    g.restore();
    return canvasTex(c);
  });
}
// underneath, drawn as seen with the shield turned over: pads of every through-hole part, and the cut-to-free solder jumpers
function amsr3UnderTex() {
  return cached('amsr3:under', () => {
    const S = 24, W = UNO_W, D = UNO_D, L = AMSR3_L, mx = (x) => W - x, { c, g } = makeCanvas(W * S, D * S);
    g.fillStyle = AMSR3.pcbHex; g.fillRect(0, 0, W * S, D * S);
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.07; g.drawImage(NOISE, 0, 0, W * S, D * S); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.save(); g.scale(S, S); g.lineCap = 'round';
    g.strokeStyle = 'rgba(150, 236, 232, 0.14)'; g.lineWidth = 1.6;
    for (const uz of [12.38, 17.46, 22.54, 27.62]) { g.beginPath(); g.moveTo(mx(L.term.x), uz); g.lineTo(mx(20), uz); g.stroke(); }
    const pad = (x, z, r) => {
      const X = mx(x), gr = g.createRadialGradient(X - r * 0.3, z - r * 0.3, r * 0.1, X, z, r);
      gr.addColorStop(0, '#f2f3f5'); gr.addColorStop(0.6, '#c3c6cb'); gr.addColorStop(1, '#8e9298'); g.fillStyle = gr;
      g.beginPath(); g.arc(X, z, r, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(70,72,78,.55)'; g.beginPath(); g.arc(X, z, r * 0.3, 0, Math.PI * 2); g.fill();
    };
    for (const [names, x0, z] of UNO_HEADERS) names.forEach((_, i) => pad(x0 + i * P, z, 0.95));
    for (const uz of Object.values(L.screws)) pad(L.term.x, uz, 1.3);
    for (const t of L.tk) for (let i = 0; i < t.n; i++) { const o = (i - (t.n - 1) / 2) * 2.0; pad(t.x + (t.alongZ ? 0 : o), t.z + (t.alongZ ? o : 0), 0.62); }
    for (const s of [-1, 1]) pad(L.cap[0] + s * 1.25, L.cap[1], 0.7);
    for (const [x, z, r] of L.holes) { g.fillStyle = '#c0c0c0'; g.beginPath(); g.arc(mx(x), z, r + 0.9, 0, Math.PI * 2); g.fill(); }
    // solder jumpers: two half pads joined by a thin trace (cut the trace to free the pin, or to split Vin from the board)
    for (const [, x, z] of L.jumpers) {
      g.fillStyle = '#c9ccd1'; for (const s of [-1, 1]) { g.beginPath(); g.arc(mx(x) + s * 0.75, z, 0.65, s > 0 ? -Math.PI / 2 : Math.PI / 2, s > 0 ? Math.PI / 2 : Math.PI * 1.5); g.fill(); }
      g.fillRect(mx(x) - 0.75, z - 0.15, 1.5, 0.3);
    }
    g.restore();
    for (const [t, x, z] of L.jumpers) drawText(g, S, t, mx(x), z + 1.6, 0.85, { color: '#f3f7f7', weight: 800 });
    drawText(g, S, 'MOTOR SHIELD Rev3', mx(34), 26.0, 1.8, { color: '#f3f7f7', weight: 800 });
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-out';
    const o = new Path2D(); o.rect(0, 0, W * S, D * S); UNO_OUTLINE.forEach(([x, z], i) => (i ? o.lineTo(mx(x) * S, z * S) : o.moveTo(mx(x) * S, z * S))); o.closePath(); g.fill(o, 'evenodd');
    for (const [x, z, r] of L.holes) { g.beginPath(); g.arc(mx(x) * S, z * S, r * S, 0, Math.PI * 2); g.fill(); }
    g.restore();
    return canvasTex(c);
  });
}
// the L298P in its PowerSO-20 package: 15.9 × 11 mm, ten gull-wing leads a side at 1.27 mm, the heat slug soldered underneath
function amsr3PowerSO(parent, x, top, z) {
  const g = new THREE.Group(); g.position.set(x, top, z); parent.add(g);
  aoPad(g, 0, 0, 0, 16.4, 14.4, 0.42);
  mesh(rbox(15.9, 3.3, 11.0, 0.3), M.chip, g, 0, 0.12 + 1.65, 0);
  for (let i = 0; i < 10; i++) for (const sd of [-1, 1]) mesh(gullLeg(sd), M.tin, g, (i - 4.5) * 1.27, 0, sd * 5.5, false, false).scale.set(1, 1.2, 1.55);
  mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 18), cached('chipDot', () => new THREE.MeshStandardMaterial({ color: 0x55565c, roughness: 0.6 })), g, -6.6, 3.45, 3.8, false, false);
  piMark(g, 0.4, 3.44, -0.3, 12.5, 7.0, [['L298P', 2.0, 700], ['MAR 248', 0.95, 500]], '#c4c1cb');
}
// an SO-8 / SO-14 chip with its marking
function amsr3Soic(parent, x, top, z, n, label) {
  const k = n / 2, L = k * 1.27 - 0.24, g = new THREE.Group(); g.position.set(x, top, z); parent.add(g);
  aoPad(g, 0, 0, 0, L, 5.6, 0.38);
  mesh(rbox(L, 1.5, 3.9, 0.15), M.chip, g, 0, 0.85, 0);
  for (let i = 0; i < k; i++) for (const sd of [-1, 1]) mesh(gullLeg(sd), M.tin, g, (i - (k - 1) / 2) * 1.27, 0, sd * 1.95, false, false);
  mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 16), cached('chipDot', () => new THREE.MeshStandardMaterial({ color: 0x55565c, roughness: 0.6 })), g, -L / 2 + 0.7, 1.61, 1.05, false, false);
  piMark(g, 0.35, 1.61, -0.2, L - 1.3, 2.6, [[label, 1.0, 700]], '#c4c1cb');
}
// an SMA (DO-214AC) flyback diode along z, its grey cathode band toward −z
function amsr3Sma(parent, x, top, z) {
  const g = new THREE.Group(); g.position.set(x, top, z); parent.add(g);
  aoPad(g, 0, 0, 0, 2.6, 4.4, 0.34);
  mesh(rbox(2.6, 2.1, 3.7, 0.25), M.chip, g, 0, 0.1 + 1.05, 0);
  mesh(new THREE.BoxGeometry(2.62, 0.05, 0.6), cached('amsr3Band', () => new THREE.MeshStandardMaterial({ color: 0xb9bcc2, roughness: 0.5 })), g, 0, 2.18, -1.2, false, false);
  for (const s of [-1, 1]) mesh(cached('amsr3SmaTab', () => rbox(1.5, 0.28, 1.2, 0.06)), M.tin, g, 0, 0.14, s * 2.25, false, false);
}
// a TinkerKit connector: a small shrouded vertical header, 2.0 mm pitch, white (inputs, TWI) or orange (outputs)
function amsr3Tk(parent, x, top, z, n, orange, alongZ) {
  const g = new THREE.Group(); g.position.set(x, top, z); if (alongZ) g.rotation.y = Math.PI / 2; parent.add(g);
  const mat = orange ? cached('amsr3TkOrange', () => new THREE.MeshPhysicalMaterial({ color: 0xf0861c, roughness: 0.5, roughnessMap: ROUGH_PLASTIC, clearcoat: 0.1 })) : jstM('nylon');
  const pitch = 2.0, Lx = pitch * (n - 1) + 4.0, Dz = 4.6, H = 5.6, w = 0.55;
  aoPad(g, 0, 0, 0, Lx, Dz, 0.42);
  mesh(rbox(Lx, 0.9, Dz, 0.15), mat, g, 0, 0.45, 0);                                          // floor
  mesh(rbox(Lx, H, w, 0.12), mat, g, 0, H / 2, Dz / 2 - w / 2);                                 // back wall
  for (const s of [-1, 1]) mesh(rbox(w, H, Dz, 0.12), mat, g, s * (Lx / 2 - w / 2), H / 2, 0);    // end walls
  mesh(rbox(Lx, H - 2.4, w, 0.12), mat, g, 0, (H - 2.4) / 2, -Dz / 2 + w / 2);                  // front wall, low: the latch window above it
  for (let i = 0; i < n; i++) mesh(cached('amsr3TkPin', () => rbox(0.5, H - 1.3, 0.5, 0.1)), M.gold, g, (i - (n - 1) / 2) * pitch, (H - 1.3) / 2 + 0.5, 0.2, false, false);
}
function buildAmsr3(c) {
  const g = new THREE.Group(), L = AMSR3_L, top = PCB_T, X = (ux) => ux - UNO_W / 2, Z = (uz) => uz - UNO_D / 2;
  // the board: the Uno outline with its four mounting holes, a teal mask and white print on top, pads and jumpers underneath
  const slab = cached('amsr3SlabGeo', () => {
    const s = new THREE.Shape(); UNO_OUTLINE.forEach(([x, z], i) => (i ? s.lineTo(X(x), -Z(z)) : s.moveTo(X(x), -Z(z)))); s.closePath();
    for (const [x, z, r] of L.holes) { const h = new THREE.Path(); h.absarc(X(x), -Z(z), r, 0, Math.PI * 2, true); s.holes.push(h); }
    const q = new THREE.ExtrudeGeometry(s, { depth: PCB_T, bevelEnabled: false, curveSegments: 20 }); q.rotateX(-Math.PI / 2); return q;
  });
  mesh(slab, cached('amsr3SlabMat', () => [new THREE.MeshPhysicalMaterial({ color: AMSR3.pcb, roughness: 0.55, clearcoat: PCB_COAT }), FR4(AMSR3.pcb)]), g, 0, 0, 0);
  const tex = amsr3TopTex();
  mesh(cached('amsr3TopGeo', () => { const q = new THREE.PlaneGeometry(UNO_W, UNO_D); q.rotateX(-Math.PI / 2); return q; }),
    cached('amsr3TopMat', () => new THREE.MeshPhysicalMaterial({ map: tex, bumpMap: silkBump(tex), bumpScale: 0.7, roughness: 0.6, roughnessMap: ROUGH_FINE, clearcoat: PCB_COAT, clearcoatRoughness: 0.32, transparent: true, alphaTest: 0.5 })), g, 0, top + 0.01, 0, false, false);
  mesh(cached('amsr3UnderGeo', () => { const q = new THREE.PlaneGeometry(UNO_W, UNO_D); q.rotateX(Math.PI / 2); q.rotateY(Math.PI); return q; }),
    cached('amsr3UnderMat', () => new THREE.MeshStandardMaterial({ map: amsr3UnderTex(), roughness: 0.7, metalness: 0.1, alphaTest: 0.5 })), g, 0, -0.02, 0, false, false);
  // stacking headers: female sockets on top give the board's pins back; their long pins go down into the board's own headers
  const leg = cached('amsr3Leg', () => new THREE.BoxGeometry(0.64, SHIELD_LEG, 0.64)), joints = [];
  for (const [names, x0, z] of UNO_HEADERS) {
    femaleRow(g, X(x0), Z(z), names.length, top);
    names.forEach((_, i) => { mesh(leg, M.gold, g, X(x0 + i * P), -SHIELD_LEG / 2, Z(z), false, false); joints.push([X(x0 + i * P), Z(z), 0.85]); });
  }
  solderJoints(g, joints, 0, { flip: true });
  // blue screw terminals on the left edge (A+ A− B+ B−, then Vin GND), wire holes facing out; a white JST-XH adapter in each pair
  const tx = X(L.term.x);
  screwTerminal(g, tx, top, Z(L.term.motor), 4);
  const screwTop = screwTerminal(g, tx, top, Z(L.term.power), 2);
  for (const k of ['A', 'B', 'P']) jstAdapter(g, tx - 3.8, top + 3, Z(L.pairs[k]), Math.PI / 2, 2.54);
  solderJoints(g, Object.values(L.screws).map((uz) => [tx, Z(uz), 1.2]), 0, { flip: true, stub: 1.4, lead: 0.45 });
  // the L298P near the middle, its eight flyback diodes, the current-sense resistors, the LM358 sense amplifier, the brake/direction logic
  amsr3PowerSO(g, X(L.l298[0]), top, Z(L.l298[1]));
  for (const [x, z] of L.diodes) amsr3Sma(g, X(x), top, Z(z));
  for (const [x, z] of L.sense) { smdChip(g, X(x), top, Z(z), 'res', true, 6.35, 3.2); piMark(g, X(x), top + 0.81, Z(z), 5.0, 2.4, [['R150', 1.3, 700]], '#e8e8ea', Math.PI / 2); }
  amsr3Soic(g, X(L.lm358[0]), top, Z(L.lm358[1]), 8, 'LM358');
  amsr3Soic(g, X(L.logic[0]), top, Z(L.logic[1]), 14, '74HC00');
  for (const [x, z, kind, alongZ] of L.smd) smdChip(g, X(x), top, Z(z), kind, alongZ, 1.6, 0.8);
  elecCap(g, X(L.cap[0]), top, Z(L.cap[1]), 3.15, 5.8);
  // direction LEDs beside the motor terminals: yellow while k+ is driven positive, blue while k− is
  c.leds = {};
  for (const [id, uz, col] of L.leds) c.leds[id] = smdLedM(g, X(L.ledX), top, Z(uz), col);
  // TinkerKit connectors
  for (const t of L.tk) amsr3Tk(g, X(t.x), top, Z(t.z), t.n, t.orange, t.alongZ);
  solderJoints(g, L.tk.flatMap((t) => Array.from({ length: t.n }, (_, i) => { const o = (i - (t.n - 1) / 2) * 2.0; return [X(t.x + (t.alongZ ? 0 : o)), Z(t.z + (t.alongZ ? o : 0)), 0.6]; })), 0, { flip: true });
  // pins: the stacking header (where a jumper plugs in), the back of the JST plug in each terminal pair, and a second wire on each motor screw
  const pins = [];
  for (const [names, x0, z] of UNO_HEADERS) names.forEach((id, i) => pins.push(amsr3HdrPin(id, X(x0 + i * P), top + HDR_H, Z(z))));
  const jo = 3.8 + 8.6;   // from the terminal's middle to the back of a plug in its adapter
  for (const [id, k, s] of [['MA+', 'A', -1], ['MA-', 'A', 1], ['MB+', 'B', -1], ['MB-', 'B', 1], ['PWR+', 'P', -1], ['PWR-', 'P', 1]]) {
    const [name, desc] = AMSR3_TERM_PIN[id]; pins.push({ id, name, desc, x: tx - jo, y: top + 3, z: Z(L.pairs[k] + s * 1.25) });
  }
  for (const id of ['MA+', 'MA-', 'MB+', 'MB-']) pins.push({ id: id + '2', name: `${AMSR3_TERM_PIN[id][0].split(' ')[0]} (2nd wire)`, desc: `A second wire in the ${id.slice(1).replace('-', '−')} screw terminal: the same contact as ${id.slice(1).replace('-', '−')}, for a second motor in parallel`, x: tx + 0.6, y: screwTop, z: Z(L.screws[id]) });
  c.pins = pins;
  c.height = top + 10.5;
  return g;
}

// ---- 3. in the lab: the pins it reads, the bridge, current sensing, the motor supply's load ----
// The solver does not average PWM: a pin with analogWrite(pin, v > 0) sits at a steady 5 V, and the duty is kept apart (pins.pwm;
// dutyOf() for LED brightness, hgDutyAt() for the HG7881). So, like the HG7881, a channel's duty is the PWM pin's logic level × its
// duty: d = the PWM pin's average voltage / 5 V on the 5 V Learning Board.
function amsr3Duty(node) {
  if (typeof hgDutyAt === 'function') return hgDutyAt(node);   // HG7881 + ESP32 section: Learning Board, ESP32 and Pi PWM
  if (run.state === 'running') for (let n = 0; n < 20; n++) if (pins.mode[n] === 'OUTPUT' && pins.pwm[n] !== null && sameNet(node, ardNode(n))) return clamp(pins.pwm[n] / 255, 0, 1);
  return 1;
}
// a channel's output current from the last solve: abs = the larger of its two terminals (A+ out, A− back in); fwd > 0 = out of k+
function amsr3OutI(c, k) {
  if (!sol) return { abs: 0, fwd: 0 };
  const p = sol.src.get(`${c.id}:o${k}p`) || 0, m = sol.src.get(`${c.id}:o${k}m`) || 0;
  return { abs: Math.max(Math.abs(p), Math.abs(m)), fwd: (p - m) / 2 };
}
// the loads wired across a channel (k+ to k−), each with its current: two motors in parallel is the 4WD car's paired mode
function amsr3Loads(c, k) {
  if (!sol) return [];
  const C = AMSR3.ch[k], na = pinNode(c, C.p), nb = pinNode(c, C.m), out = [];
  for (const e of sol.els) {
    if (!e.pa || e.pa[0] === c.id) continue;   // wires have no pa; skip the shield's own elements
    if (!((sameNet(e.a, na) && sameNet(e.b, nb)) || (sameNet(e.a, nb) && sameNet(e.b, na)))) continue;
    const o = comps.get(e.pa[0]); if (!o) continue;
    const tag = e.id.slice(e.id.indexOf(':') + 1), car = o.type === 'car4wd' && /^(FL|FR|RL|RR)$/.test(tag);
    const motor = car || !!(typeof HG_LOAD === 'object' && HG_LOAD[o.type]);
    const name = car && typeof CAR4_MN === 'object' && CAR4_MN[tag] ? `${CAR4_MN[tag]} motor` : TYPES[o.type].name;
    out.push({ comp: o, tag, name, motor, I: Math.abs(sol.I.get(e.id) || 0) });
  }
  return out;
}
const amsr3MotorSideWired = (c) => wires.some((w) => AMSR3_TERMS.some((p) => w.a === `${c.id}:${p}` || w.b === `${c.id}:${p}`));
function amsr3Led(L, target, dt) { if (!L) return; L.level += (target - L.level) * Math.min(1, dt * 20); L.mat.emissiveIntensity = L.level * 3; L.halo.material.opacity = L.level * 0.75; }
function amsr3PowerHint() {
  const c = [...comps.values()].find((o) => o.type === 'amsr3' && !o.state.powered);
  if (!c || c.stack == null) return `Drag the ${AMSR3.name} onto the RBS Learning Board: its pins plug into the board’s headers.`;
  const vs = c.state.vs || 0;
  return vs < 0.3 ? 'Its motor power isn’t connected: wire a 7–12 V battery to Vin (+) and GND (−) on its screw terminal.'
    : `Its motor power on Vin is ${fmtNum(vs, 2)} V: the L298P needs 4.8 V or more. Use 7–12 V, such as the 4WD car’s two 18650 cells in series (2S, 7.4 V).`;
}
// stacks a shield on the RBS Learning Board exactly as a drop does (moveDrag + endDrag): boardUnder's test (the board is there and
// carries no other shield), stackShield (c.stack, the board's rotation), the board's x/z, then the wires and changed(). Returns true
// when the shield sits on the board (also when it already did); false when there is no board or another shield is on it.
function amsr3Stack(shield, board = boardComp()) {
  if (!shield || !TYPES[shield.type] || !TYPES[shield.type].shield || !board || board.type !== 'arduino') return false;
  if (shield.stack === board.id) return true;
  const b = boardUnder(shield, board.x, board.z);
  if (b !== board) return false;
  stackShield(shield, b); setCompPos(shield, b.x, b.z); shield.drop = 1;
  markWires([shield]); changed();
  return true;
}

TYPES.amsr3 = {
  name: AMSR3.name, meta: '2 DC channels (A, B) · L298P · D12 D3 D9 / D13 D11 D8', lift: SHIELD_LEG, shield: true, module: true, props: {}, build: buildAmsr3,
  get powerHint() { return amsr3PowerHint(); },
  pinNode(c, pin) {
    if (/^M[AB][+-]2$/.test(pin)) return `${c.id}.${pin.slice(0, 3)}`;   // a second wire in the same screw terminal
    if (c.stack == null) return null;
    if (pin === 'PWR-') return 'GND';                                    // the screw terminal's GND is the board's GND
    return AMSR3_HDR.has(pin) ? amsr3Node(pin) : null;                   // the stacking header: the board's own pins
  },
  elements(c, ctx, power) {
    ctx.R('PWR+', 'PWR-', 4700, 'q');   // a small load on Vin at rest (illustrative), so the terminal never floats
    if (power && c.stack != null && c.state.supR) ctx.R('PWR+', 'PWR-', c.state.supR, 'sup');   // what the bridge draws from Vin (see tick)
  },
  outputs(c, ctx, prev) {
    const S = c.state; S.ch = S.ch || {};
    if (c.stack == null) { S.powered = false; S.vs = 0; S.supplyOk = false; for (const k of AMSR3_K) S.ch[k] = null; return; }
    const g = prev.volt(pinNode(c, 'PWR-')), vs = prev.volt(pinNode(c, 'PWR+')) - g;
    const ok = vs >= (S.supplyOk ? AMSR3.vsMin - 0.15 : AMSR3.vsMin);   // a little hysteresis, so a sagging battery doesn't chatter
    S.vs = vs; S.supplyOk = ok; S.vout = ok ? Math.max(0, vs - AMSR3.drop) : 0;
    S.powered = ok || !amsr3MotorSideWired(c);   // the logic runs on the board's 5 V; only complain when the motor side is in use
    for (const k of AMSR3_K) {
      const C = AMSR3.ch[k], lv = (pin) => prev.volt(pinNode(c, pin));
      const vPwm = lv(C.pwm), dir = lv(C.dir) >= AMSR3.vih, brake = lv(C.brk) >= AMSR3.vih;
      const d = vPwm >= AMSR3.vih ? clamp(amsr3Duty(pinNode(c, C.pwm)), 0, 1) : 0;   // = the PWM pin's average voltage / 5 V
      let mode = 'off', a = null, b = null;
      if (!ok) mode = 'nopower';                                                      // Vs too low: the bridge doesn't run
      else if (brake) { mode = 'brake'; a = g; b = g; }                              // BRAKE HIGH: both outputs at the same voltage, at any PWM
      // (the bare L298 only brakes while its ENABLE is HIGH; whether the Rev3's brake logic also works at PWM 0 is not verified)
      else if (d > 0) { mode = 'drive'; const v = g + d * S.vout; a = dir ? v : g; b = dir ? g : v; }   // averaged PWM on the DIR side
      // PWM 0 without the brake: the L298's enable is LOW, every output transistor is off and the motor coasts
      if (a != null) { ctx.Vp(C.p, a, AMSR3.rout, `o${k}p`); ctx.Vp(C.m, b, AMSR3.rout, `o${k}m`); }
      const snsV = clamp(AMSR3.vPerA * ((S.I && S.I[k]) || 0), 0, AMSR3.snsMax);   // from the last solve's current (tick)
      ctx.Vp(C.sns, snsV, AMSR3.snsR, 'sns' + k);
      S.ch[k] = { dir, brake, d, vPwm, mode, a, b, snsV };
    }
  },
  // once a frame: measure each channel's current (it feeds the sense outputs and the supply load); dirty only on a real change
  tick(c, dt) {
    const S = c.state, on = c.stack != null && live();
    S.I = S.I || { A: 0, B: 0 }; S.Ifwd = S.Ifwd || { A: 0, B: 0 }; S.hotT = S.hotT || { A: 0, B: 0 }; S.hotWarned = S.hotWarned || {};
    let change = false, supI = 0;
    for (const k of AMSR3_K) {
      const st = on && S.ch ? S.ch[k] : null, q = st && (st.mode === 'drive' || st.mode === 'brake') ? amsr3OutI(c, k) : { abs: 0, fwd: 0 };
      if (Math.abs(q.abs - S.I[k]) * AMSR3.vPerA > 0.004) change = true;   // the sense voltage would move by about one ADC step
      S.I[k] = q.abs; S.Ifwd[k] = q.fwd;
      if (st && st.mode === 'drive') supI += st.d * q.abs;                  // the bridge takes current from Vin only while it drives
      if (q.abs > AMSR3.imax) {
        S.hotT[k] += dt;
        if (S.hotT[k] > 1 && !S.hotWarned[k]) { S.hotWarned[k] = true; toast(`Channel ${k} gives ${fmtNum(q.abs, 2)} A: more than the 2 A an L298P channel can. Check for a short between ${k}+ and ${k}−, or use smaller motors.`); }
      } else { S.hotT[k] = 0; if (q.abs < AMSR3.imax * 0.9) S.hotWarned[k] = false; }
      const drv = st && st.mode === 'drive' ? st.d : 0;
      amsr3Led(c.leds && c.leds[k + '+'], st && st.dir ? drv : 0, dt); amsr3Led(c.leds && c.leds[k + '-'], st && !st.dir ? drv : 0, dt);
    }
    S.supI = supI;
    // Vin sees the bridge as a load of Vs / (d × I) (power in = power to the motor + the L298's drop)
    const R = on && supI > 0.002 && S.vs > 0.5 ? clamp(S.vs / supI, 0.5, 1e6) : null;
    if ((R == null) !== (S.supR == null) || (R != null && Math.abs(R - S.supR) / S.supR > 0.06)) { S.supR = R; change = true; }
    if (change) dirty = true;
  },
  active: (c) => live() && c.stack != null && c.state.ch && AMSR3_K.some((k) => c.state.ch[k] && c.state.ch[k].mode === 'drive') && 'motor shield driving',
  controls(c) {
    if (c.stack != null) return '<span class="note">On the board · A: DIR 12, PWM 3, BRAKE 9 · B: DIR 13, PWM 11, BRAKE 8</span>';
    const b = boardComp(), free = b && ![...comps.values()].some((o) => o !== c && o.stack === b.id);
    return `${free && run.state === 'stopped' ? '<button type="button" class="tool" data-act="amsr3-stack" title="Stack it on the RBS Learning Board, as a drag onto the board does">Put on the board</button>' : ''}<span class="note">${!b ? 'Add the RBS Learning Board first' : free ? 'Drag it onto the RBS Learning Board' : 'The board already carries a shield'}</span>`;
  },
  onTool(c, btn) {
    if (btn.dataset.act !== 'amsr3-stack') return;
    if (amsr3Stack(c)) { blip(760); toast('The Motor Shield Rev3 sits on the board. Motor A: D12 D3 D9, motor B: D13 D11 D8; motor power on Vin and GND.'); }
    else toast('It can’t go on the board: add the RBS Learning Board, or take the other shield off first.');
  },
  readings(c) {
    const S = c.state, on = c.stack != null, ch = S.ch || {};
    const rows = [['On the board', on ? 'Yes: stacked on the RBS Learning Board' : 'No: drag it onto the RBS Learning Board', on ? 'ok' : 'bad']];
    if (!on || run.state !== 'running') {
      rows.push(['Motor power (Vin)', on ? 'Live when you press Start' : '–'], ['Channel A', 'DIR D12 · PWM D3 · BRAKE D9 · sense A0'], ['Channel B', 'DIR D13 · PWM D11 · BRAKE D8 · sense A1'], ['', AMSR3_NOTE, 'note']);
      return rows;
    }
    const vs = S.vs || 0;
    const supI = S.supI || 0;
    rows.push(['Motor power (Vin)', vs < 0.3 ? 'Not connected: wire 7–12 V to Vin and GND' : !S.supplyOk ? `${volts(vs)}: too low. The L298P needs 4.8 V or more, so the motors are off`
      : `${volts(vs)} · OK${vs > AMSR3.vsMax ? ': over the 18 V limit!' : vs > 12 ? ' (above the usual 7–12 V)' : ''} · drawing ${fmtNum(supI, 2)} A${supI > 2 * AMSR3.imax ? ': over the shield’s 4 A in all!' : ''}`, !S.supplyOk || vs > AMSR3.vsMax || supI > 2 * AMSR3.imax ? 'bad' : 'ok']);
    for (const k of AMSR3_K) {
      const C = AMSR3.ch[k], st = ch[k]; if (!st) continue;
      rows.push([`${k}: DIR · PWM · BRAKE`, `${st.dir ? 'HIGH' : 'LOW'} · ${Math.round(st.d * 100)}% · ${st.brake ? 'HIGH' : 'LOW'}`, st.mode === 'drive' ? 'hi' : '']);
      const vp = sol ? sol.volt(pinNode(c, C.p)) : 0, vm = sol ? sol.volt(pinNode(c, C.m)) : 0;
      rows.push([`${k} output`, st.mode === 'nopower' ? 'Off: Vin is too low' : st.mode === 'off' ? 'Off: PWM is 0, so the motor coasts' : st.mode === 'brake' ? `Brake: ${k}+ and ${k}− both at ${volts(vp)}`
        : `${k}+ ${volts(vp)} · ${k}− ${volts(vm)} · ${volts(vp - vm)} across`, st.mode === 'drive' ? 'hi' : '']);
      const I = (S.I && S.I[k]) || 0, motors = amsr3Loads(c, k).filter((q) => q.motor);
      rows.push([`${k} current`, `${fmtNum(I, 2)} A${I > AMSR3.imax ? ': over the 2 A limit!' : ''}`, I > AMSR3.imax ? 'bad' : motors.length > 1 && I > 0.01 ? 'hi' : '']);
      if (motors.length > 1) rows.push(['', `Channel ${k} runs ${motors.length} motors in parallel (fine for a 4WD car: left pair on A, right pair on B). Together they take ${fmtNum(I, 2)} A of its 2 A: ${motors.map((q) => `${q.name} ${fmtNum(q.I, 2)} A`).join(' + ')}.`, 'note']);
      const va = sol ? sol.volt(pinNode(c, C.sns)) : 0;
      rows.push([`${k} sensing (${C.sns})`, `${volts(va)} · analogRead(${C.sns}) ≈ ${adc(va)}`]);
    }
    rows.push(['', AMSR3_NOTE, 'note']);
    return rows;
  },
  onAdded(c) {   // like the other shields: motors lying unplugged plug into its JST adapters
    if (run.state !== 'stopped' || typeof jstAutoConnect !== 'function') return;
    for (const m of [...comps.values()]) if (m.type !== 'bat18650' && jstLeadsOf(m) && jstFreePlugs(m).length) jstAutoConnect(m, { quiet: true });
  },
};
// its connectors for the JST-XH leads (HG7881 + ESP32 section): two motor pairs (one stepper: A + B) and the motor power
TYPES.amsr3.jstPorts = [{ id: 'MA', label: 'Motor A', step: 1, kind: 'motor', pins: ['MA+', 'MA-'], out: [-1, 0] }, { id: 'MB', label: 'Motor B', step: 1, kind: 'motor', pins: ['MB+', 'MB-'], out: [-1, 0] },
  { id: 'PWR', label: 'Vin', kind: 'power', pins: ['PWR+', 'PWR-'], out: [-1, 0] }];
{ const sh = LIBRARY.find((k) => k[0] === 'Shields'); if (sh && !sh[1].includes('amsr3')) { const i = sh[1].indexOf('l293d'); sh[1].splice(i >= 0 ? i + 1 : sh[1].length, 0, 'amsr3'); } }
// ---- 4. the API for a simulation engine: RBSLab.amsr3 ----
window.RBSLab = Object.assign(window.RBSLab || {}, {
  amsr3: {
    profile: AMSR3,
    shields: () => [...comps.values()].filter((o) => o.type === 'amsr3'),
    stack: (shield, board) => amsr3Stack(shield, board),
    state(c) {
      const S = c.state, v = (pin) => (sol ? sol.volt(pinNode(c, pin)) : 0);
      return { stacked: c.stack != null, vin: S.vs || 0, supplyOk: !!S.supplyOk, supplyAmps: S.supI || 0,
        channels: Object.fromEntries(AMSR3_K.map((k) => { const C = AMSR3.ch[k], st = (S.ch || {})[k] || {}; return [k, { dir: !!st.dir, duty: st.d || 0, brake: !!st.brake, mode: st.mode || 'off',
          plus: v(C.p), minus: v(C.m), amps: (S.I || {})[k] || 0, ampsForward: (S.Ifwd || {})[k] || 0, senseVolts: v(C.sns), analogRead: adc(v(C.sns)),
          loads: amsr3Loads(c, k).map((q) => ({ part: q.comp.id, type: q.comp.type, name: q.name, motor: q.motor, amps: q.I })) }]; })) };
    },
  },
});
/* ---- end of the Arduino Motor Shield Rev3 section ---- */
