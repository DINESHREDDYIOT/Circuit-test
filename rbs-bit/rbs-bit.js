/* RBS bit: a 3D model of the RBS bit microcontroller board, for three.js.
 *
 * Every physical part is its own mesh, or a small group of meshes, tagged with an id, a name and a description, so a
 * simulator can find it, highlight it, light it or press it. Units are millimetres.
 *
 * Local frame: the board lies flat with its front (the LEDs) facing +y. The edge connector is at +z, the USB edge at -z.
 * The PCB's back face is y = 0 and its front face y = 1.6. Back parts hang below y = 0, down to y = -5.5.
 *
 * Sizes follow the published V2 board of this form factor: a 51.60 x 42.00 mm outline, a 1.6 mm PCB and 11.65 mm
 * overall (buttons 4.55 mm above the front, battery socket 5.50 mm below the back); 40 edge positions on a 1.27 mm
 * pitch carrying 25 front contacts, five of them rings for 4 mm plugs; and the parts list's packages (0603 LEDs,
 * 6 mm tactile switches, 7 x 7 mm processor, 5 x 5 mm USB chip, 2 x 2 mm motion sensor, 8.5 mm speaker,
 * 3.76 x 2.95 mm microphone, 3.2 x 2.5 mm crystal). Placements that are not published come from reference drawings.
 *
 *   import { createRBSBit } from './rbs-bit.js';
 *   const bit = createRBSBit();            // call after your fonts have loaded (the print is drawn once)
 *   scene.add(bit.group);
 *   bit.setLed(2, 2, true);                // column, row (0-4)
 *   bit.pressButton('A', true);
 *   const hit = bit.resolve(raycaster.intersectObjects(bit.pickables)[0]?.object);   // { part, led, pin, button }
 *   bit.highlight(hit.part);
 *   renderer.setAnimationLoop((t) => { bit.update(dt); ... });
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const W = 51.6, D = 42.0, T = 1.6, CU = 0.035, PITCH = 1.27;   // board width, height, thickness; copper + gold finish; edge pitch

export const RBS_BIT_SPEC = Object.freeze({
  name: 'RBS bit', width: W, height: D, thickness: T, depth: 11.65, frontHeight: 4.55, backHeight: 5.5,
  corner: { top: 3.0, bottom: 0.8 }, ledPitch: 4.0,
  edge: { positions: 40, pitch: PITCH, contacts: 25, ringHole: 4.0, ringOuter: 5.9 },
});

// plan coordinates: px from the left edge and py down from the USB edge (front view); bx from the left of the back view
const X = (px) => px - W / 2, Z = (py) => py - D / 2, BX = (bx) => bx - W / 2;   // BX: inside the turned-over back group

/* ---------------- the edge connector: 40 positions, left to right on the front ---------------- */
const EDGE = ['P3', 'R:P0', 'R:P0', 'R:P0', 'R:P0', 'P4', 'P5', 'P6', 'P7', 'R:P1', 'R:P1', 'R:P1', 'R:P1', 'P8', 'P9', 'P10', 'P11', 'P12',
  'R:P2', 'R:P2', 'R:P2', 'R:P2', 'P13', 'P14', 'P15', 'P16', 'G:3V', 'R:3V', 'R:3V', 'R:3V', 'R:3V', 'G:3V', 'P19', 'P20', 'G:GND', 'R:GND', 'R:GND', 'R:GND', 'R:GND', 'G:GND'];
const edgeX = (k) => (k - 19.5) * PITCH;
const RING = { py: 35.7, outer: 2.95, hole: 2.0, finger: 2.15 };   // centre (mm from the USB edge), outer and hole radius, finger half-width
const STRIP = { w: 0.85, top: 38.3 };                              // small contacts: width, where they start
const NOTCH = { w: 0.5, d: 1.2, off: 2.45 };                      // the clip notches either side of each ring
const RINGS = [
  { id: 'P0', label: '0', name: 'Pin 0', kind: 'io' },
  { id: 'P1', label: '1', name: 'Pin 1', kind: 'io' },
  { id: 'P2', label: '2', name: 'Pin 2', kind: 'io' },
  { id: '3V', label: '3V', name: '3V power', kind: 'power' },
  { id: 'GND', label: 'GND', name: 'Ground (GND)', kind: 'ground' },
].map((r) => { const ks = EDGE.flatMap((e, k) => (e === 'R:' + r.id ? [k] : [])); return { ...r, x: edgeX((ks[0] + ks[ks.length - 1]) / 2) }; });
const RING_DESC = {
  P0: 'Big ring for pin 0. Clip a crocodile lead on, or push a 4 mm banana plug through. Digital in or out, analog in, touch. Joined to the same ring on the back.',
  P1: 'Big ring for pin 1. Clip a crocodile lead on, or push a 4 mm banana plug through. Digital in or out, analog in, touch. Joined to the same ring on the back.',
  P2: 'Big ring for pin 2. Clip a crocodile lead on, or push a 4 mm banana plug through. Digital in or out, analog in, touch. Joined to the same ring on the back.',
  '3V': '3.3 V out to power a sensor or LEDs (about 200 mA in total), or 3 V in from a battery pack. Never connect it straight to GND.',
  GND: 'Ground, 0 V: the return path for everything you connect to the board.',
};
const STRIP_DESC = { P3: 'LED column 3, analog in', P4: 'LED column 1, analog in', P5: 'button A', P6: 'LED column 4', P7: 'LED column 2', P8: 'general purpose in/out',
  P9: 'general purpose in/out', P10: 'LED column 5, analog in', P11: 'button B', P12: 'general purpose (reserved)', P13: 'SPI clock (SCK)', P14: 'SPI data in (MISO)',
  P15: 'SPI data out (MOSI)', P16: 'general purpose in/out', P19: 'I2C clock (SCL)', P20: 'I2C data (SDA)' };

const LED_AT = (col, row) => [W / 2 + (col - 2) * 4.0, 22.1 + (row - 2) * 4.0];   // px, py of each display LED
const BUTTON_AT = { A: [W / 2 - 19.3, 21.5], B: [W / 2 + 19.3, 21.5] };
const SIDE_HOLES = [[1.6, 21.7], [50.0, 21.7]], MIC_HOLE = [33.6, 7.6], LOGO = [W / 2, 7.6];

