/* ---- 4WD Robot Car (18650 Edition) section ----
   The "4-Wheel Drive Robot Car Chassis – 18650 Edition" as a lab part (TYPES.car4wd). It has four TT gear motors
   (terminal-block pins FL± FR± RL± RR±) and its own 2 × 18650 holder (B+ B−), wired to any motor driver like other motor leads.
   The car itself drives on the lab's own workplane, in the lab's own viewport and frame loop: the car, the boards and sensors
   mounted on it (props.onCar) and their wires move together as one rigid assembly, driven by fixed-step skid-steer physics fed by a
   DC motor model, the motor driver's model and a battery model. The table's lines, obstacles and lamps sit on the same workplane,
   and mounted sensors (props.carMount) read them. Manual driving (joystick, keys, buttons, voice) and programs use the same motors.
   Source: robot4wd/car4wd-core.js, projects.js, sensors.js, amsr3.js, car4wd-hud.js, spliced in by robot4wd/splice.py.
   Modules: 1 profiles · 2 mechanical model · 3 motor + battery models · 4 physics + collisions · 5 environment · 6 sensors ·
   7 the part · (hud file) 8 the table, overlays and robot panel in the lab's viewport · 9 API.
   Values not taken from verified documents are marked "illustrative" and can be edited (props.cfg). */

// ---- 1. profiles (developer configuration; a car's props.cfg overrides any of them) ----
const CAR4 = {
  name: '4-Wheel Drive Robot Car Chassis – 18650 Edition', short: '4WD Robot Car',
  // mm. Car axes: x forward, y up, z to the right (the left wheels sit at −z).
  dims: { length: 210, width: 150, plateT: 3, plateHalfW: 47.5, bumperHalfW: 66, standoff: 25, wheelD: 65, wheelW: 26, wheelbase: 124, track: 124,
    motorZ: 34.5, motorW: 18.5, holderL: 77, holderW: 41, holderX: -62, blockX: -15, stripX: -2, bayX: [8, 100] },
  dimsSource: 'Preliminary: from the reference sheet (210 × 150 × 70 mm, Ø65 × 26 mm wheels, 3 mm plates, 25 mm standoffs), not measured from a kit',
  motor: { ratedV: 6, noLoadRpm: 200, noLoadA: 0.12, stallA: 0.8, gear: 48, J: 2.5e-4 },
  motorSource: 'Illustrative TT gear-motor values: the sheet only gives 3–6 V and about 1:48. Enter your motor’s datasheet values',
  battery: { wiring: '2P', mAh: 2000, rCell: 0.06, maxA: 5 },
  batterySource: '2P (parallel, 3.7 V) matches the lab’s 18650 holder as you confirmed. Capacity, internal resistance and current limit are illustrative: read your cells’ label',
  phys: { mass: 0.45, mu: 0.8, muLat: 0.6, crr: 0.03, kSlip: 25 },
  physSource: 'Illustrative: about the kit’s mass with two cells, and rubber tyres on a table top',
  sensors: { lineSpacing: 18, lineHeight: 10, usMin: 20, usMax: 4000, usFov: 15 },
  H: 0.001,   // physics step (s), fixed whatever the frame rate
};
const CAR4_M = ['FL', 'FR', 'RL', 'RR'];
const CAR4_MN = { FL: 'Front Left', FR: 'Front Right', RL: 'Rear Left', RR: 'Rear Right' };
const CAR4_PINS = ['FL+', 'FL-', 'RL+', 'RL-', 'B+', 'B-', 'RR+', 'RR-', 'FR+', 'FR-'];
const CAR4_STRIP = ['V1', 'V2', 'V3', 'V4', 'G1', 'G2', 'G3', 'G4'];   // a small power strip for the sensors: the V pins are joined, the G pins are ground
const car4Cfg = (c, k) => ({ ...CAR4[k], ...((c && c.props && c.props.cfg && c.props.cfg[k]) || {}) });
const car4Side = (m) => (m[1] === 'L' ? -1 : 1);
const car4Lv = (D) => { const y0 = D.wheelD / 2 + 11.5; return { y0, y1: y0 + D.plateT + D.standoff, top: y0 + 2 * D.plateT + D.standoff }; };
const car4WheelAt = (m, D) => new V3((m[0] === 'F' ? 1 : -1) * D.wheelbase / 2, D.wheelD / 2, car4Side(m) * D.track / 2);
// where sensors mount on the car (car mm; yaw in degrees, + turns toward the left)
const CAR4_MOUNTS = {
  us: { name: 'Front centre', types: ['ultrasonic'], x: 104, y: 84, z: 0, yaw: 0 },
  irOL: { name: 'Front left, obstacle', types: ['ir'], x: 100, y: 58, z: -40, yaw: 12 },
  irOR: { name: 'Front right, obstacle', types: ['ir'], x: 100, y: 58, z: 40, yaw: -12 },
  ldrL: { name: 'Front left', types: ['ldr', 'ldra'], x: 100, y: 80, z: -50, yaw: 25 },
  ldrR: { name: 'Front right', types: ['ldr', 'ldra'], x: 100, y: 80, z: 50, yaw: -25 },
  lnL: { name: 'Under the front, left', types: ['irline'], x: 100, z: -1, down: true },
  lnC: { name: 'Under the front, centre', types: ['irline'], x: 100, z: 0, down: true },
  lnR: { name: 'Under the front, right', types: ['irline'], x: 100, z: 1, down: true },
};
function car4MountAt(c, id) {   // a mount's position (car mm) and facing
  const m = CAR4_MOUNTS[id]; if (!m) return null; const S = car4Cfg(c, 'sensors');
  if (m.down) return { x: m.x, y: S.lineHeight, z: m.z * S.lineSpacing, yaw: 0, down: true };
  return { x: m.x, y: m.y, z: m.z, yaw: m.yaw || 0, down: false };
}

// ---- 2. the mechanical model: every component its own group with an id, a name, its parts and an exploded-view offset ----
function car4Mats() {
  if (car4Mats.m) return car4Mats.m;
  const std = (o) => new THREE.MeshStandardMaterial(o), phy = (o) => new THREE.MeshPhysicalMaterial(o);
  return (car4Mats.m = {
    acrylic: phy({ color: 0xeaf4ff, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.2 }),
    edge: new THREE.LineBasicMaterial({ color: 0x86b8e2, transparent: true, opacity: 0.9 }),
    yellow: phy({ color: 0xf6c21c, roughness: 0.46, clearcoat: 0.3, clearcoatRoughness: 0.45 }),
    rim: phy({ color: 0xffc914, roughness: 0.36, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
    black: std({ color: 0x1b1b1f, roughness: 0.82 }),
    cell: phy({ color: 0x2d61cf, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15 }),
    nickel: std({ color: 0xd3d6db, metalness: 1, roughness: 0.24 }),
    steel: std({ color: 0xc4c8cd, metalness: 1, roughness: 0.3 }),
    brass: std({ color: 0xc8a046, metalness: 1, roughness: 0.3 }),
  });
}
const CAR4_PARTS = {   // id → name, what it is, what it is made of
  chassis_top: ['Top Chassis Plate', 'Laser-cut transparent acrylic, 3 mm. Carries the battery holder, the terminal block and the sensors.', 'Transparent acrylic'],
  chassis_bottom: ['Bottom Chassis Plate', 'Laser-cut transparent acrylic, 3 mm. The four motors hang under it on their brackets.', 'Transparent acrylic'],
  motor_front_left: ['Front Left Motor', 'TT DC gear motor: yellow gearbox, metal motor can, output shaft to the wheel.', 'Yellow plastic, steel can'],
  motor_front_right: ['Front Right Motor', 'TT DC gear motor, mounted mirrored: the same wiring turns it the other way round.', 'Yellow plastic, steel can'],
  motor_rear_left: ['Rear Left Motor', 'TT DC gear motor.', 'Yellow plastic, steel can'],
  motor_rear_right: ['Rear Right Motor', 'TT DC gear motor, mounted mirrored.', 'Yellow plastic, steel can'],
  wheel_front_left: ['Front Left Wheel', 'Rubber tyre with tread on a yellow five-spoke rim, pushed onto the motor shaft.', 'Black rubber, yellow plastic'],
  wheel_front_right: ['Front Right Wheel', 'Rubber tyre on a yellow five-spoke rim.', 'Black rubber, yellow plastic'],
  wheel_rear_left: ['Rear Left Wheel', 'Rubber tyre on a yellow five-spoke rim.', 'Black rubber, yellow plastic'],
  wheel_rear_right: ['Rear Right Wheel', 'Rubber tyre on a yellow five-spoke rim.', 'Black rubber, yellow plastic'],
  battery_holder_18650: ['18650 Battery Holder', 'Two-cell holder: springs at the − ends, nickel contacts at the + ends, red and black output leads.', 'Matte black plastic, nickel'],
  battery_cell_1: ['18650 Cell 1', 'Cylindrical Li-ion cell, 18 × 65 mm.', 'Steel can in a printed wrap'],
  battery_cell_2: ['18650 Cell 2', 'Cylindrical Li-ion cell, 18 × 65 mm.', 'Steel can in a printed wrap'],
  motor_mounts: ['Motor Mounting Brackets', 'Eight acrylic brackets through slots in the bottom plate, two M3 screws through each motor.', 'Transparent acrylic, steel screws'],
  spacers: ['Brass Spacers', 'Six 25 mm hexagonal standoffs between the plates.', 'Brass'],
  screws: ['Screws and Washers', 'M3 pan-head screws with washers, top and bottom of each spacer.', 'Stainless steel'],
  power_strip: ['Sensor Power Strip', 'Eight pins for the sensors: V1–V4 are joined (feed them from the controller’s 5 V or 3.3 V), G1–G4 are ground. One wire per pin.', 'Black plastic, gold pins'],
  terminal_block: ['Terminal Block', 'Where the motor leads and the battery leads meet the driver’s wires: FL± RL± B± RR± FR±.', 'Black plastic, gold pins'],
  power_switch: ['Power Switch', 'Slide switch in the battery’s + lead.', 'Black plastic'],
  motor_wires: ['Motor Wires', 'A red and a black lead from each motor to the terminal block.', 'Red and black PVC'],
  battery_wires: ['Battery Wires', 'Red (+) and black (−) leads from the holder to the terminal block, through the switch.', 'Red and black PVC'],
};
const CAR4_MID = { FL: 'motor_front_left', FR: 'motor_front_right', RL: 'motor_rear_left', RR: 'motor_rear_right' };
const CAR4_WID = { FL: 'wheel_front_left', FR: 'wheel_front_right', RL: 'wheel_rear_left', RR: 'wheel_rear_right' };
function car4PlateGeo(D, bottom) {
  return cached(`car4Plate:${bottom ? 1 : 0}:${D.length}:${D.plateHalfW}:${D.bumperHalfW}:${D.wheelbase}:${D.wheelD}:${D.plateT}`, () => {
    const hl = D.length / 2, hw = D.plateHalfW, bw = D.bumperHalfW, xw = D.wheelbase / 2 + D.wheelD / 2 + 3, a = xw + 4, b = (4 * hl - a) / 3, s = new THREE.Shape();
    s.moveTo(xw, -hw); s.lineTo(-xw, -hw); s.lineTo(-xw, -bw + 4); s.quadraticCurveTo(-xw, -bw, -a, -bw);
    s.bezierCurveTo(-b, -bw * 0.55, -b, bw * 0.55, -a, bw); s.quadraticCurveTo(-xw, bw, -xw, bw - 4); s.lineTo(-xw, hw);
    s.lineTo(xw, hw); s.lineTo(xw, bw - 4); s.quadraticCurveTo(xw, bw, a, bw); s.bezierCurveTo(b, bw * 0.55, b, -bw * 0.55, a, -bw);
    s.quadraticCurveTo(xw, -bw, xw, -bw + 4); s.closePath();
    const hole = (x, y, r) => { const p = new THREE.Path(); p.absarc(x, y, r, 0, Math.PI * 2, true); s.holes.push(p); };
    const slot = (x, y, w, h) => { const p = new THREE.Path(); p.moveTo(x - w / 2, y - h / 2); p.lineTo(x + w / 2, y - h / 2); p.lineTo(x + w / 2, y + h / 2); p.lineTo(x - w / 2, y + h / 2); p.closePath(); s.holes.push(p); };
    for (const [x, z] of CAR4_SPACERS) hole(x, z, 1.7);
    for (const sz of [-1, 1]) { hole(-6, sz * 30, 4); hole(-62, sz * 30, 2.5); }                     // wire holes beside the terminal block; holder screw holes
    for (const sx of [-1, 1]) slot(sx * 72, 0, 16, 6);                                             // tie-wrap slots
    hole(0, 0, 6);
    if (bottom) {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const k of [-1, 1]) slot(sx * (D.wheelbase / 2 - 24), sz * (D.motorZ + k * (D.motorW / 2 + 1.5)), 30, 3.4);   // bracket slots
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) hole(sx * 10, sz * 20, 4);
    } else for (const sx of [-1, 1]) for (const sz of [-1, 1]) hole(sx * 58, sz * 30, 2.5);           // sensor bracket holes
    const g = new THREE.ExtrudeGeometry(s, { depth: D.plateT, bevelEnabled: false, curveSegments: 20 });
    g.rotateX(Math.PI / 2); g.translate(0, D.plateT, 0); return g;
  });
}
const CAR4_SPACERS = [[-80, -36], [-80, 36], [0, -36], [0, 36], [80, -36], [80, 36]];
function car4WheelBuild(side) {
  const mats = car4Mats(), spin = new THREE.Group(), body = new THREE.Group(); body.rotation.x = side > 0 ? Math.PI / 2 : -Math.PI / 2; spin.add(body);
  const g = new THREE.Group(); g.scale.y = 26 / 24; g.position.y = -13; body.add(g);
  mesh(cached('car4Tyre', () => new THREE.LatheGeometry([[25.5, 0], [31.2, 0], [32.5, 1.6], [32.5, 22.4], [31.2, 24], [25.5, 24], [25.5, 0]].map(([x, y]) => new V2(x, y)), 64)), M.tyre, g);
  const tread = new THREE.InstancedMesh(cached('car4Tread', () => new THREE.BoxGeometry(1.4, 20, 2.2)), M.tyre, 36), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new V3(1, 1, 1);
  for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; q.setFromAxisAngle(new V3(0, 1, 0), -a); tread.setMatrixAt(i, m4.compose(new V3(Math.cos(a) * 32.7, 12, Math.sin(a) * 32.7), q, one)); }
  tread.castShadow = true; g.add(tread);
  mesh(cached('car4Rim', () => new THREE.LatheGeometry([[23.5, 0.6], [25.6, 0.6], [25.6, 23.4], [23.5, 23.4], [23.5, 0.6]].map(([x, y]) => new V2(x, y)), 64)), mats.rim, g);
  mesh(cached('car4Disc', () => new THREE.CylinderGeometry(23.6, 23.6, 2.2, 48)), mats.rim, g, 0, 12, 0);
  mesh(cached('car4Boss', () => new THREE.CylinderGeometry(6, 6, 13, 28)), mats.rim, g, 0, 8, 0);
  for (let k = 0; k < 5; k++) { const sp = mesh(cached('car4Spoke', () => new THREE.BoxGeometry(18, 4.2, 4)), mats.rim, g, 0, 15.5, 0); const a = k * Math.PI * 2 / 5; sp.position.set(Math.cos(a) * 14.5, 15.5, Math.sin(a) * 14.5); sp.rotation.y = -a; }
  mesh(cached('car4Cap', () => new THREE.CylinderGeometry(4.2, 4.2, 1.2, 24)), mats.black, g, 0, 17.8, 0);
  return spin;
}
function car4MotorBuild(D) {   // built as the front-right motor: shaft at the origin pointing +z, the body running back toward −x
  const mats = car4Mats(), g = new THREE.Group(), W = D.motorW;
  mesh(cached('car4GbEnd:' + W, () => new THREE.CylinderGeometry(11, 11, W, 36).rotateX(Math.PI / 2)), mats.yellow, g);
  mesh(cached('car4Gb:' + W, () => rbox(36, 22, W, 2)), mats.yellow, g, -18, 0, 0);
  mesh(cached('car4MCan', () => new THREE.CylinderGeometry(9.6, 9.6, 22, 36).rotateZ(Math.PI / 2)), M.alu, g, -47, 0, 0);
  mesh(cached('car4MCap', () => new THREE.CylinderGeometry(8.8, 8.8, 3, 32).rotateZ(Math.PI / 2)), mats.black, g, -59.5, 0, 0);
  for (const y of [-4, 4]) mesh(cached('car4Tab', () => rbox(1.2, 3, 2.2, 0.2)), mats.brass, g, -61.6, y, 0);
  mesh(cached('car4Shaft', () => new THREE.CylinderGeometry(2.7, 2.7, 7, 20).rotateX(Math.PI / 2)), M.potWhite, g, 0, 0, W / 2 + 3.5);
  for (const y of [-7, 7]) {   // two M3 screws through both brackets and the gearbox, a nut on the far side
    mesh(cached('car4Bolt:' + W, () => new THREE.CylinderGeometry(1.5, 1.5, W + 10, 12).rotateX(Math.PI / 2)), mats.steel, g, -26, y, 0);
    mesh(cached('car4BoltH', () => new THREE.CylinderGeometry(2.8, 2.8, 1.8, 18).rotateX(Math.PI / 2)), mats.steel, g, -26, y, W / 2 + 5.4);
    mesh(cached('car4Nut', () => new THREE.CylinderGeometry(3.1, 3.1, 2.4, 6).rotateX(Math.PI / 2)), mats.steel, g, -26, y, -(W / 2 + 5.5));
  }
  return g;
}
function car4Tube(pts, r = 0.6) { return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new V3(x, y, z)), false, 'centripetal'), Math.max(24, pts.length * 10), r, 7); }
// the whole car: { g, parts: Map(id → { id, g, explode }), spin: { FL: group }, pins: [{ id, x, y, z }], cells, D }
function car4Model(opt = {}) {
  const D = { ...CAR4.dims, ...(opt.dims || {}) }, mats = car4Mats(), L = car4Lv(D), root = new THREE.Group(), parts = new Map(), spin = {};
  const part = (id, ex = [0, 0, 0]) => { const g = new THREE.Group(); g.userData.car4 = id; root.add(g); parts.set(id, { id, g, explode: new V3(...ex) }); return g; };
  const plate = (id, y, bottom, ex) => {
    const g = part(id, ex), geo = car4PlateGeo(D, bottom), m = mesh(geo, mats.acrylic, g, 0, y, 0); m.castShadow = false; m.renderOrder = 2;
    const e = new THREE.LineSegments(cached('car4PlateEdge:' + geo.uuid, () => new THREE.EdgesGeometry(geo, 25)), mats.edge); e.position.y = y; g.add(e);
  };
  plate('chassis_bottom', L.y0, true, [0, 0, 0]); plate('chassis_top', L.y1, false, [0, 70, 0]);
  // motors, brackets and wheels
  const mounts = part('motor_mounts', [0, -12, 0]);
  for (const m of CAR4_M) {
    const w = car4WheelAt(m, D), s = car4Side(m), front = m[0] === 'F';
    const mg = part(CAR4_MID[m], [0, -24, s * 22]), mo = car4MotorBuild(D); mo.position.set(w.x, w.y, s * D.motorZ); mo.scale.set(front ? 1 : -1, 1, s); mg.add(mo);
    for (const k of [-1, 1]) { const b = mesh(cached('car4Bracket', () => rbox(30, L.y0 + D.plateT - (D.wheelD / 2 - 11), 3, 0.6)), mats.acrylic, mounts, w.x - (front ? 24 : -24), (L.y0 + D.plateT + D.wheelD / 2 - 11) / 2, s * (D.motorZ + k * (D.motorW / 2 + 1.5))); b.castShadow = false; }
    const wg = part(CAR4_WID[m], [0, -24, s * 64]), sp = car4WheelBuild(s); sp.position.copy(w); wg.add(sp); spin[m] = sp;
  }
  // spacers and screws
  const spc = part('spacers', [0, 34, 0]), scr = part('screws', [0, 92, 0]);
  for (const [x, z] of CAR4_SPACERS) {
    mesh(cached('car4Standoff:' + D.standoff, () => new THREE.CylinderGeometry(2.6, 2.6, D.standoff, 6)), mats.brass, spc, x, L.y0 + D.plateT + D.standoff / 2, z);
    for (const [y, dir] of [[L.top, 1], [L.y0, -1]]) {
      mesh(cached('car4Washer', () => new THREE.CylinderGeometry(3.6, 3.6, 0.6, 20)), mats.steel, scr, x, y + dir * 0.3, z);
      mesh(cached('car4Head', () => new THREE.CylinderGeometry(2.9, 2.9, 1.9, 20)), mats.steel, scr, x, y + dir * 1.55, z);
    }
  }
  // the battery holder, its cells and leads, the switch and the terminal block on the top plate
  const T = L.top, hx = D.holderX, HL = D.holderL, HW = D.holderW, hold = part('battery_holder_18650', [0, 118, 0]);
  mesh(rbox(HL, 1.4, HW, 0.4), mats.black, hold, hx, T + 0.7, 0);
  for (const sz of [-1, 1]) mesh(rbox(HL, 12, 1.3, 0.4), mats.black, hold, hx, T + 6, sz * (HW / 2 - 0.65));
  for (const sx of [-1, 1]) mesh(rbox(3, 20, HW, 0.6), mats.black, hold, hx + sx * (HL / 2 - 1.5), T + 10, 0);
  mesh(rbox(HL - 8, 7, 1.2, 0.3), mats.black, hold, hx, T + 3.5, 0);
  const wiring = opt.wiring || '2P', cells = [];
  for (const [i, z] of [[1, -10.2], [2, 10.2]]) {
    const plus = wiring === '2S' && i === 2 ? -1 : 1, cg = part('battery_cell_' + i, [0, 150, (i === 1 ? -1 : 1) * 16]), cy = T + 1.4 + 9.3;
    const c = new THREE.Group(); c.position.set(hx, cy, z); cg.add(c); cells.push(c);
    mesh(cached('car4CellBody', () => new THREE.CylinderGeometry(9.2, 9.2, 63, 40).rotateZ(Math.PI / 2)), mats.cell, c);
    mesh(cached('car4CellEnd', () => new THREE.CylinderGeometry(8.9, 8.9, 0.8, 32).rotateZ(Math.PI / 2)), mats.nickel, c, plus * 31.8, 0, 0);
    mesh(cached('car4CellButton', () => new THREE.CylinderGeometry(3.4, 3.4, 1.4, 20).rotateZ(Math.PI / 2)), mats.nickel, c, plus * 32.6, 0, 0);
    mesh(cached('car4CellNeg', () => new THREE.CylinderGeometry(8.9, 8.9, 0.8, 32).rotateZ(Math.PI / 2)), mats.nickel, c, -plus * 31.8, 0, 0);
    piMark(c, 0, 9.25, 0, 30, 6.4, [['18650  3.7V', 1.0, 800]], '#ffffff', 0);
    const xin = HL / 2 - 3;   // the inside faces of the end walls
    mesh(cached('car4Contact', () => rbox(0.6, 11, 11, 0.2)), mats.nickel, hold, hx + plus * xin, cy, z);
    hold.add(new THREE.Mesh(helixTube(new V3(hx - plus * xin, cy, z), new V3(hx - plus * (xin - 4.2), cy, z), 3.6, 5, 0.42), mats.nickel));
  }
  const sw = part('power_switch', [0, 96, 0]), swx = -38, swz = 33;
  mesh(rbox(12, 6, 7, 0.8), mats.black, sw, swx, T + 3, swz); const knob = mesh(rbox(3.4, 2.4, 3.4, 0.6), car4Mats().nickel, sw, swx + 2.4, T + 7, swz);
  const tb = part('terminal_block', [0, 96, 0]), tbx = D.blockX, tbH = 8.5, pins = [];
  mesh(rbox(8, tbH, 54, 0.8), mats.black, tb, tbx, T + tbH / 2, 0);
  CAR4_PINS.forEach((id, k) => { const z = (k - 4.5) * 5.08; pins.push({ id, x: tbx, y: T + tbH, z }); mesh(PIN_GEO, M.gold, tb, tbx, T + tbH + 2.75, z); });
  const ps = part('power_strip', [0, 96, 0]), psx = D.stripX;
  mesh(rbox(7, 8.5, 42, 0.8), mats.black, ps, psx, T + 4.25, 0);
  mesh(rbox(7.2, 0.4, 20.4, 0.2), cached('car4StripRed', () => new THREE.MeshStandardMaterial({ color: 0xd8443a, roughness: 0.6 })), ps, psx, T + 8.6, -10.2);
  CAR4_STRIP.forEach((id, k) => { const z = (k - 3.5) * 5.08; pins.push({ id, x: psx, y: T + 8.5, z }); mesh(PIN_GEO, M.gold, ps, psx, T + 8.5 + 2.75, z); });
  const pinAt = (id) => pins.find((p) => p.id === id);
  // leads: the battery's through the switch to B+ and B−; each motor's red and black up through the plates to the block
  const bw = part('battery_wires', [0, 104, 0]), hf = hx + HL / 2;
  const bp = pinAt('B+'), bn = pinAt('B-');
  mesh(car4Tube([[hf - 1, T + 8, -4], [hf + 5, T + 4, -6], [swx - 8, T + 2, swz - 8], [swx - 6, T + 3, swz - 3]]), M.leadRed, bw);
  mesh(car4Tube([[swx + 6, T + 3, swz - 3], [swx + 12, T + 2, swz - 10], [tbx - 8, T + 2, bp.z], [tbx - 4.5, T + 4, bp.z]]), M.leadRed, bw);
  mesh(car4Tube([[hf - 1, T + 8, 4], [hf + 6, T + 2.5, 3], [tbx - 10, T + 2, bn.z], [tbx - 4.5, T + 4, bn.z]]), M.leadBlack, bw);
  const mw = part('motor_wires', [0, 0, 0]);
  for (const m of CAR4_M) {
    const s = car4Side(m), front = m[0] === 'F', tx = (front ? 1 : -1) * (D.wheelbase / 2 - 61.6), z = s * D.motorZ;
    for (const [pol, dy, mat] of [['+', 4, M.leadRed], ['-', -4, M.leadBlack]]) {
      const p = pinAt(m + pol), o = pol === '+' ? -1.2 : 1.2;
      mesh(car4Tube([[tx + (front ? -0.6 : 0.6), D.wheelD / 2 + dy, z], [tx + (front ? -3 : 3), L.y0 - 4, s * 24 + o], [(front ? 10 : -10), L.y0 + 1.5, s * 20 + o], [(front ? 8 : -8), L.y0 + 12, s * 19 + o],
        [-6 + o, L.y1 - 6, s * 30], [-6 + o, T + 1.6, s * 30], [tbx + 8, T + 2, p.z * 0.9], [tbx + 4.5, T + 4, p.z]], 0.55), mat, mw);
    }
  }
  root.traverse((o) => { if (o.isMesh) { let p = o; while (p && !p.userData.car4) p = p.parent; if (p) o.userData.car4 = p.userData.car4; } });
  return { g: root, parts, spin, pins, knob, cells, D, L };
}