/* ---------------- shared resources: geometry, materials and textures are made once and reused ---------------- */
const CACHE = new Map();
const once = (k, fn) => { if (!CACHE.has(k)) CACHE.set(k, fn()); return CACHE.get(k); };
const rbox = (w, h, d, r = 0.1, s = 2) => new RoundedBoxGeometry(w, h, d, s, Math.max(0.001, Math.min(r, Math.min(w, h, d) / 2 - 0.001)));
const geo = (k, fn) => once('geo:' + k, fn);
function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return { c, g: c.getContext('2d') }; }
const FONT = '"Outfit", "Segoe UI", system-ui, -apple-system, sans-serif', MONO = '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
const tex = (c, srgb = true) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const noiseTex = () => once('noise', () => {
  const n = 128, { c, g } = canvas(n, n), img = g.createImageData(n, n); let s = 9;
  for (let i = 0; i < n * n; i++) { s = (s * 16807) % 2147483647; const v = 150 + (s / 2147483647) * 80; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); return t;
});
const glowTex = () => once('glow', () => {
  const { c, g } = canvas(64, 64), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  for (const [o, a] of [[0, 1], [0.22, 0.6], [0.55, 0.14], [1, 0]]) gr.addColorStop(o, `rgba(255,255,255,${a})`);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return tex(c);
});
const MATS = {
  mask: () => new THREE.MeshPhysicalMaterial({ color: 0x131315, roughness: 0.62, roughnessMap: noiseTex(), clearcoat: 0.35, clearcoatRoughness: 0.5 }),
  edge: () => new THREE.MeshStandardMaterial({ color: 0x3d382e, roughness: 0.9 }),
  gold: () => new THREE.MeshStandardMaterial({ color: 0xf2c75f, metalness: 0.85, roughness: 0.3, envMapIntensity: 1.2 }),
  goldIn: () => new THREE.MeshStandardMaterial({ color: 0xe2b44c, metalness: 0.85, roughness: 0.34, side: THREE.DoubleSide }),
  tin: () => new THREE.MeshStandardMaterial({ color: 0xdadde2, metalness: 1, roughness: 0.3 }),
  tinIn: () => new THREE.MeshStandardMaterial({ color: 0xcfd2d7, metalness: 1, roughness: 0.35, side: THREE.DoubleSide }),
  steel: () => new THREE.MeshStandardMaterial({ color: 0xc8ccd2, metalness: 1, roughness: 0.27 }),
  cover: () => new THREE.MeshStandardMaterial({ color: 0xd6d9dd, metalness: 0.9, roughness: 0.34, roughnessMap: noiseTex() }),
  plastic: () => new THREE.MeshPhysicalMaterial({ color: 0x1c1c1f, roughness: 0.62, clearcoat: 0.12 }),
  cap: () => new THREE.MeshPhysicalMaterial({ color: 0x17171a, roughness: 0.38, clearcoat: 0.45, clearcoatRoughness: 0.3 }),
  epoxy: () => new THREE.MeshStandardMaterial({ color: 0x212226, roughness: 0.78, roughnessMap: noiseTex() }),
  nylon: () => new THREE.MeshPhysicalMaterial({ color: 0xf0eadb, roughness: 0.55, clearcoat: 0.1 }),
  ceramic: () => new THREE.MeshStandardMaterial({ color: 0xcbb68e, roughness: 0.7 }),
  cyan: () => new THREE.MeshStandardMaterial({ color: 0x00b5ff, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
  cavity: () => new THREE.MeshStandardMaterial({ color: 0x060607, roughness: 0.95 }),
  ledBody: () => new THREE.MeshStandardMaterial({ color: 0xf2eee5, roughness: 0.55 }),
  die: () => new THREE.MeshStandardMaterial({ color: 0x6b1712, roughness: 0.5 }),
  mlcc: () => new THREE.MeshStandardMaterial({ color: 0xb89b75, roughness: 0.6 }),
  res: () => new THREE.MeshStandardMaterial({ color: 0x1e1e21, roughness: 0.6 }),
  speaker: () => new THREE.MeshPhysicalMaterial({ color: 0x151517, roughness: 0.48, clearcoat: 0.35 }),
  speakerRim: () => new THREE.MeshPhysicalMaterial({ color: 0x24252a, roughness: 0.4, clearcoat: 0.5 }),
  antenna: () => new THREE.MeshStandardMaterial({ color: 0x8a9099, metalness: 0.55, roughness: 0.38 }),
  micBase: () => new THREE.MeshStandardMaterial({ color: 0x9a8656, roughness: 0.7 }),
};
const mat = (k) => once('mat:' + k, MATS[k]);
function mesh(g, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; }
function decal(parent, w, h, texture, x, y, z, opts = {}) {
  const p = new THREE.PlaneGeometry(w, h); p.rotateX(-Math.PI / 2);
  const o = new THREE.Mesh(p, new THREE.MeshStandardMaterial({ map: texture, transparent: true, depthWrite: false, roughness: opts.roughness ?? 0.6, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  o.position.set(x, y, z); if (opts.rotY) o.rotation.y = opts.rotY; o.raycast = () => {}; o.userData.decal = true; o.receiveShadow = true; parent.add(o); return o;
}
// laser marks on a package top: lines of [text, size mm, weight]
function marks(parent, x, y, z, w, h, lines, color = '#9a9ca3', rotY = 0) {
  const t = once(`mark:${w}:${h}:${color}:${lines.map((l) => l.join(',')).join('|')}`, () => {
    const S = 90, { c, g } = canvas(w * S, h * S), total = lines.reduce((a, l) => a + l[1] * 1.3, 0); let yy = (h - total) / 2;
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const [s, size, weight = 600] of lines) { yy += size * 0.65; g.font = `${weight} ${size * S}px ${MONO}`; g.fillText(s, (w / 2) * S, yy * S); yy += size * 0.65; }
    return tex(c);
  });
  return decal(parent, w, h, t, x, y, z, { rotY, roughness: 0.75 });
}
// a rounded rectangle on a THREE.Path, centred at (cx, cy)
function roundRectPath(p, cx, cy, w, h, r) {
  const x0 = cx - w / 2, y0 = cy - h / 2; r = Math.min(r, w / 2, h / 2);
  p.moveTo(x0 + r, y0); p.lineTo(x0 + w - r, y0); p.absarc(x0 + w - r, y0 + r, r, -Math.PI / 2, 0, false); p.lineTo(x0 + w, y0 + h - r); p.absarc(x0 + w - r, y0 + h - r, r, 0, Math.PI / 2, false);
  p.lineTo(x0 + r, y0 + h); p.absarc(x0 + r, y0 + h - r, r, Math.PI / 2, Math.PI, false); p.lineTo(x0, y0 + r); p.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false); return p;
}
// shapes are drawn in the board plane with y up toward the USB edge (shape y = -z), then laid flat
const flat = (g) => { g.rotateX(-Math.PI / 2); return g; };
const extrude = (shape, depth, segs = 24) => flat(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: segs }));

/* ---------------- the board outline: rounded corners, the clip notches along the edge, every hole cut through ---------------- */
function boardShape() {
  const s = new THREE.Shape(), x0 = -W / 2, x1 = W / 2, yT = D / 2, yB = -D / 2, rt = RBS_BIT_SPEC.corner.top, rb = RBS_BIT_SPEC.corner.bottom;
  const notches = RINGS.flatMap((r) => [r.x - NOTCH.off, r.x + NOTCH.off]).sort((a, b) => a - b), nr = NOTCH.w / 2;
  s.moveTo(x0 + rb, yB);
  for (const n of notches) { const top = yB + NOTCH.d - nr; s.lineTo(n - nr, yB); s.lineTo(n - nr, top); s.absarc(n, top, nr, Math.PI, 0, true); s.lineTo(n + nr, yB); }
  s.lineTo(x1 - rb, yB); s.quadraticCurveTo(x1, yB, x1, yB + rb);
  s.lineTo(x1, yT - rt); s.quadraticCurveTo(x1, yT, x1 - rt, yT);
  s.lineTo(x0 + rt, yT); s.quadraticCurveTo(x0, yT, x0, yT - rt);
  s.lineTo(x0, yB + rb); s.quadraticCurveTo(x0, yB, x0 + rb, yB);
  const holes = [...RINGS.map((r) => [r.x, -Z(RING.py), RING.hole]), ...SIDE_HOLES.map(([px, py]) => [X(px), -Z(py), 0.95]), [X(MIC_HOLE[0]), -Z(MIC_HOLE[1]), 0.4]];
  for (const [x, y, r] of holes) { const h = new THREE.Path(); h.absarc(x, y, r, 0, Math.PI * 2, true); s.holes.push(h); }
  return s;
}
// a ring contact: a round pad with its hole, and a finger running down to the edge
function ringShape(cx) {
  const s = new THREE.Shape(), yc = -Z(RING.py), yb = -D / 2, R = RING.outer, hw = RING.finger, a = Math.acos(hw / R);
  s.moveTo(cx - hw, yb); s.lineTo(cx - hw, yc - R * Math.sin(a)); s.absarc(cx, yc, R, Math.PI + a, -a, true); s.lineTo(cx + hw, yb); s.lineTo(cx - hw, yb);
  const h = new THREE.Path(); h.absarc(cx, yc, RING.hole, 0, Math.PI * 2, false); s.holes.push(h);   // outline runs clockwise, so the hole runs the other way
  return s;
}

/* ---------------- print: the front's lettering (the cyan shapes are real meshes) and the back's labels ---------------- */
function frontPrint() {
  return once('frontPrint', () => {
    const S = 24, { c, g } = canvas(W * S, D * S);
    const text = (t, px, py, size, color, weight = 800) => { g.font = `${weight} ${size * S}px ${FONT}`; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, px * S, py * S); };
    text('A', 6.05, 29.85, 1.75, '#08141c'); text('B', 46.35, 14.4, 1.75, '#08141c');
    for (const r of RINGS) text(r.label, r.x + W / 2, 40.25, r.label.length > 2 ? 1.6 : 1.8, '#17130a');
    // the microphone mark beside its LED: a capsule on a stand
    g.save(); g.scale(S, S); g.strokeStyle = '#eef1f4'; g.lineWidth = 0.17; g.lineCap = 'round';
    const mx = 38.2, my = 7.2; g.beginPath(); roundRectPath2d(g, mx - 0.42, my - 0.95, 0.84, 1.5, 0.42); g.stroke();
    g.beginPath(); g.arc(mx, my - 0.05, 0.75, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke(); g.beginPath(); g.moveTo(mx, my + 0.7); g.lineTo(mx, my + 1.15); g.moveTo(mx - 0.4, my + 1.15); g.lineTo(mx + 0.4, my + 1.15); g.stroke();
    g.restore();
    return tex(c);
  });
}
function roundRectPath2d(g, x, y, w, h, r) { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function backPrint() {
  return once('backPrint', () => {
    const S = 22, { c, g } = canvas(W * S, D * S), ink = '#eef1f4';
    const font = (size, weight = 700) => `${weight} ${size * S}px ${FONT}`;
    const width = (t, size, weight = 700) => { g.font = font(size, weight); return g.measureText(t).width / S; };
    const text = (t, bx, by, size, o = {}) => { g.font = font(size, o.weight || 700); g.fillStyle = o.color || ink; g.textAlign = o.align || 'left'; g.textBaseline = 'middle'; g.fillText(t, bx * S, by * S); };
    const line = (pts) => { g.strokeStyle = ink; g.lineWidth = 0.2 * S; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x * S, y * S) : g.moveTo(x * S, y * S))); g.stroke(); };
    const L = 24.6, endOf = (t) => L + width(t, 0.95) + 0.4;
    line([[22.6, 4.8], [22.6, 9.4], [23.6, 10.45], [24.2, 10.45]]);                          // USB
    line([[12.9, 4.4], [14.2, 5.4], [14.2, 11.75], [24.2, 11.75]]);                          // antenna
    line([[34.3, 7.8], [34.3, 11.4], [32.7, 13.05], [endOf('RESET BUTTON'), 13.05]]);         // reset button
    line([[40.4, 7.6], [36.0, 13.0], [35.0, 14.35], [endOf('BATTERY SOCKET'), 14.35]]);       // battery socket
    line([[8.0, 18.2], [8.0, 22.1], [8.5, 22.75]]);                                           // processor
    line([[5.6, 24.9], [6.6, 24.05], [8.5, 24.05]]); line([[5.6, 25.35], [8.5, 25.35]]);      // motion sensor
    { const e = 8.8 + width('PINS', 0.95) + 0.4; line([[e, 26.95], [e + 1.2, 26.95], [e + 1.2, 30.0], [15.0, 32.6]]); }
    for (const [t, by] of [['USB', 10.45], ['BLE ANTENNA', 11.75], ['RESET BUTTON', 13.05], ['BATTERY SOCKET', 14.35]]) text(t, L, by, 0.95);
    for (const [t, by] of [['PROCESSOR', 22.75], ['COMPASS', 24.05], ['ACCELEROMETER', 25.35], ['PINS', 26.95]]) text(t, 8.8, by, 0.95);
    text('MICROPHONE', 14.8, 10.35, 0.95); text('SPEAKER', 30.5, 26.95, 0.95, { align: 'center' }); text('+', 48.7, 2.4, 1.5, { align: 'center' });
    // the maker's mark: three boxed letters, then the board's name
    const bx0 = 18.6, by0 = 30.3;
    ['R', 'B', 'S'].forEach((t, k) => { const x = bx0 + k * 2.85; g.fillStyle = ink; g.fillRect((x - 1.25) * S, (by0 - 1.33) * S, 2.5 * S, 2.66 * S); text(t, x, by0 + 0.08, 2.0, { color: '#131315', weight: 800, align: 'center' }); });
    text('bit', bx0 + 2 * 2.85 + 1.9, by0 + 0.05, 3.3, { weight: 600 });
    return tex(c);
  });
}