// ---- 3. the DC motor model and the battery model ----
// A permanent-magnet DC motor at the gearbox output (the wheel): I = (V − Ke·ω)/R, torque = Kt·I, friction torque = Kt·I0.
function car4MotorK(mc) { const R = mc.ratedV / mc.stallA, w0 = mc.noLoadRpm * Math.PI / 30, Ke = Math.max(1e-4, (mc.ratedV - mc.noLoadA * R) / w0); return { R, Ke, Kt: Ke, tf: Ke * mc.noLoadA, J: mc.J }; }
// 18650 Li-ion open-circuit voltage against state of charge (a typical NMC/NCA curve, per cell; illustrative)
const CAR4_OCV = [[0, 3.0], [0.05, 3.3], [0.1, 3.45], [0.2, 3.55], [0.4, 3.65], [0.6, 3.76], [0.8, 3.92], [0.95, 4.1], [1, 4.2]];
function car4Ocv(soc) { soc = clamp(soc, 0, 1); for (let i = 1; i < CAR4_OCV.length; i++) if (soc <= CAR4_OCV[i][0]) { const [a, va] = CAR4_OCV[i - 1], [b, vb] = CAR4_OCV[i]; return va + (vb - va) * (soc - a) / (b - a); } return 4.2; }
function car4Pack(c) {
  const b = car4Cfg(c, 'battery'), s = b.wiring === '2S' ? 2 : 1, p = 3 - s, soc = c.state.soc ?? c.props.soc ?? 1, cell = car4Ocv(soc);
  return { wiring: s === 2 ? '2S' : '2P', s, p, soc, cell, voc: s * cell, rin: b.rCell * s / p, mAh: b.mAh * p, maxA: b.maxA * p, nominal: 3.7 * s, full: 4.2 * s };
}

// ---- 4. physics: fixed 1 ms steps, tyre traction with slip, skid-steer yaw with scrub, collisions ----
function car4Ph(c) {
  if (c.state.ph) return c.state.ph;
  const h = car4Home(c), z4 = () => ({ FL: 0, FR: 0, RL: 0, RR: 0 });
  return (c.state.ph = { x: h.x, z: h.z, th: h.th, v: 0, r: 0, w: z4(), ang: z4(), I: z4(), V: z4(), acc: 0, t: 0, hit: null, hitT: -9, trail: [], odo: 0, home: `${c.x},${c.z},${c.rot}` });
}
// the robot's home: where the car part stands on the table (its pose when nothing drives it)
function car4Home(c) { return { x: c.x, z: c.z, th: (-c.rot * Math.PI) / 2 }; }
const car4Ang = (a) => Math.atan2(Math.sin(a), Math.cos(a));
function car4Displaced(c, ph = car4Ph(c)) { const h = car4Home(c); return Math.abs(ph.x - h.x) > 0.3 || Math.abs(ph.z - h.z) > 0.3 || Math.abs(car4Ang(ph.th - h.th)) > 0.002; }
function car4Corners(x, z, th, D, grow = 0) { const hl = D.length / 2 + grow, hw = D.width / 2 + grow, cs = Math.cos(th), sn = Math.sin(th); return [[hl, hw], [hl, -hw], [-hl, -hw], [-hl, hw]].map(([a, b]) => [x + a * cs + b * sn, z - a * sn + b * cs]); }
function car4ObsShape(o, t) {   // an obstacle's footprint now (moving ones slide along their own x)
  const off = o.amp ? o.amp * Math.sin((t * 2 * Math.PI) / Math.max(0.5, o.period || 4)) : 0, r = (o.rot || 0) * deg;
  return { x: o.x + off * Math.cos(r), z: o.z - off * Math.sin(r), r, hw: o.w / 2, hd: o.d / 2, cyl: o.kind === 'cyl' };
}
function car4Overlap(poly, s) {   // car rectangle (4 corners) against a box (SAT) or a cylinder
  if (s.cyl) {
    const [a, b, c2] = poly, ux = [b[0] - a[0], b[1] - a[1]], vx = [c2[0] - b[0], c2[1] - b[1]];
    const cx = (a[0] + c2[0]) / 2, cz = (a[1] + c2[1]) / 2, lu = Math.hypot(...ux), lv = Math.hypot(...vx);
    const dx = s.x - cx, dz = s.z - cz, pu = (dx * ux[0] + dz * ux[1]) / lu, pv = (dx * vx[0] + dz * vx[1]) / lv;
    const qu = clamp(pu, -lu / 2, lu / 2), qv = clamp(pv, -lv / 2, lv / 2); return Math.hypot(pu - qu, pv - qv) < s.hw;
  }
  const cs = Math.cos(s.r), sn = Math.sin(s.r), box = [[s.hw, s.hd], [s.hw, -s.hd], [-s.hw, -s.hd], [-s.hw, s.hd]].map(([a, b]) => [s.x + a * cs + b * sn, s.z - a * sn + b * cs]);
  for (const P of [poly, box]) for (let i = 0; i < 4; i++) {
    const [x1, z1] = P[i], [x2, z2] = P[(i + 1) % 4], nx = -(z2 - z1), nz = x2 - x1;
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const [x, z] of poly) { const d = x * nx + z * nz; a0 = Math.min(a0, d); a1 = Math.max(a1, d); }
    for (const [x, z] of box) { const d = x * nx + z * nz; b0 = Math.min(b0, d); b1 = Math.max(b1, d); }
    if (a1 < b0 || b1 < a0) return false;
  }
  return true;
}
// the other parts standing on the table (not on the robot) are solid too
function car4Others(c) {
  const S = c.state, now = performance.now(); if (S.others && now - S.othersT < 250) return S.others;
  const mem = car4Members(c), out = [];
  for (const o of comps.values()) { if (mem.has(o) || o.owner != null || TYPES[o.type].prop || o.stack != null || o.dock != null || o.ins) continue; const f = o.foot || { w: 40, d: 40 }, odd = o.rot % 2 === 1; out.push({ c: o, x: o.x, z: o.z, hw: (odd ? f.d : f.w) / 2, hd: (odd ? f.w : f.d) / 2, r: 0, h: o.height || 30, cyl: false }); }
  S.others = out; S.othersT = now; return out;
}
// the lab's laptop stands on the same table: solid for the robot, and its open screen is tall enough for the ultrasonic to see
function car4UnderLaptop(x, z, m = 30) { const lp = car4Laptop(); if (!lp) return false; const cs = Math.cos(-lp.r), sn = Math.sin(-lp.r), lx = (x - lp.x) * cs + (z - lp.z) * sn, lz = -(x - lp.x) * sn + (z - lp.z) * cs; return Math.abs(lx) < lp.hw + m && Math.abs(lz) < lp.hd + m; }
function car4Laptop() { return typeof LAP !== 'undefined' && typeof laptop !== 'undefined' && laptop.group && laptop.group.visible !== false ? { x: LAP.x, z: LAP.z, hw: LAP.w / 2, hd: LAP.d / 2, r: LAP.yaw, h: 220, cyl: false } : null; }
function car4RayBox(ox, oz, dx, dz, s, maxD) {   // distance along the ray to a turned box, or null
  const cs = Math.cos(-s.r), sn = Math.sin(-s.r), lx = (ox - s.x) * cs + (oz - s.z) * sn, lz = -(ox - s.x) * sn + (oz - s.z) * cs, ldx = dx * cs + dz * sn, ldz = -dx * sn + dz * cs;
  let t0 = -Infinity, t1 = Infinity;
  for (const [p, q, hh] of [[lx, ldx, s.hw], [lz, ldz, s.hd]]) { if (Math.abs(q) < 1e-9) { if (p < -hh || p > hh) return null; } else { let a = (-hh - p) / q, b = (hh - p) / q; if (a > b) [a, b] = [b, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, b); } }
  return t0 <= t1 && t0 > 0 && t0 < maxD ? t0 : null;
}
function car4Collide(c, x, z, th, t) {
  const D = car4Cfg(c, 'dims'), E = car4Env(c), poly = car4Corners(x, z, th, D);
  for (const [px, pz] of poly) if (Math.abs(px) > E.table.w / 2 || Math.abs(pz) > E.table.d / 2) return { what: 'the table’s edge', cx: Math.abs(px) > E.table.w / 2 ? Math.sign(px) * 1e4 : x, cz: Math.abs(pz) > E.table.d / 2 ? Math.sign(pz) * 1e4 : z };
  for (const o of car4Others(c)) if (Math.hypot(o.x - x, o.z - z) < Math.hypot(o.hw, o.hd) + 140 && car4Overlap(poly, o)) return { what: `the ${TYPES[o.c.type].name}`, id: 'comp' + o.c.id, cx: o.x, cz: o.z };
  const lp = car4Laptop(); if (lp && Math.hypot(lp.x - x, lp.z - z) < 340 && car4Overlap(poly, lp)) return { what: 'the laptop', id: 'laptop', cx: lp.x, cz: lp.z };
  if (E.show.obstacles) for (const o of E.obstacles) { const s = car4ObsShape(o, t); if (Math.hypot(s.x - x, s.z - z) > Math.hypot(s.hw, s.hd) + 140) continue; if (car4Overlap(poly, s)) return { what: CAR4_OBK[o.kind] || 'an obstacle', id: o.id, cx: s.x, cz: s.z }; }
  if (E.show.light) for (const l of E.lights) if (Math.hypot(l.x - x, l.z - z) < 180 && car4Overlap(poly, { x: l.x, z: l.z, hw: 30, hd: 30, cyl: true })) return { what: 'the lamp’s base', id: l.id, cx: l.x, cz: l.z };
  return null;
}
// motor terminal voltages now: from the circuit (live), or from the arena's motor test bench (battery × duty)
function car4Volts(c) {
  const V = { FL: 0, FR: 0, RL: 0, RR: 0 }, src = c.props.src || 'circuit';
  if (src === 'manual') {
    const P = car4Pack(c), on = c.props.on !== false && P.soc > 0, drv = car4Driver(c), Vb = Math.max(0, P.voc - P.rin * (c.state.Iall || 0)), Vd = Vb >= drv.minV ? Math.max(0, Vb - drv.drop) : 0, M = c.state.man || {}, flip = c.props.flip || {};
    for (const m of CAR4_M) {
      const side = m[1] === 'L' ? M.L || 0 : M.R || 0, d = clamp(drv.paired || M[m] == null ? side : M[m], -1, 1);
      V[m] = on ? d * Vd * (m[1] === 'L' ? 1 : -1) * (flip[m] ? -1 : 1) : 0;   // the right motors are mounted mirrored
    }
  } else if (src === 'test') { const P = car4Pack(c), on = c.props.on !== false && P.soc > 0, T = c.props.test || {}; for (const m of CAR4_M) V[m] = on ? clamp(T[m] || 0, -1, 1) * Math.max(0, P.voc - P.rin * (c.state.Iall || 0)) : 0; }
  else if (live()) for (const m of CAR4_M) V[m] = vDiff(c, m + '+', m + '-');
  return V;
}
function car4Step(c, ph, h, V, K, P, D) {
  const rw = D.wheelD / 2000, half = D.track / 2000, a = D.wheelbase / 2000, N = P.mass * 9.81 / 4, Fm = P.mu * N, flip = c.props.flip || {};
  let Fx = 0, Mz = 0;
  for (const m of CAR4_M) {
    const pz = car4Side(m) * half, dir = (m[1] === 'L' ? 1 : -1) * (flip[m] ? -1 : 1);   // + current turns a left wheel forward; the right motors are mirrored
    const w = ph.w[m], I = (V[m] - K.Ke * w * dir) / K.R, tq = K.Kt * I * dir;
    const slip = w * rw - (ph.v + ph.r * pz), F = Fm * Math.tanh((P.kSlip * slip) / Fm);
    const tf = (K.tf + P.crr * N * rw) * Math.tanh(w / 0.4);
    ph.w[m] = w + (h * (tq - tf - F * rw)) / K.J; ph.I[m] = I; Fx += F; Mz += pz * F; ph.ang[m] += ph.w[m] * h;
  }
  const Iz = (P.mass * ((D.length / 1000) ** 2 + (D.width / 1000) ** 2)) / 12, Mr = P.muLat * N * 4 * a;
  ph.v += (h * Fx) / P.mass; ph.r += (h * (Mz - Mr * Math.tanh(ph.r / 0.15))) / Iz;
  const nth = ph.th + ph.r * h, dx = ph.v * h * 1000 * Math.cos(ph.th), dz = -ph.v * h * 1000 * Math.sin(ph.th);
  if (Math.abs(dx) + Math.abs(dz) + Math.abs(nth - ph.th) < 1e-9) return;
  const stuck = car4Collide(c, ph.x, ph.z, ph.th, ph.t), hit = stuck ? null : car4Collide(c, ph.x + dx, ph.z + dz, nth, ph.t);
  if (!hit) { ph.x += dx; ph.z += dz; ph.th = nth; ph.odo += Math.hypot(dx, dz); return; }
  // blocked: slide along it if a part of the move is free, else stop; the wheels spin on (they slip)
  if (!car4Collide(c, ph.x + dx, ph.z + dz, ph.th, ph.t)) { ph.x += dx; ph.z += dz; ph.r = 0; }
  else if (!car4Collide(c, ph.x, ph.z, nth, ph.t)) { ph.th = nth; ph.v = 0; }
  else if (Math.abs(nth - ph.th) > 1e-7 && hit.cx != null) {   // turning against a corner: nudged away from what it touches (0.3 mm a step)
    const k = Math.hypot(ph.x - hit.cx, ph.z - hit.cz) || 1, nx = ((ph.x - hit.cx) / k) * 0.3, nz = ((ph.z - hit.cz) / k) * 0.3;
    if (!car4Collide(c, ph.x + nx, ph.z + nz, nth, ph.t)) { ph.x += nx; ph.z += nz; ph.th = nth; } ph.v = 0;
  } else { ph.v = 0; ph.r = 0; }
  ph.hit = hit; ph.hitT = ph.t;
}
// ---- the robot as one assembly: the car part, the parts mounted on it (props.onCar = { x, z, y, rot } on the car), what is stacked or
// docked on those, and the wires between them. At home they stand where the lab put them; when the robot drives, the whole assembly
// is carried by one transform T = pose · home⁻¹ in the lab's own scene (no second view). ----
function car4Members(car) {
  const set = new Set([car]);
  for (const o of comps.values()) if (o !== car && o.props && o.props.onCar && (o.props.carId == null || o.props.carId === car.id)) set.add(o);
  for (let k = 0; k < 2; k++) for (const o of comps.values()) { const host = o.stack != null ? comps.get(o.stack) : o.dock != null ? comps.get(o.dock) : null; if (host && set.has(host)) set.add(o); }
  return set;
}
function car4Driver(c) {   // the motor driver on the robot: its voltage drop and whether its channels are paired
  for (const o of car4Members(c)) {
    if (o.type === 'amsr3') return { o, name: 'Arduino Motor Shield Rev3', drop: 1.8, paired: true, minV: 4.8 };
    if (o.type === 'l293d') return { o, name: 'L293D Motor Shield', drop: 1.4, paired: false, minV: 4.5 };
    if (o.type === 'hg7881') return { o, name: 'HG7881 board', drop: 0.4, paired: false, minV: 2.5 };
    if (o.type === 'rbsbitdrv') return { o, name: 'RBS bit Driver Expansion Board', drop: 0.3, paired: false, minV: 3.0 };
  }
  return { o: null, name: 'no driver', drop: 0, paired: false, minV: 0 };
}
function car4Controller(c) { for (const o of car4Members(c)) if (o.type === 'arduino' || o.type === 'rbsbit' || o.type === 'esp32') return o; return null; }
// at home: every mounted part sits at its place on the car (and follows when the car is moved on the table)
const car4Dragged = (o) => !!(drag && (drag.c === o || (drag.carry || []).some((k) => k.o === o)));
function car4CarOf(o) { if (!o || !o.props) return null; if (o.type === 'car4wd') return o; if (!o.props.onCar) return null; for (const c of comps.values()) if (c.type === 'car4wd' && (o.props.carId == null || o.props.carId === c.id)) return c; return null; }
function car4Unmount(o) {   // a bench part again: on the table, upright, reading nothing of the robot's table
  delete o.props.onCar; delete o.props.carId; delete o.props.carMount; delete o.lift; delete o.state.c4at;
  for (const w of wires) if ((w.c4poly || w.c4tether) && wireTouches(w, o)) { w.c4poly = null; w.c4tether = false; w.c4noPick = null; if (w.group) w.group.visible = true; }   // a normal jumper again
  car4TetherSweep();
  if (o.dock == null) { o.group.rotation.set(0, (-o.rot * Math.PI) / 2, 0); }
  setCompPos(o, o.x, o.z); markWires([o]);
  for (const g of comps.values()) if (g.stack === o.id || g.dock === o.id) { setCompPos(g, g.x, g.z); markWires([g]); }
}
function car4SyncMounts(car) {
  const ph = car.state.ph; if (ph && car4Displaced(car, ph)) return; let any = false;
  const th = (-car.rot * Math.PI) / 2, cs = Math.cos(th), sn = Math.sin(th), D = car4Cfg(car, 'dims');
  for (const o of comps.values()) {
    const m = o.props && o.props.onCar; if (!m || o === car || (o.props.carId != null && o.props.carId !== car.id)) continue;
    if (car4Dragged(o)) continue;
    // moved by hand: off the car's deck it comes off the robot, still on it it goes back to its place
    const at = o.state.c4at;
    if (at && (Math.abs(o.x - at[0]) > 1 || Math.abs(o.z - at[1]) > 1) && !car4Dragged(car)) {
      const lx = (o.x - car.x) * cs - (o.z - car.z) * sn, lz = (o.x - car.x) * sn + (o.z - car.z) * cs;
      if (Math.abs(lx) > D.length / 2 + 10 || Math.abs(lz) > D.width / 2 + 10) { const nm = TYPES[o.type].name; car4Unmount(o); any = true; toast(`The ${nm} is off the robot now: it is a part on the bench again.`); continue; }
    }
    const wx = car.x + m.x * cs + m.z * sn, wz = car.z - m.x * sn + m.z * cs, rot = (((car.rot + (m.rot || 0)) % 4) + 4) % 4, lift = m.y || 0;
    if (o.lift === lift && Math.abs(o.x - wx) < 0.01 && Math.abs(o.z - wz) < 0.01 && o.rot === rot && (!m.flip || o.group.rotation.x === Math.PI)) { o.state.c4at = [o.x, o.z]; continue; }
    o.lift = lift; o.rot = rot; if (o.dock == null) { o.group.rotation.order = 'YXZ'; o.group.rotation.set(m.flip ? Math.PI : 0, (-rot * Math.PI) / 2, 0); }
    setCompPos(o, wx, wz); o.state.c4at = [wx, wz]; markWires([o]); any = true;
    for (const g of comps.values()) {
      if (g.stack === o.id) { g.rot = rot; g.group.rotation.y = (-rot * Math.PI) / 2; setCompPos(g, wx, wz); markWires([g]); }
      if (g.dock === o.id) { const DS = dockSpec(o.type); g.rot = o.rot; g.group.rotation.set(DS ? DS.pitch : 0, (-o.rot * Math.PI) / 2, 0); const [x, z] = dockXZ(o); setCompPos(g, x, z); markWires([g]); }
    }
  }
  if (any) { dirty = true; shadowDirty = true; usbDirty = usbDirty || 'quick'; }
}
// the lab's drag test: the robot's own parts never block the robot (or each other)
{ const col0 = collides; collides = function (c, x, z) {
  const car = car4CarOf(c); if (!car) return col0(c, x, z);
  const mem = car4Members(car), mine = footRects(c, x, z), mg = 0.4;
  for (const o of comps.values()) {
    if (o === c || mem.has(o) || o.bb === c.id || o.stack === c.id || o.type === 'person' || (drag && (drag.carry || []).some((k) => k.o === o))) continue;
    if (o.stack != null || o.dock != null) continue; if (o.bb != null && TYPES[o.type].insertable) continue; if (TYPES[c.type].insertable && o.type === 'breadboard') continue;
    for (const r of footRects(o)) for (const q of mine) if (q[0] < r[1] - mg && q[1] > r[0] + mg && q[2] < r[3] - mg && q[3] > r[2] + mg) return o;
  }
  return null;
}; }
// what holds the mounted parts, as on the kit: brass standoffs under each board on the deck, and posts from the bottom plate down to
// the line sensors under the front. Drawn in the car's own group, so they ride with it. Rebuilt only when a mounting changes.
function car4MountGear(car) {
  const L = car4Lv(car4Cfg(car, 'dims')), list = [];
  for (const o of comps.values()) { const m = o.props && o.props.onCar; if (!m || o === car || !o.foot || (o.props.carId != null && o.props.carId !== car.id)) continue; list.push([o, m]); }
  const key = list.map(([o, m]) => `${o.id}:${m.x},${m.z},${m.y},${m.rot || 0},${m.flip ? 1 : 0},${o.foot.w},${o.foot.d}`).join('|') + `|${L.top}`;
  if (car.state.gearKey === key && car.mountG) return; car.state.gearKey = key;
  if (car.mountG) car.group.remove(car.mountG);
  const g = car.mountG = new THREE.Group(); g.name = 'robot-mounts'; car.group.add(g);
  const brass = cached('c4Brass', () => new THREE.MeshStandardMaterial({ color: 0xc9a14a, metalness: 0.85, roughness: 0.32 })), geo = cached('c4PostG', () => new THREE.CylinderGeometry(1, 1, 1, 6));
  const post = (x, z, y0, y1, r = 2.6) => { const h = Math.abs(y1 - y0); if (h < 0.5) return; const m = new THREE.Mesh(geo, brass); m.scale.set(r, h, r); m.position.set(x, (y0 + y1) / 2, z); m.castShadow = true; m.userData.mountPost = true; g.add(m); };
  for (const [o, m] of list) {
    const odd = (((m.rot || 0) % 2) + 2) % 2 === 1, fw = odd ? o.foot.d : o.foot.w, fd = odd ? o.foot.w : o.foot.d, y = m.y || 0;
    if (m.flip) { post(m.x, m.z, y, L.y0, 2.2); continue; }                                   // a sensor under the front hangs from the bottom plate
    if (y > L.top + 5) for (const sx of [-1, 1]) for (const sz of [-1, 1]) post(m.x + sx * (fw / 2 - 4), m.z + sz * (fd / 2 - 4), L.top, y);   // standoffs under a board
  }
  shadowDirty = true;
}
// a wire from the robot to a part on the bench (the joystick's cable) is not lifted over the robot's own parts: only over the rest
{ const wh0 = wireHeight; wireHeight = function (w) {
  const car = [...comps.values()].find((o) => o.type === 'car4wd'); if (!car) return wh0(w);
  const mem = car4Members(car), ca = comps.get(epParts(w.a)[0]), cb = comps.get(epParts(w.b)[0]); if (!ca || !cb || mem.has(ca) === mem.has(cb)) return wh0(w);
  const e1 = endpoint(w.a), e2 = endpoint(w.b); if (!e1 || !e2) return 0;
  const A = e1.pos, B = e2.pos, tp = HOUSING_H + 0.6, segs = [[Math.min(A.x, B.x), Math.max(A.x, B.x), A.z, A.z], [B.x, B.x, Math.min(A.z, B.z), Math.max(A.z, B.z)]];
  let ob = 0; for (const c of comps.values()) { if (c === ca || c === cb || mem.has(c) || TYPES[c.type].prop || c.type === 'breadboard') continue; const b = partBox(c.group); if (segs.some(([x0, x1, z0, z1]) => x1 >= b.min.x - 1.6 && x0 <= b.max.x + 1.6 && z1 >= b.min.z - 1.6 && z0 <= b.max.z + 1.6)) ob = Math.max(ob, b.max.y + 2.5); }
  return Math.max(A.y + tp, B.y + tp, WIRE_CLEAR, ob) + 3 + w.lane * 0.8;
}; }
// the cable from the robot to a part on the bench (the joystick): out of the part's pins, down onto the table, flat across it to the
// robot, up its side and into the pins, its wires side by side. Drawn in the table's frame and redrawn as the robot moves.
const C4_TETH = new THREE.Group(); C4_TETH.name = 'robot-tether'; scene.add(C4_TETH);
function car4TetherSweep() { for (const g of [...C4_TETH.children]) { const id = +g.name.slice(1), w = wires.find((x) => x.id === id); if (!w || !w.c4tether) { C4_TETH.remove(g); g.traverse((o) => { if (o.isMesh && o.userData.own) o.geometry.dispose(); }); } } }
function car4TetherOf(w, mem) { const a = comps.get(epParts(w.a)[0]), b = comps.get(epParts(w.b)[0]); return !!(w.group && a && b && mem.has(a) !== mem.has(b)); }
function car4TetherDraw(w, car, mem = car4Members(car)) {
  const ca = comps.get(epParts(w.a)[0]), re = mem.has(ca) ? 'a' : 'b', be = re === 'a' ? 'b' : 'a', R = endpoint(w[re]), Bp = endpoint(w[be]); if (!R || !Bp) return;
  const bench = comps.get(epParts(w[be])[0]), mates = wires.filter((o) => car4TetherOf(o, mem) && [epParts(o.a)[0], epParts(o.b)[0]].includes(bench.id)).sort((x, y) => x.id - y.id);
  const k = mates.indexOf(w), off = (k - (mates.length - 1) / 2) * 1.4, ph = car4Ph(car), D = car4Cfg(car, 'dims'), L = car4Lv(D);
  const rp = R.pos.clone(), bp = Bp.pos.clone(), dir = new V3(ph.x - bp.x, 0, ph.z - bp.z); const dist = dir.length() || 1; dir.divideScalar(dist);
  const side = new V3(-dir.z, 0, dir.x), cs = Math.cos(ph.th), sn = Math.sin(ph.th);
  // where the cable meets the robot's outline, coming from the bench part
  const lx = (bp.x - ph.x) * cs - (bp.z - ph.z) * sn, lz = (bp.x - ph.x) * sn + (bp.z - ph.z) * cs, sc = Math.min((D.length / 2 + 10) / Math.max(1e-6, Math.abs(lx)), (D.width / 2 + 10) / Math.max(1e-6, Math.abs(lz)));
  const ex = new V3(ph.x + (lx * cs + lz * sn) * sc, 1.3, ph.z + (-lx * sn + lz * cs) * sc).addScaledVector(side, off);
  const hTop = Math.max(rp.y + HOUSING_H + 0.9, L.top + 6) + k * 0.2;
  const pts = [bp, bp.clone().setY(bp.y + HOUSING_H + 0.9), bp.clone().setY(bp.y + HOUSING_H + 0.9).addScaledVector(dir, 8).addScaledVector(side, off), bp.clone().setY(1.3).addScaledVector(dir, 14).addScaledVector(side, off),
    ex, ex.clone().setY(hTop), new V3(rp.x + off * 0.5, hTop, rp.z + off * 0.5), rp.clone().setY(rp.y + HOUSING_H + 0.9), rp].filter((p, i, a) => i === 0 || p.distanceTo(a[i - 1]) > 0.3);
  const old = C4_TETH.getObjectByName('t' + w.id); if (old) { C4_TETH.remove(old); old.traverse((o) => { if (o.isMesh && o.userData.own) o.geometry.dispose(); }); }
  const g = new THREE.Group(); g.name = 't' + w.id; C4_TETH.add(g);
  const curve = roundedPath(pts, 3);
  if (!w.mat) w.mat = new THREE.MeshPhysicalMaterial({ color: w.color, roughness: 0.85, clearcoat: 0.35, emissive: w.color, emissiveIntensity: 0 });
  const tube = mesh(new THREE.TubeGeometry(curve, Math.round(clamp(curve.getLength() / 3, 40, 300)), 0.55, 8), w.mat, g); tube.userData.own = true; tube.userData.noPick = true;
  for (const P of [rp, bp]) { const hg = new THREE.Group(); hg.position.copy(P); g.add(hg); mesh(wirePinGeo, M.metal, hg, 0, 0.3, 0); mesh(wireHousingGeo, M.housing, hg, 0, 0.6 + HOUSING_H / 2, 0); }
  w.c4poly = new Poly(curve.getSpacedPoints(160)); w.c4tether = true; w.c4noPick = null; car4HarnHide(w); shadowDirty = true;
}
// ---- the robot's wiring harness: short, low and grouped, as a kit is wired ----
// Every wire between two of the robot's own parts is drawn here, in the car's frame (so it rides with the car), instead of the lab's
// jumper arc over everything: out of its pin, over the nearest edge of its part, down to a channel just above the top plate (under
// the raised boards), square runs to the other part and up into its pin. Wires between the same two parts share a channel level, so
// they lie side by side as one ribbon. Motor and battery leads end in the JST plug of the driver's connector. The lab's wire itself
// stays: the circuit, the wiring table and the current-flow dots use it (its path is this harness path).
function car4HarnHide(w) {
  if (!w.group) return; if (w.group.visible) w.group.visible = false;
  if (!w.c4noPick) { w.group.traverse((o) => { o.raycast = () => {}; }); w.c4noPick = w.group; }
  if (w.c4poly && w.poly !== w.c4poly) w.poly = w.c4poly;
}
function car4Harness(car) {
  if (car.state.ph && car4Displaced(car, car.state.ph)) return;
  const mem = car4Members(car), list = wires.filter((w) => car4WireOn(w, mem));
  const key = list.map((w) => `${w.id}:${w.a}:${w.b}:${w.color}`).join('|') + '|' + (car.state.gearKey || '') + '|' + [...mem].map((o) => `${o.id}@${Math.round(o.x)},${Math.round(o.z)},${o.rot}`).join(';');
  if (car.state.harnKey === key && car.harnG) { for (const w of list) { if (w.c4noPick !== w.group) w.c4noPick = null; car4HarnHide(w); } return; }
  car.state.harnKey = key; car4TetherSweep();
  if (car.harnG) { car.group.remove(car.harnG); car.harnG.traverse((o) => { if (o.isMesh && o.userData.own) o.geometry.dispose(); }); }
  const g = car.harnG = new THREE.Group(); g.name = 'robot-harness'; car.group.add(g);
  car.group.updateMatrixWorld(true); const W = car.group.matrixWorld.clone(), inv = W.clone().invert(), loc = (v) => v.clone().applyMatrix4(inv);
  const L = car4Lv(car4Cfg(car, 'dims')), deck = L.top + 1.3, top = HOUSING_H + 0.9;
  const box = new Map();
  for (const o of mem) { if (o === car) continue; const b = partBox(o.group), a1 = loc(b.min), a2 = loc(b.max); box.set(o, { x0: Math.min(a1.x, a2.x), x1: Math.max(a1.x, a2.x), z0: Math.min(a1.z, a2.z), z1: Math.max(a1.z, a2.z), y0: Math.min(a1.y, a2.y), y1: Math.max(a1.y, a2.y) }); }
  const seated = new Set(), jstOf = (c, pin) => { const PD = jstPortsOf(c); const port = PD && PD.find((q) => q.pins.includes(pin) || q.pins.some((x) => pin === x + '2')); return port ? { P: c, port } : null; };
  // one end: where the wire leaves its pin, and how it gets out to the side of its part
  const endOf = (ep, toward) => {
    const [cid, pin] = epParts(ep), c = comps.get(cid), e = endpoint(ep); if (!c || !e) return null;
    const P = loc(e.pos), flip = !!(c.props && c.props.onCar && c.props.onCar.flip), J = c !== car ? jstOf(c, pin) : null, B = box.get(c);
    if (J) {   // into a JST plug in the driver's connector: straight out of the plug's back, then down
      if (!seated.has(J.port.id + c.id)) { seated.add(J.port.id + c.id); const tmp = new THREE.Group(); try { jstSeat({ group: tmp }, J); for (const ch of [...tmp.children]) { ch.applyMatrix4(inv); g.add(ch); } } catch { /* no plug drawn */ } }
      const out = J.port.out ? new V3(J.port.out[0], 0, J.port.out[1]).applyQuaternion(c.group.quaternion).setY(0).normalize().applyQuaternion(new THREE.Quaternion().setFromRotationMatrix(inv)) : new V3(0, 1, 0);
      const a = P.clone().addScaledVector(out, 8), b2 = P.clone().addScaledVector(out, 13); if (!J.port.out) { a.copy(P).setY(P.y + JST.plugH + 1); b2.copy(a); }
      return { pts: [P, a, b2], exit: b2, c, jst: true };
    }
    // a Dupont housing on the pin (hanging down from a sensor mounted upside down)
    const s = flip ? -1 : 1, hg = new THREE.Group(); hg.position.copy(P); if (flip) hg.rotation.x = Math.PI; g.add(hg);
    if (c === car) mesh(wirePinGeo, M.metal, hg, 0, 0.3, 0); else { mesh(wirePinGeo, M.metal, hg, 0, 0.3, 0); mesh(wireHousingGeo, M.housing, hg, 0, 0.6 + HOUSING_H / 2, 0); }
    const t = P.clone(); t.y += s * (c === car ? 2.2 : top);
    if (!B) return { pts: [P, t], exit: t, c };
    // over the part's nearest edge that faces the other end
    const to = new V3(toward.x - P.x, 0, toward.z - P.z); if (to.lengthSq() > 1e-6) to.normalize();
    const sides = [[P.x - B.x0, -1, 0], [B.x1 - P.x, 1, 0], [P.z - B.z0, 0, -1], [B.z1 - P.z, 0, 1]].map(([d, x, z]) => ({ d: Math.max(0, d), v: new V3(x, 0, z) }));
    const cost = (q) => q.d + (q.v.dot(to) < -0.3 ? 40 : q.v.dot(to) < 0.3 ? 8 : 0), ex = sides.reduce((p, q) => (cost(q) < cost(p) ? q : p));
    const h = flip ? t.y : Math.max(t.y, B.y1 + 1.2), up = t.clone().setY(h), out = up.clone().addScaledVector(ex.v, ex.d + 3);
    return { pts: [P, t, up, out], exit: out, c };
  };
  // group the wires into bundles (the same two parts), one channel level each
  const bundles = new Map(); for (const w of list) { const [a, b] = [epParts(w.a)[0], epParts(w.b)[0]].sort((x, y) => x - y), k = `${a}-${b}`; if (!bundles.has(k)) bundles.set(k, []); bundles.get(k).push(w); }
  let level = 0;
  const low = [...box.entries()].filter(([, b]) => b.y0 < deck + 4);
  const crosses = (p, q, skip) => low.filter(([c, b]) => !skip.has(c) && Math.max(p.x, q.x) > b.x0 && Math.min(p.x, q.x) < b.x1 && Math.max(p.z, q.z) > b.z0 && Math.min(p.z, q.z) < b.z1).length;
  for (const bundle of bundles.values()) {
    const y = deck + 1.2 + (level++ % 7) * 1.35;
    const order = bundle.map((w) => ({ w, k: (() => { const p = loc(endpoint(w.a).pos); return p.x + p.z; })() })).sort((u, v) => u.k - v.k).map((u) => u.w);
    order.forEach((w, k) => {
      const off = (k - (order.length - 1) / 2) * 1.3;
      const pa = loc(endpoint(w.a).pos), pb = loc(endpoint(w.b).pos), A = endOf(w.a, pb), B = endOf(w.b, pa); if (!A || !B) return;
      const ya = A.jst ? Math.min(y, A.exit.y) : y, yb = B.jst ? Math.min(y, B.exit.y) : y;
      const a2 = A.exit.clone().setY(ya).add(new V3(off, 0, off)), b2 = B.exit.clone().setY(yb).add(new V3(off, 0, off)), skip = new Set([A.c, B.c]);
      const c1 = new V3(b2.x, y, a2.z), c2 = new V3(a2.x, y, b2.z), n1 = crosses(a2, c1, skip) + crosses(c1, b2, skip), n2 = crosses(a2, c2, skip) + crosses(c2, b2, skip);
      const pts = [...A.pts, a2, n2 < n1 ? c2 : c1, b2, ...B.pts.slice().reverse()].filter((p, i, arr) => i === 0 || p.distanceTo(arr[i - 1]) > 0.3);
      const curve = roundedPath(pts, 2.0);
      if (!w.mat) w.mat = new THREE.MeshPhysicalMaterial({ color: w.color, roughness: 0.85, clearcoat: 0.35, clearcoatRoughness: 0.35, emissive: w.color, emissiveIntensity: 0 });
      const tube = mesh(new THREE.TubeGeometry(curve, Math.round(clamp(curve.getLength() / 1.5, 24, 240)), 0.55, 8), w.mat, g); tube.userData.own = true; tube.userData.wire = w.id;
      w.c4poly = new Poly(curve.getSpacedPoints(120).map((p) => p.clone().applyMatrix4(W))); w.c4noPick = null; car4HarnHide(w);
    });
  }
  for (const w of wires) if (!car4WireOn(w, mem) && car4TetherOf(w, mem)) car4TetherDraw(w, car, mem);
  for (const o of g.children) o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.userData.noPick = true; } });
  shadowDirty = true; dirty = true;
}
const C4_T = new THREE.Matrix4(), C4_HI = new THREE.Matrix4();
function car4Carry(c, ph) {
  const S = c.state;
  if (!car4Displaced(c, ph)) { if (S.carried) { car4Release(c); car4Tether(c, ph, true); } return; }
  const h = car4Home(c); C4_T.makeRotationY(ph.th).setPosition(ph.x, 0, ph.z); C4_HI.makeRotationY(h.th).setPosition(h.x, 0, h.z).invert(); C4_T.multiply(C4_HI);
  const sig = `${comps.size}|${wires.length}`;
  if (S.carried && S.carriedSig !== sig) { const old = new Set(S.carried.map((it) => it.o)); car4Release(c); const mem = car4Members(c); for (const o of mem) o.group.updateMatrixWorld(true); for (const w of wires) if (car4WireOn(w, mem) && !old.has(w.group)) rebuildWire(w); }
  if (!S.carried) { S.carried = car4Capture(c); S.carriedSig = sig; }
  S.T = (S.T || new THREE.Matrix4()).copy(C4_T);
  for (const it of S.carried) { it.o.matrixAutoUpdate = false; it.o.matrix.multiplyMatrices(C4_T, it.home); it.o.matrixWorldNeedsUpdate = true; }
  if (usb.tube) usb.tube.visible = !S.carried.some((it) => it.board);
  shadowDirty = true; car4Tether(c, ph, false);
}
// wires from the robot to a part on the bench (the joystick project's tethered joystick) are drawn again as the robot moves:
// at most about eight times a second, and only after it has moved 3 mm or turned a degree; once more when it is back home
function car4Tether(c, ph, now) {
  const S = c.state, t = performance.now(), key = `${Math.round(ph.x / 3)},${Math.round(ph.z / 3)},${Math.round((ph.th * 180) / Math.PI)}`;
  if (!now && (S.tetherKey === key || t - (S.tetherT || 0) < 120)) return;
  S.tetherKey = key; S.tetherT = t; const mem = car4Members(c);
  for (const w of wires) { const a = comps.get(epParts(w.a)[0]), b = comps.get(epParts(w.b)[0]); if (w.group && a && b && mem.has(a) !== mem.has(b)) wiresDirty.add(w.id); }
}
function car4Capture(c) {
  const mem = car4Members(c), list = [];
  for (const o of mem) { o.group.updateMatrix(); list.push({ o: o.group, home: o.group.matrix.clone(), board: o.type === 'arduino' }); }
  for (const w of wires) if (car4WireOn(w, mem)) { w.group.updateMatrix(); list.push({ o: w.group, home: w.group.matrix.clone() }); }
  return list;
}
function car4Release(c) { const S = c.state; for (const it of S.carried || []) { it.o.matrixAutoUpdate = true; it.o.updateMatrix(); it.o.matrixWorldNeedsUpdate = true; } S.carried = null; if (usb.tube) usb.tube.visible = true; shadowDirty = true; }
const car4WireOn = (w, mem) => { const a = comps.get(epParts(w.a)[0]), b = comps.get(epParts(w.b)[0]); return !!(w.group && a && b && mem.has(a) && mem.has(b)); };
function car4AtHome(c, fn) {   // run fn with the robot's assembly at home (a wire must be built from the pins' home places), then carry it again
  if (!c.state.carried) return fn();
  car4Release(c); for (const o of car4Members(c)) o.group.updateMatrixWorld(true);
  try { return fn(); } finally { car4Carry(c, car4Ph(c)); }
}
// the lab's current-flow and signal dots ride with the robot. A robot wire's path is kept at home, so its dots take the same
// transform as the wire; a mounted part's own current path is taken back to home first. (Without this they stay at the start.)
function car4PolyCarried(base, car) { return { L: base.L, at(s, out) { base.at(s, out); const S = car.state; return S.carried && S.T ? out.applyMatrix4(S.T) : out; } }; }
{ const bf0 = buildFlows; buildFlows = function (...a) {
  const r = bf0.apply(this, a);
  for (const car of comps.values()) {
    if (car.type !== 'car4wd') continue;
    const mem = car4Members(car), keys = new Set(), home = new Map((car.state.carried || []).map((it) => [it.o, it.home]));
    for (const w of wires) if (car4WireOn(w, mem)) { keys.add('w' + w.id); keys.add('sig' + w.id); }
    for (const list of [flows, signals]) for (const f of list) {
      if (keys.has(f.key)) { f.poly = car4PolyCarried(f.poly, car); continue; }
      const i = f.key.indexOf(':'), c = i > 0 ? comps.get(Number(f.key.slice(0, i))) : null; if (!c || !mem.has(c) || !f.poly.p) continue;
      const H = home.get(c.group), M = H ? H.clone().multiply(c.group.matrixWorld.clone().invert()) : null;   // where it was drawn → its home place
      f.poly = car4PolyCarried(M ? new Poly(f.poly.p.map((q) => q.clone().applyMatrix4(M))) : f.poly, car);
    }
  }
  return r;
}; }
{ const rw0 = rebuildWire; rebuildWire = function (w) { let r; const car = [...comps.values()].find((c) => c.type === 'car4wd' && c.state.carried && c.state.carried.some((it) => it.o === w.group)); r = car ? car4AtHome(car, () => rw0(w)) : rw0(w); if (w.c4tether) { const cc = [...comps.values()].find((c) => c.type === 'car4wd'); if (cc) car4TetherDraw(w, cc); } else if (w.c4poly) { w.c4noPick = null; car4HarnHide(w); } return r; }; }
// once a frame: voltages → fixed steps → battery → the motors' load for the solver → telemetry
function car4Tick(c, dt, now) {
  const ph = car4Ph(c), D = car4Cfg(c, 'dims'), K = car4MotorK(car4Cfg(c, 'motor')), P = car4Cfg(c, 'phys'), V = car4Volts(c);
  ph.V = V; ph.acc = Math.min(ph.acc + dt, 0.1);
  while (ph.acc >= CAR4.H) { car4Step(c, ph, CAR4.H, V, K, P, D); ph.acc -= CAR4.H; ph.t += CAR4.H; }
  if (ph.t - ph.hitT > 0.4) ph.hit = null;
  // the battery: the circuit's draw when live, else the test bench's motor currents
  const pk = car4Pack(c), src = c.props.src || 'circuit';
  const Ibat = src === 'test' || src === 'manual' ? CAR4_M.reduce((s, m) => s + Math.max(0, ph.I[m] * Math.sign(V[m] || 0)), 0) : (live() && sol ? Math.max(0, sol.src.get(c.id + ':bat') || 0) : 0);
  c.state.Iall = Ibat; c.state.soc = clamp(pk.soc - (Ibat * dt) / (pk.mAh * 3.6), 0, 1);
  if (Math.abs((c.props.soc ?? 1) - c.state.soc) > 0.01) { c.props.soc = +c.state.soc.toFixed(3); saveSoon(); }
  // the solver sees each motor as its effective resistance V/I (back-EMF makes a turning motor draw less)
  const Rm = c.state.Rm || (c.state.Rm = {}); let ch = false;
  for (const m of CAR4_M) {
    const v = V[m], i = ph.I[m], r = Math.abs(v) > 0.05 && i * v > 1e-4 ? clamp(v / i, K.R, 1e5) : K.R;
    if (!Rm[m] || Math.abs(r - Rm[m]) / Rm[m] > 0.06) { Rm[m] = r; ch = true; }
  }
  if (ch && live() && src === 'circuit') dirty = true;
  if (c.spin) for (const m of CAR4_M) if (c.spin[m]) c.spin[m].rotation.z = -ph.ang[m];
  if (c.knob) c.knob.position.x = -38 + (c.props.on !== false ? 2.4 : -2.4);
  // trail and telemetry (10 samples a second, 40 s kept)
  ph.trailT = (ph.trailT || 0) + dt; if (ph.trailT > 0.1) {
    ph.trailT = 0; const last = ph.trail[ph.trail.length - 1]; if (!last || Math.hypot(last[0] - ph.x, last[1] - ph.z) > 4) { ph.trail.push([ph.x, ph.z]); if (ph.trail.length > 1500) ph.trail.shift(); }
    const T = c.state.tele || (c.state.tele = { t: [], v: [], rpm: [], vb: [], s: [] }), S = car4SenseAll(c);
    if (!c.state.telePause) {
      T.t.push(ph.t); T.v.push(ph.v * 1000); T.rpm.push(CAR4_M.map((m) => (ph.w[m] * 30) / Math.PI)); T.vb.push(pk.voc - pk.rin * Ibat); T.s.push(S.map((x) => x.val));
      for (const k of ['t', 'v', 'rpm', 'vb', 's']) if (T[k].length > 400) T[k].shift();
    }
  }
  // the car was dragged to a new spot on the table: that is its new home
  const homeKey = `${c.x},${c.z},${c.rot}`; if (ph.home !== homeKey) { ph.home = homeKey; if (!car4Displaced(c, ph) || !c.state.carried) car4Reset(c); else { car4Release(c); car4Reset(c); } }
  car4SyncMounts(c); car4MountGear(c); car4Harness(c); car4Carry(c, ph);
  if (typeof c4hudTick === 'function') c4hudTick(c, dt);
}
function car4Reset(c) {
  const ph = car4Ph(c), h = car4Home(c); Object.assign(ph, { x: h.x, z: h.z, th: h.th, v: 0, r: 0, hit: null, trail: [] }); for (const m of CAR4_M) ph.w[m] = 0;
  c.state.man = { L: 0, R: 0 }; car4Carry(c, ph);
}