/* ---------------- packages ---------------- */
// 0603 LED, long axis along z; returns its lens material and glow so they can be lit
function led(parent, x, top, z, color, alongX = false) {
  const g = new THREE.Group(); g.position.set(x, top, z); if (alongX) g.rotation.y = Math.PI / 2; parent.add(g);
  mesh(geo('ledBody', () => rbox(0.8, 0.3, 1.6, 0.04)), mat('ledBody'), g, 0, 0.15, 0);
  for (const s of [-1, 1]) mesh(geo('ledEnd', () => rbox(0.84, 0.32, 0.3, 0.05)), mat('tin'), g, 0, 0.16, s * 0.66);
  mesh(geo('ledDie', () => new THREE.BoxGeometry(0.24, 0.05, 0.24)), mat('die'), g, 0, 0.33, 0);
  const lens = new THREE.MeshPhysicalMaterial({ color: 0xf6f2ea, roughness: 0.18, clearcoat: 0.6, transparent: true, opacity: 0.9, emissive: color, emissiveIntensity: 0 });
  mesh(geo('ledLens', () => rbox(0.72, 0.3, 1.22, 0.14, 3)), lens, g, 0, 0.45, 0);
  // the light it spills onto the board: a flat glow on the face, so it vanishes edge-on like real light does
  const glow = new THREE.Mesh(geo('ledGlow', () => flat(new THREE.PlaneGeometry(5.2, 5.2))), new THREE.MeshBasicMaterial({ map: glowTex(), color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  glow.position.set(x, top + 0.05, z); glow.renderOrder = 2; glow.raycast = () => {}; glow.userData.decal = true; parent.add(glow);
  return { lens, glow };
}
// 6 mm tactile switch (4.55 mm tall): black base, metal cover, round actuator that travels when pressed
function tactile(parent, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  mesh(geo('swBase', () => rbox(6.0, 2.55, 6.0, 0.3)), mat('plastic'), g, 0, 1.275, 0);
  mesh(geo('swCover', () => rbox(6.1, 0.3, 6.1, 0.12)), mat('cover'), g, 0, 2.7, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    mesh(geo('swTab', () => new THREE.BoxGeometry(1.3, 1.6, 0.1)), mat('cover'), g, sx * 1.7, 2.0, sz * 3.06);
    mesh(geo('swLeg', () => rbox(0.9, 0.3, 0.9, 0.08)), mat('tin'), g, sx * 3.3, 0.15, sz * 2.25);
  }
  const act = new THREE.Group(); act.position.y = 2.85; g.add(act);
  mesh(geo('swAct', () => new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(1.75, 0), new THREE.Vector2(1.75, 1.42), new THREE.Vector2(1.7, 1.6), new THREE.Vector2(1.52, 1.7), new THREE.Vector2(0, 1.7)], 40)), mat('cap'), act);
  return { group: g, actuator: act, rest: 2.85, travel: 0.3 };
}
// QFN-style package: epoxy body, tin pads round the edge, pin-1 dot, laser marks
function qfn(parent, x, z, s, h, n, lines) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  mesh(geo(`qfn:${s}:${h}`, () => rbox(s, h, s, 0.1)), mat('epoxy'), g, 0, h / 2, 0);
  const pitch = (s - 1.0) / Math.max(1, n - 1), pad = geo('qfnPad', () => new THREE.BoxGeometry(0.24, 0.1, 0.4));
  for (let side = 0; side < 4; side++) for (let i = 0; i < n; i++) {
    const o = -((n - 1) / 2) * pitch + i * pitch, a = (side * Math.PI) / 2, px = Math.cos(a) * (s / 2 + 0.1), pz = Math.sin(a) * (s / 2 + 0.1);
    const m = mesh(pad, mat('tin'), g, px + -Math.sin(a) * o, 0.05, pz + Math.cos(a) * o); m.rotation.y = -a + Math.PI / 2;
  }
  mesh(geo('qfnDot', () => new THREE.CylinderGeometry(0.22, 0.22, 0.03, 16)), mat('cavity'), g, -s / 2 + 0.6, h + 0.01, -s / 2 + 0.6);
  if (lines) marks(g, 0, h + 0.02, 0.15, s * 0.86, s * 0.6, lines);
  return g;
}
function chip(parent, x, z, kind, alongZ = false) {   // 0402 / 0603 / 0805 parts and SC-75 transistors
  const [L, Wd, H, m] = { c0402: [1.0, 0.5, 0.35, 'mlcc'], r0402: [1.0, 0.5, 0.3, 'res'], c0603: [1.6, 0.8, 0.5, 'mlcc'], r0805: [2.0, 1.25, 0.45, 'res'], sc75: [1.6, 0.8, 0.75, 'epoxy'] }[kind];
  const g = new THREE.Group(); g.position.set(x, 0, z); if (alongZ) g.rotation.y = Math.PI / 2; parent.add(g);
  if (kind === 'sc75') {
    mesh(geo('sc75', () => rbox(L, H - 0.1, Wd, 0.06)), mat(m), g, 0, 0.1 + (H - 0.1) / 2, 0);
    for (const [lx, lz] of [[-0.5, 0.55], [0.5, 0.55], [0, -0.55]]) mesh(geo('sc75leg', () => new THREE.BoxGeometry(0.3, 0.12, 0.4)), mat('tin'), g, lx, 0.06, lz);
  } else {
    mesh(geo('chip:' + kind, () => rbox(L * 0.7, H, Wd, 0.04)), mat(m), g, 0, H / 2, 0);
    for (const s of [-1, 1]) mesh(geo('chipEnd:' + kind, () => rbox(L * 0.18, H + 0.02, Wd + 0.02, 0.03)), mat('tin'), g, s * L * 0.41, (H + 0.02) / 2, 0);
  }
  return g;
}