// ---- 5. the virtual table: lines (a raster the IR sensors read), obstacles, lights ----
const CAR4_OBK = { box: 'a box', cyl: 'a cylinder', wall: 'a wall' };
function car4Env(c) {
  const e = c.props.env || (c.props.env = car4Preset('plain'));
  e.table = { w: PLANE.w, d: PLANE.d, color: (e.table && e.table.color) || '#f7f7f4' }; e.strokes = e.strokes || []; e.obstacles = e.obstacles || []; e.lights = e.lights || [];
  e.lineW = e.lineW || 20; e.lineColor = e.lineColor || '#121212'; e.ver = e.ver || 1; e.show = e.show || { track: true, light: true, obstacles: true }; if (e.ambient == null) e.ambient = 12; return e;
}
let car4Seq = 1;
const car4Id = (p) => p + (car4Seq++).toString(36) + Math.random().toString(36).slice(2, 5);
function car4Arc(cx, cz, r, a0, a1, n) { const pts = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); pts.push([Math.round(cx + r * Math.cos(a)), Math.round(cz + r * Math.sin(a))]); } return pts; }
const CAR4_PRESETS = {   // sized for the lab's 1200 × 720 mm workplane; start = where a project puts the car
  plain: { name: 'Plain table', start: [-300, 0, 0] },
  oval: { name: 'Line: oval', start: [110, 240, 0] },
  circle: { name: 'Line: circle', start: [172, 240, 0] },
  s: { name: 'Line: S-curve', start: [-450, 130, 0] },
  junctions: { name: 'Line: junctions and a crossing', start: [-220, 200, 0] },
  obstacles: { name: 'Obstacle course', start: [-300, 120, 0] },
  light: { name: 'Light following', start: [-420, 150, 0] },
  custom: { name: 'Custom lab' },
};
function car4Preset(name) {
  const e = { preset: name, table: { w: PLANE.w, d: PLANE.d, color: '#f7f7f4' }, lineW: 20, lineColor: '#121212', strokes: [], obstacles: [], lights: [], ver: 1, show: { track: true, light: true, obstacles: true }, ambient: 12 };
  const stadium = (L, R) => [...car4Arc(L / 2, 0, R, -Math.PI / 2, Math.PI / 2, 24), ...car4Arc(-L / 2, 0, R, Math.PI / 2, Math.PI * 1.5, 24)];
  // the tracks and the course keep clear of the lab's laptop (the table's back-left corner)
  const OX = 172, OZ = 40, st = (L, R) => stadium(L, R).map(([x, z]) => [x + OX, z + OZ]);
  if (name === 'oval') e.strokes.push({ w: 20, pts: [...st(220, 200), [OX + 110, OZ - 200]] });   // 200 mm curves: tighter ones swing the line out past the sensor bar
  if (name === 'circle') e.strokes.push({ w: 20, pts: car4Arc(OX, OZ, 200, 0, Math.PI * 2, 72) });
  if (name === 's') { const pts = []; for (let x = -160; x <= 480; x += 20) pts.push([x, Math.round(OZ + 130 * Math.sin(((x + 160) / 680) * Math.PI * 1.5))]); e.strokes.push({ w: 20, pts }); }
  if (name === 'junctions') e.strokes.push({ w: 20, pts: [...st(220, 200), [OX + 110, OZ - 200]] }, { w: 20, pts: [[OX, -250], [OX, 310]] }, { w: 20, pts: [[-150, OZ], [500, OZ]] });
  if (name === 'obstacles') e.obstacles.push(   // the robot starts clear of the laptop's corner pocket; a box ahead, a cylinder, a wall at an angle, a moving box
    { id: car4Id('o'), kind: 'cyl', x: 120, z: 250, w: 100, d: 100, h: 140, rot: 0 }, { id: car4Id('o'), kind: 'box', x: 250, z: 30, w: 100, d: 100, h: 110, rot: 0 },
    { id: car4Id('o'), kind: 'wall', x: 380, z: -210, w: 240, d: 24, h: 120, rot: 35 }, { id: car4Id('o'), kind: 'box', x: 380, z: 180, w: 90, d: 90, h: 110, rot: 30, amp: 90, period: 7 });
  if (name === 'light') e.lights.push({ id: car4Id('l'), x: 380, z: -140, y: 140, level: 90, on: true, radius: 300 });
  return e;
}
function car4Track(c) {   // the line drawing as a raster: 2 mm a pixel, luminance kept for the sensors
  const E = car4Env(c); let T = c.state.trk;
  if (T && T.env === E && T.ver === E.ver && T.show === !!E.show.track && T.w === E.table.w && T.d === E.table.d) return T;
  const sc = 0.5, W = Math.round(E.table.w * sc), H = Math.round(E.table.d * sc), cv = (T && T.cv && T.cv.width === W && T.cv.height === H) ? T.cv : document.createElement('canvas');
  cv.width = W; cv.height = H; const g = cv.getContext('2d', { willReadFrequently: true });
  g.fillStyle = E.table.color; g.fillRect(0, 0, W, H); g.lineCap = 'round'; g.lineJoin = 'round';
  if (E.show.track) for (const s of E.strokes) { if (!s.pts || s.pts.length < 1) continue; g.strokeStyle = s.color || E.lineColor; g.lineWidth = (s.w || E.lineW) * sc; g.beginPath(); s.pts.forEach(([x, z], i) => { const u = (x + E.table.w / 2) * sc, v = (z + E.table.d / 2) * sc; if (i) g.lineTo(u, v); else g.moveTo(u, v); }); if (s.pts.length === 1) g.lineTo((s.pts[0][0] + E.table.w / 2) * sc + 0.01, (s.pts[0][1] + E.table.d / 2) * sc); g.stroke(); }
  const d = g.getImageData(0, 0, W, H).data, lum = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) lum[i] = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255;
  c.state.trk = T = { env: E, ver: E.ver, show: !!E.show.track, w: E.table.w, d: E.table.d, sc, W, H, cv, lum, tex: T && T.tex }; if (T.tex) T.tex.needsUpdate = true; return T;
}
function car4Reflect(c, x, z, r = 3) {   // how much light the table sends back at (x, z), 0 (black tape) … 1 (white), averaged over the sensor's spot
  const T = car4Track(c), u0 = (x + T.w / 2) * T.sc, v0 = (z + T.d / 2) * T.sc, rp = Math.max(1, r * T.sc); let s = 0, n = 0;
  for (let dv = -rp; dv <= rp; dv++) for (let du = -rp; du <= rp; du++) { if (du * du + dv * dv > rp * rp) continue; const u = Math.round(u0 + du), v = Math.round(v0 + dv); s += u < 0 || v < 0 || u >= T.W || v >= T.H ? 0.05 : T.lum[v * T.W + u]; n++; }
  return n ? s / n : 1;
}
function car4Ray(c, ox, oz, dirA, maxD, minH, t) {   // 2D ray on the table: the nearest obstacle at least minH tall (mm), or null
  const dx = Math.cos(dirA), dz = -Math.sin(dirA); let best = null;
  const E = car4Env(c), T = E.table;
  if ((E.fence ?? 80) >= minH) {   // the fence's inside faces
    const cands = [dx > 1e-9 ? (T.w / 2 - ox) / dx : Infinity, dx < -1e-9 ? (-T.w / 2 - ox) / dx : Infinity, dz > 1e-9 ? (T.d / 2 - oz) / dz : Infinity, dz < -1e-9 ? (-T.d / 2 - oz) / dz : Infinity];
    const d = Math.min(...cands); if (d > 0 && d < maxD) best = { d, id: 'fence' };
  }
  for (const o of car4Others(c)) { if (o.h < minH) continue; const cs = Math.cos(-o.r), sn = Math.sin(-o.r), lx = (ox - o.x) * cs + (oz - o.z) * sn, lz = -(ox - o.x) * sn + (oz - o.z) * cs, ldx = dx * cs + dz * sn, ldz = -dx * sn + dz * cs; let t0 = -Infinity, t1 = Infinity; for (const [p, q, hh] of [[lx, ldx, o.hw], [lz, ldz, o.hd]]) { if (Math.abs(q) < 1e-9) { if (p < -hh || p > hh) { t0 = Infinity; break; } } else { let a = (-hh - p) / q, b = (hh - p) / q; if (a > b) [a, b] = [b, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, b); } } if (t0 <= t1 && t0 > 0 && t0 < maxD && (!best || t0 < best.d)) best = { d: t0, id: 'comp' + o.c.id }; }
  { const lp = car4Laptop(); if (lp && lp.h >= minH) { const d = car4RayBox(ox, oz, dx, dz, lp, maxD); if (d != null && (!best || d < best.d)) best = { d, id: 'laptop' }; } }
  if (!E.show.obstacles) return best;
  for (const o of E.obstacles) {
    if ((o.h || 0) < minH) continue; const s = car4ObsShape(o, t);
    if (s.cyl) { const fx = ox - s.x, fz = oz - s.z, b = fx * dx + fz * dz, cc = fx * fx + fz * fz - s.hw * s.hw, disc = b * b - cc; if (disc < 0) continue; const d = -b - Math.sqrt(disc); if (d > 0 && d < maxD && (!best || d < best.d)) best = { d, id: o.id }; continue; }
    const cs = Math.cos(-s.r), sn = Math.sin(-s.r), lx = (ox - s.x) * cs + (oz - s.z) * sn, lz = -(ox - s.x) * sn + (oz - s.z) * cs, ldx = dx * cs + dz * sn, ldz = -dx * sn + dz * cs;
    let t0 = -Infinity, t1 = Infinity;
    for (const [p, q, hh] of [[lx, ldx, s.hw], [lz, ldz, s.hd]]) { if (Math.abs(q) < 1e-9) { if (p < -hh || p > hh) { t0 = Infinity; break; } } else { let a = (-hh - p) / q, b = (hh - p) / q; if (a > b) [a, b] = [b, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, b); } }
    if (t0 <= t1 && t0 > 0 && t0 < maxD && (!best || t0 < best.d)) best = { d: t0, id: o.id };
  }
  return best;
}
function car4LightAt(c, wx, wy, wz, fx, fz, sens = 1) {   // light on a sensor at (wx, wy, wz) facing (fx, fz): the lab's 0–100 scale (12 is a room)
  const E = car4Env(c); let L = E.ambient ?? AMBIENT_LIGHT;
  for (const l of E.lights) {
    if (!l.on || !E.show.light) continue; const vx = l.x - wx, vy = (l.y || 140) - wy, vz = l.z - wz, d = Math.hypot(vx, vy, vz) || 1;
    const cs = (vx * fx + vz * fz) / d, k = Math.max(0, cs) * 0.9 + 0.1;
    L += l.level * 1.25 * k / (1 + (d / (l.radius || 260)) ** 2);
  }
  return clamp(L * sens, 0, 100);
}

// ---- 6. sensors on the car: a sensor part with props.carMount reads the table where it sits on the car ----
const car4Of = (s) => { if (!s.props || !s.props.carMount) return null; for (const o of comps.values()) if (o.type === 'car4wd' && (s.props.carId == null || s.props.carId === o.id)) return o; return null; };
function car4World(c, mt) {   // a mount on the car → table coordinates and facing (heading of the sensor)
  const ph = car4Ph(c), cs = Math.cos(ph.th), sn = Math.sin(ph.th), a = ph.th + (mt.yaw || 0) * deg;
  return { x: ph.x + mt.x * cs + mt.z * sn, z: ph.z - mt.x * sn + mt.z * cs, y: mt.y, a, fx: Math.cos(a), fz: -Math.sin(a) };
}
function car4Sense(car, s) {   // one mounted sensor's reading from the table
  const mt = car4MountAt(car, s.props.carMount); if (!mt) return null; const w = car4World(car, mt), ph = car4Ph(car), S = car4Cfg(car, 'sensors');
  if (s.type === 'ultrasonic') {
    let best = null; const half = (S.usFov / 2) * deg;
    for (const k of [-1, -0.5, 0, 0.5, 1]) { const h = car4Ray(car, w.x, w.z, w.a + k * half, S.usMax, mt.y - 25, ph.t); if (h && (!best || h.d < best.d)) best = h; }
    const d = best && best.d >= S.usMin ? best.d : null; return { kind: 'us', dist: d, id: best && best.id, val: d != null ? d / 10 : null, w };
  }
  if (s.type === 'ir') { const range = trimVal(s, 'range'); let best = null; for (const k of [-1, 0, 1]) { const h = car4Ray(car, w.x, w.z, w.a + k * 0.09, range, mt.y - 25, ph.t); if (h && (!best || h.d < best.d)) best = h; } return { kind: 'ir', dist: best ? best.d : null, val: best ? 1 : 0, w }; }
  if (s.type === 'ldr' || s.type === 'ldra') { const L = car4LightAt(car, w.x, w.y, w.z, w.fx, w.fz, (s.props.sens ?? 100) / 100); return { kind: 'ldr', light: L, val: L, w }; }
  if (s.type === 'irline') { const r = car4Reflect(car, w.x, w.z, 3 + mt.y * 0.15); return { kind: 'line', reflect: r, val: r, w }; }
  return null;
}
function car4Mounted(c) { const out = []; for (const o of comps.values()) if (o.props && o.props.carMount && car4Of(o) === c) out.push(o); return out; }
function car4SenseAll(c) {   // once per physics step: the overlays, the labels and the safety stop share it
  const S = c.state, k = `${car4Ph(c).t}|${car4Env(c).ver}|${comps.size}`; if (S.senseK === k && S.senseV) return S.senseV;
  S.senseK = k; return (S.senseV = car4Mounted(c).map((s) => ({ s, ...(car4Sense(c, s) || {}) })));
}
// The type's own tick still runs (its LEDs and animations); while the type works out its output pin and its readings, the
// table's reading is swapped in (apply → undo), so the bench and the table never fight over the same value.
function car4Wrap(type, key, apply) {
  const T = TYPES[type]; if (!T || T.car4Wrapped) return; T.car4Wrapped = true;
  const tk = T.tick, out = T.outputs, rd = T.readings;
  const swap = (s, fn) => { const r = s.state.c4, undo = r && apply(s, r); try { return fn(); } finally { if (undo) undo(); } };
  T.tick = function (s, dt, now) {
    if (tk) tk.call(this, s, dt, now);
    const car = car4Of(s), r = car ? car4Sense(car, s) : null, k = r ? key(r) : null;
    if (k !== (s.state.c4 ? key(s.state.c4) : null)) dirty = true;
    s.state.c4 = r; if (r && type === 'ultrasonic') { s.state.dist = r.dist; s.state.hit = r.dist != null ? { dist: r.dist } : null; }
  };
  if (out) T.outputs = function (s, ctx, prev) { return swap(s, () => out.call(this, s, ctx, prev)); };
  if (rd) T.readings = function (s) { return swap(s, () => rd.call(this, s)); };
}
car4Wrap('ultrasonic', () => null, () => null);
car4Wrap('ir', (r) => r.dist != null, (s, r) => { const o = s.state.detect, oh = s.state.hit; s.state.detect = r.dist != null; s.state.hit = r.dist != null ? { dist: r.dist } : null; return () => { s.state.detect = o; s.state.hit = oh; }; });
car4Wrap('ldr', (r) => Math.round(r.light), (s, r) => { const o = s.props.light; s.props.light = r.light; return () => { s.props.light = o; }; });