/* ---------------- the board ---------------- */
export function createRBSBit(options = {}) {
  const opts = { highlightColor: 0xff7a2f, hoverColor: 0xffc08a, ...options };
  const root = new THREE.Group(); root.name = 'RBS bit';
  const back = new THREE.Group(); back.name = 'back side'; back.rotation.z = Math.PI; root.add(back);   // its +y is the board's -y: parts sit "on top" of the back face
  const parts = new Map(), own = {};
  let pcbMesh = null, printMesh = null;
  const part = (id, info, parent = root, x = 0, y = 0, z = 0) => {
    const g = new THREE.Group(); g.name = id; g.position.set(x, y, z); g.userData.rbsPart = id; parent.add(g);
    if (!parts.has(id)) parts.set(id, { id, category: 'component', ...info, meshes: [] });
    return g;
  };

  // PCB: one solid with the outline, notches and holes; plated barrels through the rings, tin through the side holes
  {
    const g = part('pcb', { name: 'Printed circuit board', category: 'board', description: '51.6 x 42.0 mm, 1.6 mm thick, two copper layers. Black matte solder mask, white and cyan print, and a gold (ENIG) finish on every pad.' });
    pcbMesh = mesh(geo('pcb', () => extrude(boardShape(), T, 32)), [mat('mask'), mat('edge')], g);
    const cyan = (pts) => { const s = new THREE.Shape(); pts.forEach(([px, py], k) => (k ? s.lineTo(X(px), -Z(py)) : s.moveTo(X(px), -Z(py)))); return s; };
    const corner = new THREE.Shape(); corner.moveTo(X(0.2), -Z(12.7)); corner.lineTo(X(0.2), -Z(3.0)); corner.quadraticCurveTo(X(0.2), -Z(0.2), X(3.0), -Z(0.2)); corner.lineTo(X(14.0), -Z(0.2)); corner.lineTo(X(0.2), -Z(12.7));
    const print = geo('cyanPrint', () => flat(new THREE.ShapeGeometry([corner, cyan([[14.5, 0.2], [19.3, 0.2], [14.5, 5.4]]), cyan([[19.9, 0.2], [22.4, 0.2], [19.9, 2.8]]),
      cyan([[3.0, 31.1], [7.3, 31.1], [7.3, 26.5]]), cyan([[45.1, 13.1], [49.3, 13.1], [45.1, 17.6]])], 12)));
    const pm = mesh(print, mat('cyan'), g, 0, T + 0.008, 0); pm.castShadow = false; printMesh = pm;
    for (const [px, py] of SIDE_HOLES) {
      mesh(geo('sideBarrel', () => new THREE.CylinderGeometry(0.95, 0.95, T + 0.02, 20, 1, true)), mat('tinIn'), g, X(px), T / 2, Z(py));
      for (const y of [T, -CU]) mesh(geo('sideRing', () => flat(new THREE.ExtrudeGeometry(Object.assign(new THREE.Shape().absarc(0, 0, 1.35, 0, Math.PI * 2, false), { holes: [new THREE.Path().absarc(0, 0, 0.95, 0, Math.PI * 2, true)] }), { depth: CU, bevelEnabled: false, curveSegments: 20 }))), mat('tin'), g, X(px), y, Z(py));
    }
    decal(root, W, D, frontPrint(), 0, T + CU + 0.012, 0);
    decal(back, W, D, backPrint(), 0, CU + 0.012, 0);
  }

  // edge connector: five rings (pins), small contacts and guard strips, on both faces
  const pins = [];
  for (const r of RINGS) {
    const g = part('pad-' + r.id, { name: r.name + ' ring', category: 'pin', pin: r.id, description: RING_DESC[r.id] });
    const ring = geo('ring:' + r.id, () => extrude(ringShape(r.x), CU, 40));
    mesh(ring, mat('gold'), g, 0, T, 0); mesh(ring, mat('gold'), g, 0, -CU, 0);
    mesh(geo('ringBarrel', () => new THREE.CylinderGeometry(RING.hole - 0.005, RING.hole - 0.005, T + 2 * CU, 40, 1, true)), mat('goldIn'), g, r.x, T / 2, Z(RING.py));
    pins.push({ id: r.id, name: r.name, kind: r.kind, description: RING_DESC[r.id], part: 'pad-' + r.id, radius: RING.hole,
      position: new THREE.Vector3(r.x, T + CU, Z(RING.py)), backPosition: new THREE.Vector3(r.x, -CU, Z(RING.py)) });
  }
  const contacts = [];
  EDGE.forEach((e, k) => {
    if (e.startsWith('R:')) return;
    const guard = e.startsWith('G:'), net = guard ? e.slice(2) : e, side = guard ? (EDGE[k + 1] === 'R:' + net ? 'left' : 'right') : '';
    const id = guard ? `guard-${net}-${side}` : 'edge-' + e;
    const name = guard ? `${net} guard strip (${side})` : 'Pin ' + e.slice(1);
    const description = guard ? `Joined to the ${net} ring, so a clip that slips sideways still touches ${net}, not a signal pin.`
      : `Small edge contact on the 1.27 mm pitch: ${STRIP_DESC[e]}. Reach it with an edge-connector breakout board.`;
    const g = part(id, { name, category: 'edge', pin: net, description });
    const len = D - STRIP.top, strip = geo('strip', () => new THREE.BoxGeometry(STRIP.w, CU, len));
    mesh(strip, mat('gold'), g, edgeX(k), T + CU / 2, Z(STRIP.top + len / 2)); mesh(strip, mat('gold'), g, edgeX(k), -CU / 2, Z(STRIP.top + len / 2));
    contacts.push({ id, net, position: new THREE.Vector3(edgeX(k), T + CU, Z(STRIP.top + len / 2)) });
  });

  // the 5 x 5 display
  const leds = [];
  for (let row = 0; row < 5; row++) for (let col = 0; col < 5; col++) {
    const [px, py] = LED_AT(col, row), id = `led-${row + 1}-${col + 1}`;
    const g = part(id, { name: `LED row ${row + 1}, column ${col + 1}`, category: 'led', description: 'One of the 25 red LEDs (0603: 1.6 x 0.8 mm) in the 5 x 5 display. They are wired as a matrix of rows and columns, and code lights them a row at a time, faster than you can see.' });
    const L = led(g, X(px), T, Z(py), 0xff2a14);
    leds.push({ id, col, row, level: 0, target: 0, ...L });
  }

  // buttons A and B, the touch logo, the microphone LED
  const buttons = {};
  for (const k of ['A', 'B']) {
    const [px, py] = BUTTON_AT[k], g = part('button-' + k.toLowerCase(), { name: 'Button ' + k, category: 'input', button: k,
      description: `6 mm tactile switch, 4.55 mm tall. Reads as pressed on pin ${k === 'A' ? 5 : 11} when you push it.` }, root, 0, T, 0);
    buttons[k] = { ...tactile(g, X(px), Z(py)), part: 'button-' + k.toLowerCase(), pressed: false, y: 2.85 };
  }
  {
    const g = part('touch-logo', { name: 'Touch logo', category: 'input', description: 'A gold pad that senses your finger (capacitive touch): a third button you do not have to press.' });
    const s = new THREE.Shape(); roundRectPath(s, X(LOGO[0]), -Z(LOGO[1]), 10.1, 4.8, 2.4);
    s.holes.push(roundRectPath(new THREE.Path(), X(LOGO[0]), -Z(LOGO[1]), 8.4, 3.1, 1.55));
    const eye = (dx) => new THREE.Shape().absarc(X(LOGO[0]) + dx, -Z(LOGO[1]), 0.55, 0, Math.PI * 2, false);
    mesh(geo('logo', () => flat(new THREE.ExtrudeGeometry([s, eye(-2.15), eye(2.15)], { depth: CU * 1.4, bevelEnabled: false, curveSegments: 24 }))), mat('gold'), g, 0, T, 0);
  }
  const status = {};
  { const g = part('mic-led', { name: 'Microphone LED', category: 'led', description: 'Lights red while the microphone is listening. The small hole beside it lets sound through to the microphone on the back.' });
    status.mic = { level: 0, target: 0, ...led(g, X(35.5), T, Z(MIC_HOLE[1]), 0xff2a14, true) }; }

  // ---- the back: parts placed in back-view coordinates (bx from the left of the back view, by down from the USB edge)
  {
    const g = part('usb', { name: 'Micro USB socket', description: 'Power and programming. Plug in a cable, then drag your program onto the board like copying a file.' }, back);
    const x = BX(25.8), z = Z(1.9);
    mesh(geo('usbShell', () => rbox(7.5, 2.5, 5.0, 0.35)), mat('steel'), g, x, 1.25, z);
    mesh(geo('usbMouth', () => rbox(6.6, 1.7, 0.1, 0.04)), mat('cavity'), g, x, 1.25, z - 2.53);
    mesh(geo('usbTongue', () => new THREE.BoxGeometry(4.8, 0.32, 0.12)), mat('plastic'), g, x, 1.45, z - 2.56);
    for (const s of [-1, 1]) mesh(geo('usbTab', () => rbox(1.2, 0.3, 1.5, 0.08)), mat('tin'), g, x + s * 4.25, 0.15, z + 1.0);
    for (let i = 0; i < 5; i++) mesh(geo('usbLeg', () => new THREE.BoxGeometry(0.4, 0.15, 0.8)), mat('tin'), g, x - 1.3 + i * 0.65, 0.08, z + 2.75);
    const front = part('usb', {}, root);   // the shell's through-hole tabs show on the front as two solder dots
    for (const s of [-1, 1]) mesh(geo('usbDot', () => new THREE.CylinderGeometry(0.55, 0.62, 0.14, 20)), mat('tin'), front, s * 3.65, T + 0.07, Z(1.2));
  }
  {
    const g = part('reset-button', { name: 'Reset and power button', category: 'input', button: 'RESET', description: 'Press to restart your program. Hold it to switch the board off; press again to wake it.' }, back);
    buttons.RESET = { ...tactile(g, BX(34.3), Z(4.6)), part: 'reset-button', pressed: false, y: 2.85 };
  }
  {
    const g = part('battery-connector', { name: 'Battery socket', description: '2-pin JST socket on a 2.0 mm pitch for the battery: 3 to 3.3 V in, such as the 3.3 V lead of a 2 x 18650 holder. At 5.5 mm it is the tallest part on the board.' }, back);
    const x = BX(43.85), z = Z(4.3);
    mesh(geo('batBody', () => rbox(6.2, 5.5, 6.0, 0.35)), mat('nylon'), g, x, 2.75, z);
    mesh(geo('batMouth', () => rbox(4.9, 3.6, 0.1, 0.05)), mat('cavity'), g, x, 2.6, z - 3.03);
    mesh(geo('batLatch', () => rbox(2.4, 0.35, 1.6, 0.1)), mat('nylon'), g, x, 5.6, z - 1.6);
    for (const s of [-1, 1]) {
      mesh(geo('batPin', () => new THREE.BoxGeometry(0.5, 0.5, 1.2)), mat('gold'), g, x + s * 1.0, 2.4, z - 2.5);
      mesh(geo('batTab', () => new THREE.BoxGeometry(0.35, 1.6, 2.2)), mat('tin'), g, x + s * 3.28, 0.8, z + 0.6);
      mesh(geo('batLead', () => new THREE.BoxGeometry(0.6, 0.25, 1.4)), mat('tin'), g, x + s * 1.0, 0.13, z + 3.5);
    }
  }
  qfn(part('processor', { name: 'Processor (nRF52833)', description: 'Runs your code: a 64 MHz Arm Cortex-M4F with 512 KB flash and 128 KB RAM, plus the Bluetooth radio. 7 x 7 mm.' }, back),
    BX(10.0), Z(14.6), 7.0, 0.85, 12, [['N52833', 1.0, 700], ['QIAAA0', 0.8, 600], ['2219AB', 0.75, 600]]);
  qfn(part('usb-interface', { name: 'USB interface chip (KL27Z)', description: 'Looks after USB: copies a program you drag onto the board into the processor, and passes serial messages to your computer. 5 x 5 mm.' }, back),
    BX(39.9), Z(15.4), 5.0, 1.0, 8, [['KL27Z256', 0.72, 700], ['VFM4', 0.7, 600]]);
  { const g = part('motion-sensor', { name: 'Motion sensor (LSM303AGR)', description: 'Accelerometer and compass in one 2 x 2 mm chip: senses tilt, shakes, falls and which way is north.' }, back);
    mesh(geo('lga', () => rbox(2.0, 1.0, 2.0, 0.1)), mat('epoxy'), g, BX(4.4), 0.5, Z(25.3)); marks(g, BX(4.4), 1.02, Z(25.3), 1.8, 1.0, [['303', 0.6, 700]]); }
  { const g = part('speaker', { name: 'Speaker', description: '9 mm magnetic speaker (8.5 x 8.5 x 3.0 mm) for sounds and music.' }, back);
    const x = BX(30.5), z = Z(21.5);
    mesh(geo('spkBody', () => rbox(8.5, 2.7, 8.5, 0.6)), mat('speaker'), g, x, 1.35, z);
    mesh(geo('spkRim', () => new THREE.CylinderGeometry(3.1, 3.3, 0.3, 48)), mat('speakerRim'), g, x, 2.85, z);
    mesh(geo('spkHole', () => new THREE.CylinderGeometry(0.95, 0.95, 0.04, 32)), mat('cavity'), g, x, 3.01, z);
    for (const s of [-1, 1]) mesh(geo('spkTab', () => rbox(1.2, 0.3, 1.8, 0.08)), mat('tin'), g, x + s * 4.6, 0.15, z); }
  { const g = part('microphone', { name: 'Microphone', description: 'MEMS microphone (3.76 x 2.95 mm). It hears through the small hole next to the logo on the front.' }, back);
    const x = BX(18.0), z = Z(MIC_HOLE[1]);
    mesh(geo('micBase', () => new THREE.BoxGeometry(3.76, 0.3, 2.95)), mat('micBase'), g, x, 0.15, z);
    mesh(geo('micCan', () => rbox(3.5, 0.8, 2.7, 0.15)), mat('steel'), g, x, 0.7, z); }
  { const g = part('antenna', { name: 'Bluetooth antenna', description: 'The zig-zag copper trace is the 2.4 GHz antenna for Bluetooth and for radio messages between boards. Keep metal away from it.' }, back);
    const pts = [[2.4, 5.6], [2.4, 2.2], [4.9, 2.2], [4.9, 5.6], [7.4, 5.6], [7.4, 2.2], [9.9, 2.2], [9.9, 5.6], [12.4, 5.6]];
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], len = Math.hypot(bx - ax, by - ay) + 0.45;
      const m = mesh(new THREE.BoxGeometry(len, CU, 0.45), mat('antenna'), g, BX((ax + bx) / 2), CU / 2, Z((ay + by) / 2)); m.rotation.y = -Math.atan2(by - ay, bx - ax); m.castShadow = false;
    } }
  { const g = part('crystal', { name: '32 MHz crystal', description: 'Keeps the processor and its radio in time (3.2 x 2.5 mm).' }, back);
    mesh(geo('xtalBase', () => rbox(3.2, 0.25, 2.5, 0.08)), mat('ceramic'), g, BX(10.0), 0.125, Z(20.4));
    mesh(geo('xtalLid', () => rbox(2.8, 0.35, 2.1, 0.1)), mat('steel'), g, BX(10.0), 0.42, Z(20.4)); }
  { const g = part('regulator', { name: 'Voltage regulator', description: 'Turns the 5 V from USB into the steady 3.3 V the board runs on.' }, back);
    mesh(geo('dfn4', () => rbox(1.0, 0.4, 1.0, 0.06)), mat('epoxy'), g, BX(36.8), 0.2, Z(9.3)); }
  { const g = part('led-power', { name: 'Power LED (red)', category: 'led', description: 'On whenever the board has power.' }, back);
    status.power = { level: 0, target: 0, ...led(g, BX(20.4), 0, Z(3.8), 0xff2a14, true) }; }
  { const g = part('led-usb', { name: 'USB LED (yellow)', category: 'led', description: 'Flashes while a program is being copied over USB.' }, back);
    status.usb = { level: 0, target: 0, ...led(g, BX(20.4), 0, Z(2.0), 0xffb000, true) }; }
  // small parts round the chips: each one its own part, named by its reference designator
  for (const [ref, bx, by, kind, along] of [
    ['C5', 5.6, 12.0, 'c0402'], ['C8', 5.6, 13.4, 'c0402'], ['C10', 5.6, 16.6, 'c0402'], ['C14', 14.6, 12.6, 'c0402', true], ['C16', 14.6, 16.0, 'c0402', true], ['R4', 14.6, 17.4, 'r0402'],
    ['L3', 12.4, 19.0, 'c0402'], ['C2', 7.4, 19.4, 'c0402'], ['C4', 12.8, 21.6, 'c0402', true], ['C23', 36.0, 13.6, 'c0402', true], ['C25', 36.0, 15.8, 'c0402', true], ['R19', 36.0, 17.4, 'r0402'],
    ['C26', 43.6, 14.2, 'c0402', true], ['C28', 43.6, 16.6, 'c0402', true], ['R22', 40.0, 19.4, 'r0402'], ['R59', 20.6, 6.2, 'r0805', true], ['C20', 30.9, 3.0, 'c0603', true], ['C52', 21.0, 8.6, 'c0402'],
    ['C21', 38.6, 9.4, 'c0603'], ['R17', 24.6, 24.4, 'r0402', true], ['T3', 36.5, 30.6, 'sc75'], ['T4', 38.9, 30.6, 'sc75'], ['T5', 41.3, 30.6, 'sc75'], ['T7', 43.7, 30.6, 'sc75'], ['T2', 24.6, 22.0, 'sc75', true],
  ]) {
    const type = ref[0] === 'C' ? 'Capacitor' : ref[0] === 'R' ? 'Resistor' : ref[0] === 'L' ? 'Inductor' : 'Transistor';
    const description = { Capacitor: 'Ceramic capacitor: smooths the supply right beside a chip.', Resistor: 'Resistor: sets a current or holds a signal at a known level.',
      Inductor: 'Tiny inductor that tunes the radio path to the antenna.', Transistor: 'Small transistor that switches one row of the LED display.' }[type];
    chip(part(ref.toLowerCase(), { name: `${type} ${ref}`, category: 'passive', description: `${description} Package: ${{ c0402: '0402 (1.0 x 0.5 mm)', r0402: '0402 (1.0 x 0.5 mm)', c0603: '0603 (1.6 x 0.8 mm)', r0805: '0805 (2.0 x 1.25 mm)', sc75: 'SC-75 (1.6 x 0.8 mm)' }[kind]}.` }, back), BX(bx), Z(by), kind, !!along);
  }

  // every mesh learns which part it belongs to; decals and glows are left out of picking
  const pickables = [];
  root.traverse((o) => {
    if (!o.isMesh || o.userData.decal) return;
    let p = o; while (p && !p.userData.rbsPart) p = p.parent;
    if (!p) return;
    o.userData.rbsPart = p.userData.rbsPart; parts.get(p.userData.rbsPart).meshes.push(o); pickables.push(o);
  });
  for (const l of leds) for (const m of parts.get(l.id).meshes) m.userData.led = l;
  for (const k of Object.keys(buttons)) for (const m of parts.get(buttons[k].part).meshes) m.userData.button = k;
  for (const p of pins) for (const m of parts.get(p.part).meshes) m.userData.pin = p.id;

  // highlight: selection tints a part and frames it; hover only frames it
  const tints = new Map(), frames = {};
  const tinted = (m, color) => {
    const key = m.uuid + color; if (!tints.has(key)) { const t = m.clone(); if (t.emissive) { t.emissive = new THREE.Color(color); t.emissiveIntensity = 0.38; } tints.set(key, t); }
    return tints.get(key);
  };
  const boxOf = (id) => {
    const box = new THREE.Box3(), inv = new THREE.Matrix4(), m4 = new THREE.Matrix4(); root.updateMatrixWorld(true); inv.copy(root.matrixWorld).invert();
    for (const m of parts.get(id)?.meshes || []) { if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); box.union(m.geometry.boundingBox.clone().applyMatrix4(m4.multiplyMatrices(inv, m.matrixWorld))); }
    return box.expandByScalar(0.25);
  };
  const frame = (slot, id, color) => {
    if (frames[slot]) { root.remove(frames[slot]); frames[slot].geometry.dispose(); frames[slot].material.dispose(); frames[slot] = null; }
    if (!id || !parts.has(id)) return;
    const h = new THREE.Box3Helper(boxOf(id), color); h.material.depthTest = false; h.material.transparent = true; h.material.opacity = slot === 'hover' ? 0.55 : 0.95; h.renderOrder = 10; h.raycast = () => {};
    root.add(h); frames[slot] = h;
  };
  let selected = null, hovered = null;
  const paint = (id, on) => { for (const m of parts.get(id)?.meshes || []) {
    if (m.userData.led || (m.material && m.material.transparent)) continue;
    if (on) { m.userData.baseMat = m.userData.baseMat || m.material; m.material = Array.isArray(m.material) ? m.material.map((x) => tinted(x, opts.highlightColor)) : tinted(m.material, opts.highlightColor); }
    else if (m.userData.baseMat) { m.material = m.userData.baseMat; delete m.userData.baseMat; }
  } };

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const bit = {
    group: root, spec: RBS_BIT_SPEC, parts, pickables, pins, contacts, leds, buttons, status,
    /** part info by id: { id, name, category, description, meshes } */
    info: (id) => parts.get(id) || null,
    /** what a picked mesh belongs to */
    resolve(object) {
      const u = object && object.userData; if (!u || !u.rbsPart) return { part: null, led: null, pin: null, button: null };
      return { part: u.rbsPart, led: u.led || null, pin: u.pin || null, button: u.button || null };
    },
    highlight(id) { if (selected === id) return; if (selected) paint(selected, false); selected = id && parts.has(id) ? id : null; if (selected) paint(selected, true); frame('sel', selected, opts.highlightColor); },
    hover(id) { if (hovered === id) return; hovered = id && parts.has(id) && id !== 'pcb' ? id : null; frame('hover', hovered === selected ? null : hovered, opts.hoverColor); },
    get selected() { return selected; },
    /** LEDs: column and row 0-4; on is true/false or a brightness 0-1 */
    setLed(col, row, on) { const l = leds[row * 5 + col]; if (l) l.target = on === true ? 1 : on === false ? 0 : clamp01(+on || 0); },
    getLed: (col, row) => leds[row * 5 + col]?.target ?? 0,
    toggleLed(col, row) { const l = leds[row * 5 + col]; if (l) l.target = l.target > 0.5 ? 0 : 1; return l ? l.target : 0; },
    /** 25 brightness values, or five strings of 0-9 like '09090' */
    setDisplay(v) { const a = Array.isArray(v) && typeof v[0] === 'string' ? v.join('').split('').map((d) => +d / 9) : v; for (let i = 0; i < 25; i++) leds[i].target = clamp01(+a[i] || 0); },
    clearDisplay() { for (const l of leds) l.target = 0; },
    pressButton(id, down = true) { const b = buttons[id]; if (b) b.pressed = !!down; },
    isPressed: (id) => !!buttons[id]?.pressed,
    setStatusLed(id, on) { if (status[id]) status[id].target = on === true ? 1 : on === false ? 0 : clamp01(+on || 0); },
    /** the colour of the printed design: the sawtooth over the top-left corner and the A and B flags (a name from RBS_BIT_DESIGN_COLORS, or any THREE colour) */
    setDesignColor(color) {
      if (!own.print) { own.print = mat('cyan').clone(); printMesh.material = own.print; }
      own.print.color.set(RBS_BIT_DESIGN_COLORS[color] ?? color ?? RBS_BIT_DESIGN_COLORS.cyan);
    },
    /** the solder mask colour (any THREE colour, or a name from RBS_BIT_COLORS); the routed edge follows it */
    setBoardColor(color) {
      const col = new THREE.Color(RBS_BIT_COLORS[color] ?? color ?? RBS_BIT_COLORS.black);
      if (!own.mask) { own.mask = mat('mask').clone(); own.edge = mat('edge').clone(); pcbMesh.material = [own.mask, own.edge]; }
      own.mask.color.copy(col); own.edge.color.copy(col).lerp(new THREE.Color(0x8a7f62), 0.35);
    },
    /** call every frame with the time step in seconds */
    update(dt = 1 / 60) {
      const k = 1 - Math.exp(-Math.max(0, dt) / 0.012), kb = 1 - Math.exp(-Math.max(0, dt) / 0.03);
      for (const l of [...leds, ...Object.values(status)]) { l.level += (l.target - l.level) * k; l.lens.emissiveIntensity = l.level * 4.2; l.glow.material.opacity = l.level * 0.95; l.glow.visible = l.level > 0.003; }
      for (const b of Object.values(buttons)) { const want = b.rest - (b.pressed ? b.travel : 0); b.actuator.position.y += (want - b.actuator.position.y) * kb; }
    },
    dispose() {
      frame('sel', null); frame('hover', null);
      for (const t of tints.values()) t.dispose();
      own.mask?.dispose(); own.edge?.dispose(); own.print?.dispose();
      for (const l of [...leds, ...Object.values(status)]) { l.lens.dispose(); l.glow.material.dispose(); }
      root.traverse((o) => { if (o.userData.decal && o.material && !o.material.map?.isCanvasTexture) o.material.dispose(); });
      root.removeFromParent();
    },
  };
  if (opts.boardColor) bit.setBoardColor(opts.boardColor);
  if (opts.designColor) bit.setDesignColor(opts.designColor);
  return bit;
}

/** colours for the printed design */
export const RBS_BIT_DESIGN_COLORS = Object.freeze({ cyan: 0x00b5ff, orange: 0xff7a1a, green: 0x22c55e, pink: 0xff4fa3, purple: 0x9b5cff, yellow: 0xffcc00, red: 0xff3b3b, white: 0xf2f2f2 });

/** solder mask colours the board comes in */
export const RBS_BIT_COLORS = Object.freeze({ black: 0x141416, blue: 0x123c8c, green: 0x0c5e36, red: 0x8f1a22, purple: 0x40247f, teal: 0x0b5d66 });

/** which views a viewer can offer, as camera directions in the board's own frame (front up) */
export const RBS_BIT_VIEWS = Object.freeze({
  front: { dir: [0, 1, 0], up: [0, 0, -1] }, back: { dir: [0, -1, 0], up: [0, 0, -1] },
  top: { dir: [0, 0, -1], up: [0, 1, 0] }, bottom: { dir: [0, 0, 1], up: [0, -1, 0] },
  left: { dir: [-1, 0, 0], up: [0, 1, 0] }, right: { dir: [1, 0, 0], up: [0, 1, 0] },
});