// ---- 7. the part ----
function buildCar4(c) {
  const mdl = car4Model({ dims: c.props.cfg && c.props.cfg.dims, wiring: car4Cfg(c, 'battery').wiring });
  c.pins = mdl.pins.map((p) => ({ ...p, name: CAR4_PINNAME[p.id][0], desc: CAR4_PINNAME[p.id][1] }));
  c.spin = mdl.spin; c.knob = mdl.knob; c.height = mdl.L.top + 26; c.mdl = mdl;
  aoPad(mdl.g, 0, 0, 0, mdl.D.length, mdl.D.width, 0.38);
  return mdl.g;
}
const CAR4_PINNAME = Object.fromEntries([...CAR4_PINS, ...CAR4_STRIP].map((id) => {
  if (/^V\d$/.test(id)) return [id, [`${id} (sensor power)`, 'Sensor power strip: V1–V4 are joined. Feed one of them from the controller’s 5 V (or 3.3 V) and power each sensor’s VCC from another.']];
  if (/^G\d$/.test(id)) return [id, [`${id} (sensor ground)`, 'Sensor power strip: G1–G4 are ground, joined to the battery’s −.']];
  if (id[0] === 'B') return [id, id === 'B+' ? ['B+ (battery +)', 'Battery +, through the switch: to the driver’s motor supply (VIN, VM, BAT+ or VCC)'] : ['B− (battery −)', 'Battery −: to the driver’s GND, which must also join the controller’s GND']];
  const m = id.slice(0, 2), pol = id[2]; return [id, [`${id.replace('-', '−')} (${CAR4_MN[m]} motor ${pol === '+' ? 'red' : 'black'})`, `${CAR4_MN[m]} motor, ${pol === '+' ? 'red lead' : 'black lead'}: to one of a driver’s motor outputs`]];
}));
function car4Wired(c, pin) { const ep = `${c.id}:${pin}`; return wires.some((w) => w.a === ep || w.b === ep); }
function car4Checks(c) {   // what is wrong or worth knowing, part by part: [{ level, part, title, text }]
  const out = [], pk = car4Pack(c), running = run.state === 'running', ph = car4Ph(c), mc = car4Cfg(c, 'motor');
  for (const m of CAR4_M) if (!car4Wired(c, m + '+') || !car4Wired(c, m + '-')) out.push({ level: 'warn', part: CAR4_MID[m], title: `${CAR4_MN[m]} motor isn’t connected`, text: `Wire ${m}+ and ${m}− on the car’s terminal block to a motor output of your driver.` });
  if (!car4Wired(c, 'B+') || !car4Wired(c, 'B-')) out.push({ level: (c.props.src || 'circuit') === 'circuit' ? 'warn' : 'ok', part: 'battery_holder_18650', title: 'The battery isn’t wired to the driver', text: 'Wire B+ to the driver’s motor supply (VIN / VM / BAT+) and B− to its GND, or power the driver from another battery.' });
  if (c.props.on === false) out.push({ level: 'warn', part: 'power_switch', title: 'The car’s power switch is OFF', text: 'Switch it ON (the car part’s Power button, or the battery holder in the arena).' });
  if (pk.full > mc.ratedV + 0.01) out.push({ level: 'warn', part: 'battery_holder_18650', title: `${pk.wiring}: up to ${pk.full.toFixed(1)} V for TT motors rated ${mc.ratedV} V`, text: 'The motors see the battery voltage at full speed (less the driver’s drop). Keep the speed down, or use 2P.' });
  if (pk.cell < 3.3) out.push({ level: pk.cell <= 3.0 ? 'bad' : 'warn', part: 'battery_holder_18650', title: pk.cell <= 3.0 ? 'The battery is empty' : 'Low battery', text: `${pk.cell.toFixed(2)} V a cell. Charge the cells (set the level in the battery’s properties).` });
  if ((c.state.Iall || 0) > pk.maxA) out.push({ level: 'bad', part: 'battery_holder_18650', title: 'Too much current for the cells', text: `${(c.state.Iall || 0).toFixed(2)} A drawn, the limit you set is ${pk.maxA.toFixed(1)} A.` });
  if (ph.hit) out.push({ level: 'warn', part: 'chassis_bottom', title: `Collision with ${ph.hit.what}`, text: 'The robot is pushing against it; its wheels slip.' });
  for (const s of car4Mounted(c)) if (running && !s.state.powered) out.push({ level: 'warn', part: null, sensor: s.id, title: `${TYPES[s.type].name} on the car has no power`, text: 'Wire its VCC and GND to the controller (or the driver’s sensor header).' });
  return out;
}
TYPES.car4wd = {
  name: '4WD Robot Car', meta: '18650 Edition · 4 TT motors FL FR RL RR · 2 × 18650 · drives in the Robot Arena', lift: 0, props: { on: true, src: 'circuit' }, build: buildCar4,
  pinNode(c, pin) { return pin === 'B-' || /^G\d$/.test(pin) ? 'GND' : /^V\d$/.test(pin) ? `${c.id}:vbus` : null; },
  elements(c, ctx, power) {
    const R0 = car4MotorK(car4Cfg(c, 'motor')).R;
    for (const m of CAR4_M) ctx.R(m + '+', m + '-', (c.state.Rm && c.state.Rm[m]) || R0, m);
    if (power && c.props.on !== false && (c.props.src || 'circuit') === 'circuit') { const P = car4Pack(c); if (P.soc > 0) ctx.Vp('B+', P.voc, Math.max(0.02, P.rin), 'bat'); }
  },
  tick(c, dt, now) { car4Tick(c, dt, now); },
  active(c) { const ph = c.state.ph; return ph && (Math.abs(ph.v) > 0.01 || Math.abs(ph.r) > 0.05) && 'driving'; },
  controls(c) {
    return `<button type="button" class="tool" data-act="car4-panel">Robot panel</button><button type="button" class="tool" data-act="car4-reset">Reset robot</button><button type="button" class="tool${c.props.on !== false ? ' on-state' : ''}" data-act="car4-power">${c.props.on !== false ? 'Power ON' : 'Power OFF'}</button>`;
  },
  onTool(c, b) { const act = b.dataset.act; if (act === 'car4-panel' && typeof c4hudShow === 'function') c4hudShow(true); if (act === 'car4-reset') car4Reset(c); if (act === 'car4-power') { c.props.on = c.props.on === false; dirty = true; save(); select(selection); } },
  readings(c) {
    const ph = car4Ph(c), pk = car4Pack(c), I = c.state.Iall || 0, drv = car4Driver(c), ctl = car4Controller(c), pr = c.props.proj, src = c.props.src || 'circuit', S = car4SenseAll(c);
    const mode = src === 'manual' ? `Manual (${c.state.manBy || 'joystick'})` : src === 'test' ? 'Motor test bench' : 'Program';
    return [['Robot', `x ${Math.round(ph.x)} mm, y ${Math.round(-ph.z)} mm, heading ${Math.round((((ph.th / deg) % 360) + 360) % 360)}°`], ['Speed', `${Math.round(ph.v * 1000)} mm/s${ph.hit ? ` · collision with ${ph.hit.what}` : ''}`, ph.hit ? 'bad' : Math.abs(ph.v) > 0.01 ? 'hi' : ''], ['Mode', mode, 'hi'],
      ...CAR4_M.map((m) => [CAR4_MN[m], `${fmtNum(ph.V[m], 2)} V · ${Math.round((ph.w[m] * 30) / Math.PI)} rpm · ${Math.abs(ph.V[m]) < 0.05 ? 'stopped' : (ph.V[m] > 0) === (m[1] === 'L') ? 'forward' : 'backward'}`, Math.abs(ph.w[m]) > 0.5 ? 'hi' : '']),
      ['Battery', `${pk.wiring} · ${(pk.voc - pk.rin * I).toFixed(2)} V · ${Math.round(pk.soc * 100)}% · ${Math.round(I * 1000)} mA`, pk.cell < 3.3 ? 'bad' : 'ok'],
      ['Controller', ctl ? TYPES[ctl.type].name : 'none on the robot'], ['Driver', drv.o ? `${drv.name}${drv.paired ? ' · 2 channels, motors paired' : ' · 4 channels'}` : 'none on the robot'],
      ...S.map((x) => [TYPES[x.s.type].name, x.kind === 'us' ? (x.dist != null ? `${(x.dist / 10).toFixed(1)} cm` : 'no echo') : x.kind === 'ldr' ? `light ${Math.round(x.light)}` : x.kind === 'line' ? (x.reflect < 0.5 ? 'black' : 'white') : x.dist != null ? 'object' : 'clear']),
      ...(pr ? [['Project', `${(C4P_PROJ[pr.proj] || {}).name || pr.proj} · ${(C4P_CTRL[pr.ctrl] || {}).name || pr.ctrl}`]] : []), ['Data', CAR4.dimsSource, 'note']];
  },
};
{ const mo = LIBRARY.find((k) => k[0] === 'Motion'); if (mo && !mo[1].includes('car4wd')) mo[1].unshift('car4wd'); }
if (typeof HG_LOAD === 'object') HG_LOAD.car4wd = 'The 4WD Robot Car’s TT motors: about 0.1–0.3 A each running, up to the stall current you set (illustrative 0.8 A) when blocked; one motor per channel stays inside the 800 mA a channel.';
if (typeof ESP_PARTS === 'object') ESP_PARTS.car4wd = { motor: true };
