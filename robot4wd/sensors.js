/* ---- 4WD Robot Car sensors: LDR Light Sensor (analog) + IR Line Tracking Sensor (TCRT5000) ----
   Two 4-pin LM393 comparator modules (pins VCC GND DO AO) for the robot car. Each reads the robot table's table when it is
   mounted on a car (props.carMount + props.carId, see CAR4_MOUNTS), and the bench otherwise. Spliced into the 4WD Robot Car
   section after the car code: it uses car4Of / car4Sense / CAR4_MOUNTS / car4Open from there, and TYPES, TRIMS, LIBRARY,
   PROP_CHOICES and ESP_PARTS from the rest of the lab. Source: robot4wd/sensors.js.

   Electrical models (values marked illustrative are not from a measured part):

   TYPES.ldra · LDR Light Sensor (analog): the common 4-pin photoresistor module.
   - Light L on the lab's 0–100 scale (12 = a room). On the car: car4Sense(car, c) → { kind: 'ldr', light } from the arena's
     lights; car4LightAt has already multiplied by the sensitivity (props.sens, %) and clamped to 0–100, so it is used as it is.
     On the bench: lightAt() at the LDR's face (c.headLocal), read as the 3-pin `ldr` reads it, × sens / 100, clamped to 0–100.
   - lux = 200 · (L / 12)^1.5: about 200 lux in a room, 4800 lux at L = 100 (illustrative mapping of the lab scale).
   - R_ldr = 10 kΩ · (lux / 10)^−0.7, at most 1 MΩ in the dark: a GL5528-like CdS cell, γ ≈ 0.7 (illustrative).
   - AO = VCC · R_ldr / (R_ldr + 10 kΩ): the LDR is the bottom leg of a divider under a 10 kΩ resistor, so on this module
     AO FALLS as the light rises (on 5 V: about 0.55 V in a room, 0.07 V at L = 100, 4.95 V in the dark). The pin's output
     resistance is the divider's, R_ldr ∥ 10 kΩ. props.aoFalls = false gives VCC − that (a board with the divider turned round).
   - DO: the LM393 compares AO with the trim pot's wiper. The pot is kept as a light level (TRIMS.ldra key 'dark', the key the
     robot table's sensor panel reads too); AO is monotonic in L, so "L below the setting" is the same test as "AO above the
     wiper". DO is HIGH when it is darker than the setting and LOW when brighter, and the DO LED (from VCC into the
     open-collector output) lights while DO is LOW. props.aoFalls leaves DO alone: on a board with the divider turned round
     the comparator's inputs are swapped as well.

   TYPES.irline · IR Line Tracking Sensor (TCRT5000): the common 4-pin TCRT5000 + LM393 module.
   - Reflectance r: 0 (black tape) … 1 (white). On the car: car4Sense(car, c) → { kind: 'line', reflect } from the arena
     table's line raster under the front bumper. On the bench: props.surface / 100 (0–100 %, default 90 = a white table),
     set with the Surface slider.
   - AO = GND + VCC · (0.08 + 0.86 · (1 − r)): the phototransistor under its 10 kΩ pull-up. HIGH over black (little IR comes
     back), LOW over white (about 0.4 V on 5 V). Output resistance 10 kΩ.
   - DO: the LM393 compares that voltage with the trim pot (TRIMS.irline key 'thresh', % of VCC, default 50 %): HIGH over
     black, LOW over white, with the DO LED lit while DO is LOW (typical module behaviour).
   - props.blackHigh = false inverts both AO and DO (modules that read the other way round).

   Both: module: true (wires go on the header pins), a 2 kΩ load between VCC and GND, powered above 2.7 V (modulePower).
   tick() takes the reading (arena or bench) and works out the outputs; outputs() applies the props and the trim to the last
   reading and drives AO and DO, so a toggle or a turned trim acts in the very next solve. While the program runs, the
   solver is asked to re-solve (dirty) only when AO moves by more than 0.5 % of VCC or DO flips. */

// ---- 1. the models (pure: the reading in, the pin levels out, as fractions of VCC) ----
const LDRA = { rTop: 10000, r10: 10000, gamma: 0.7, rDark: 1e6 };   // illustrative GL5528-like cell under a 10 kΩ resistor
function ldraModel(c, L) {
  L = clamp(Number.isFinite(L) ? L : AMBIENT_LIGHT, 0, 100);
  const lux = 200 * Math.pow(L / 12, 1.5);
  const R = Math.min(LDRA.rDark, LDRA.r10 * Math.pow(Math.max(lux, 1e-9) / 10, -LDRA.gamma));
  const frac = R / (R + LDRA.rTop), dark = L < trimVal(c, 'dark');
  return { L, lux, R, frac, ao: c.props.aoFalls === false ? 1 - frac : frac, dark, rOut: (R * LDRA.rTop) / (R + LDRA.rTop) };
}
// the light on the LDR: the arena when it is on a car, the bench otherwise
function ldraSense(c) {
  const car = car4Of(c), r = car ? car4Sense(car, c) : null;
  if (r && r.kind === 'ldr') return { L: clamp(r.light, 0, 100), r, car };
  const L = c.group && c.headLocal ? lightAt(c.group.localToWorld(c.headLocal.clone())) : AMBIENT_LIGHT;
  return { L: clamp((L * (c.props.sens ?? 100)) / 100, 0, 100), r: null, car: null };
}
function irlModel(c, r) {
  r = clamp(Number.isFinite(r) ? r : 0.9, 0, 1);
  const raw = 0.08 + 0.86 * (1 - r), black = raw > trimVal(c, 'thresh') / 100, inv = c.props.blackHigh === false;
  return { r, raw, black, ao: inv ? 1 - raw : raw, doHigh: inv ? !black : black };
}
function irlSense(c) {
  const car = car4Of(c), r = car ? car4Sense(car, c) : null;
  if (r && r.kind === 'line') return { r: clamp(r.reflect, 0, 1), c4: r, car };
  return { r: clamp((c.props.surface ?? 90) / 100, 0, 1), c4: null, car: null };
}
// ask the solver again only when AO moved by more than 0.5 % of VCC or DO flipped, and only while the program runs
function c4sMaybeDirty(c, ao, dHigh) {
  if (run.state !== 'running') return;
  if (Math.abs(ao - (c.state.sentAo ?? -1)) > 0.005 || dHigh !== c.state.sentDo) { c.state.sentAo = ao; c.state.sentDo = dHigh; dirty = true; }
}
const c4sOhm = (R) => (R >= 1e6 ? `${(R / 1e6).toFixed(1)} MΩ` : R >= 1000 ? `${(R / 1000).toFixed(R < 1e4 ? 2 : 1)} kΩ` : `${Math.round(R)} Ω`);
const c4sMount = (c) => { const m = CAR4_MOUNTS[c.props.carMount]; return m ? m.name.toLowerCase() : 'on the car'; };

// ---- 2. the 3D models (blueprint style of the lab's other sensor modules; build() never needs comps or a car) ----
const C4S_LBL = (g, x, top, z) => { const l = new THREE.PlaneGeometry(4.4, 3.2); l.rotateX(-Math.PI / 2); mesh(l, new THREE.MeshStandardMaterial({ map: cached('lm393Lbl', () => labelTexture(4.4, 3.2, [['LM393', 0.85, 700], ['BAK', 0.7, 600]], '#c9c6cf')), transparent: true, depthWrite: false }), g, x, top + 1.62, z, false, false); };
const C4S_PINS = ['VCC', 'GND', 'DO', 'AO'];
function buildLDRA(c) {
  // 32 × 14 board: header VCC GND DO AO, mounting hole, power and DO LEDs, blue trimmer, LM393, a 100 nF capacitor, four
  // resistors, and the GL5528 photoresistor lying on its side at the +x end, its face to the light (as on the 3-pin module)
  const g = new THREE.Group(), W = 32, D = 14, HX = -14.4, zs = zsOf(4);
  const tex = moduleTexture('ldra1', W, D, MOD_BLUE, (T, ring, cx, S) => {
    holeRing(cx, S, W, D, -5.6, 0, 1.5);
    C4S_PINS.forEach((t, i) => T(t, -11.8, zs[i], 1.05, { align: 'left', weight: 800 }));
    silkBox(cx, S, W, D, -6.4, -5.1, 3.0, 2.0); silkBox(cx, S, W, D, -6.4, 5.1, 3.0, 2.0);
    T('PWR', -3.55, -5.1, 0.72, { weight: 700 }); T('DO', -3.75, 5.1, 0.72, { weight: 700 });
    for (const z of [-1.27, 1.27]) silkBox(cx, S, W, D, 12.0, z, 1.8, 1.8);
    T('RBS', 9.85, 0, 1.3, { weight: 800, italic: true, spacing: 0.12, rot: Math.PI / 2 });
  });
  const top = modulePCB(g, W, D, MOD_BLUE_N, tex);
  const ey = maleHeaderX(g, top, HX, zs);
  c.leds = { pwr: smdLedM(g, -6.4, top, -5.1, 0xff3b30), out: smdLedM(g, -6.4, top, 5.1, 0x22ff66) };
  addTrimKnob(c, trimPot(g, 1.0, top, -2.8, M.potBlue, 6.4), 'dark');
  soic8(g, 1.0, top, 3.6); C4S_LBL(g, 1.0, top, 3.6);
  smdChip(g, -2.9, top, 3.6, 'cap', true);
  for (const [x, z, t] of [[6.9, -4.6, '103'], [6.9, -1.6, '103'], [6.9, 1.6, '102'], [6.9, 4.6, '102']]) smd1206(g, x, top, z, t);
  // the photoresistor: a 5 mm disc on its side, its legs bent down into the board
  const ay = top + 2.6, ldrMat = cached('ldrSide', () => new THREE.MeshStandardMaterial({ color: 0xffd8b0, roughness: 0.4 }));
  const disc = new THREE.CylinderGeometry(2.55, 2.55, 1.8, 32); disc.rotateZ(Math.PI / 2);
  mesh(disc, [ldrMat, ldrMat, cached('ldrFace', () => new THREE.MeshStandardMaterial({ map: ldrFaceTexture(), roughness: 0.3 }))], g, 16.4, ay, 0);
  for (const dz of [-1.27, 1.27]) { const lg = new THREE.Group(); lg.position.z = dz; g.add(lg); straightLeg(lg, [[15.5, ay], [12.6, ay], [12.0, top + 0.2]], 0.22); }
  solderJoints(g, [[12.0, -1.27, 0.62], [12.0, 1.27, 0.62]], top);
  c.sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xfff0c2, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  c.sun.position.set(18.2, ay, 0); c.sun.scale.setScalar(16); g.add(c.sun);
  c.headLocal = new V3(17.4, ay, 0);
  moduleUnder(g, 'ldra1', W, D, MOD_BLUE, [...zs.map((z) => [HX, z, 0.8]), [12.0, -1.27, 0.6], [12.0, 1.27, 0.6], [-1.5, -2.8, 0.6], [1.0, -2.8, 0.6], [3.5, -2.8, 0.6]], [[-5.6, 0, 1.5]]);
  c.paths = [powerPath(HX, ey, top, zs[0], zs[1], -8.2)];
  c.pins = pinList(C4S_PINS, HX, ey, zs, {
    VCC: ['VCC', 'Power in: 3.3–5 V (5V or 3V3)'], GND: PIN_DESC.GND,
    DO: ['DO', 'Digital out: LOW when brighter than the blue knob’s setting (DO LED on), HIGH when darker'],
    AO: ['AO', 'Analog out: on this module it falls as the light rises · analogRead()'] });
  c.height = top + 7;
  return g;
}
function buildIRLine(c) {
  // 32 × 14 board: header VCC GND DO AO, mounting hole, power and DO LEDs, blue trimmer, LM393, a 100 nF capacitor, four
  // resistors, and the black TCRT5000 lying on its side at the +x end, its two lenses (blue-ish emitter, black detector)
  // facing +x. On the car the arena turns the board face-down, so the lenses look at the table.
  const g = new THREE.Group(), W = 32, D = 14, HX = -14.4, zs = zsOf(4);
  const tex = moduleTexture('irline1', W, D, MOD_BLUE, (T, ring, cx, S) => {
    holeRing(cx, S, W, D, -4.6, 0, 1.5);
    C4S_PINS.forEach((t, i) => T(t, -11.8, zs[i], 1.05, { align: 'left', weight: 800 }));
    T('RBS', -8.15, 0, 1.15, { weight: 800, italic: true, spacing: 0.12, rot: Math.PI / 2 });
    silkBox(cx, S, W, D, -6.4, -5.1, 3.0, 2.0); silkBox(cx, S, W, D, -6.4, 5.1, 3.0, 2.0);
    T('PWR', -3.4, -5.6, 0.72, { weight: 700 }); T('DO', -3.6, 5.6, 0.72, { weight: 700 });
    silkBox(cx, S, W, D, 8.65, 0, 3.2, 7.6);   // the sensor's four pads
  });
  const top = modulePCB(g, W, D, MOD_BLUE_N, tex);
  const ey = maleHeaderX(g, top, HX, zs);
  c.leds = { pwr: smdLedM(g, -6.4, top, -5.1, 0xff3b30), out: smdLedM(g, -6.4, top, 5.1, 0x22ff66) };
  addTrimKnob(c, trimPot(g, 0.9, top, -2.8, M.potBlue, 6.4), 'thresh');
  soic8(g, 0.9, top, 3.6); C4S_LBL(g, 0.9, top, 3.6);
  smdChip(g, -2.45, top, 3.6, 'cap', true);
  for (const [x, z, t] of [[5.75, -4.6, '151'], [5.75, -1.6, '103'], [5.75, 1.6, '102'], [5.75, 4.6, '102']]) smd1206(g, x, top, z, t);
  // the TCRT5000: 10.2 × 5.8 × 7 mm, lying on its 5.8 mm side. A base block, then two towers with a slit between them,
  // each with its lens; the four leads leave the back and bend down into the board in two rows
  const yc = top + 2.9, X0 = 10.2, XB = 15.7, XT = 17.3;
  const body = cached('tcrtBody', () => new THREE.MeshPhysicalMaterial({ color: 0x17171b, roughness: 0.62, clearcoat: 0.18, clearcoatRoughness: 0.55, bumpMap: GRAIN, bumpScale: 0.4 }));
  mesh(rbox(XB - X0, 5.8, 10.2, 0.3), body, g, (X0 + XB) / 2, yc, 0);
  for (const z of [-2.62, 2.62]) mesh(rbox(XT - XB + 0.2, 5.8, 4.92, 0.28), body, g, (XB - 0.2 + XT) / 2, yc, z);
  c.emitMat = new THREE.MeshPhysicalMaterial({ color: 0x7d9cf0, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.04, transparent: true, opacity: 0.92, emissive: 0x9a6bff, emissiveIntensity: 0 });
  const det = cached('tcrtDet', () => new THREE.MeshPhysicalMaterial({ color: 0x050507, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03 }));
  const dome = cached('tcrtDome', () => { const q = new THREE.SphereGeometry(1.6, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2); q.rotateZ(-Math.PI / 2); q.scale(0.5, 1, 1); return q; });
  const rim = cached('tcrtRim', () => { const q = new THREE.CylinderGeometry(1.85, 1.85, 0.3, 32); q.rotateZ(Math.PI / 2); return q; });
  for (const [z, mat] of [[-2.62, c.emitMat], [2.62, det]]) { mesh(rim, body, g, XT + 0.1, yc, z, false, false); mesh(dome, mat, g, XT + 0.2, yc, z); }
  for (const z of [-2.62, 2.62]) for (const [dy, xd] of [[-1.27, 9.4], [1.27, 7.9]]) { const lg = new THREE.Group(); lg.position.z = z; g.add(lg); straightLeg(lg, [[X0 + 0.3, yc + dy], [xd, yc + dy], [xd, top + 0.2]], 0.25); }
  solderJoints(g, [[9.4, -2.62, 0.62], [9.4, 2.62, 0.62], [7.9, -2.62, 0.62], [7.9, 2.62, 0.62]], top);
  const mk = new THREE.PlaneGeometry(5.0, 1.3); mk.rotateX(-Math.PI / 2);
  mesh(mk, new THREE.MeshStandardMaterial({ map: cached('tcrtLbl', () => labelTexture(5.0, 1.3, [['TCRT5000', 0.78, 700]], '#a3a3ad')), transparent: true, depthWrite: false }), g, (X0 + XB) / 2, yc + 2.91, 0, false, false);
  c.headLocal = new V3(XT + 1.0, yc, 0);
  moduleUnder(g, 'irline1', W, D, MOD_BLUE, [...zs.map((z) => [HX, z, 0.8]), [9.4, -2.62, 0.6], [9.4, 2.62, 0.6], [7.9, -2.62, 0.6], [7.9, 2.62, 0.6], [-1.6, -2.8, 0.6], [0.9, -2.8, 0.6], [3.4, -2.8, 0.6]], [[-4.6, 0, 1.5]]);
  c.paths = [powerPath(HX, ey, top, zs[0], zs[1], -9.6)];
  c.pins = pinList(C4S_PINS, HX, ey, zs, {
    VCC: ['VCC', 'Power in: 3.3–5 V (5V or 3V3)'], GND: PIN_DESC.GND,
    DO: ['DO', 'Digital out: HIGH over a black line, LOW over white (DO LED on); set the level with the blue knob'],
    AO: ['AO', 'Analog out: high over black, low over white · analogRead()'] });
  c.height = top + 7;
  return g;
}

// ---- 3. the parts ----
TRIMS.ldra = [{ key: 'dark', title: 'DO goes HIGH below', min: 5, max: 80, def: 40, fmt: (v) => `${Math.round(v)}% light`, more: 'calls it dark sooner', less: 'needs more darkness', btn: 'Adjust DO level', tag: (v) => `DO at ${Math.round(v)}%` }];
TRIMS.irline = [{ key: 'thresh', title: 'DO threshold', min: 10, max: 90, def: 50, fmt: (v) => `${Math.round(v)}% of VCC`, more: 'needs a darker line', less: 'counts grey as black', btn: 'Adjust threshold', tag: (v) => `DO at ${Math.round(v)}%` }];
TYPES.ldra = {
  name: 'LDR Light Sensor (analog)', meta: 'Light · LM393 · VCC GND DO AO', lift: 0, props: { sens: 100, aoFalls: true }, build: buildLDRA, module: true, hasProps: true,
  elements(c, ctx) { ctx.R('VCC', 'GND', 2000, 'load'); },
  outputs(c, ctx, prev) {
    const p = modulePower(c, prev); c.state.powered = p.on; if (!p.on) return;
    const m = (c.state.m = ldraModel(c, c.state.m ? c.state.m.L : ldraSense(c).L)), span = p.vcc - p.gnd;   // the last reading, with today's props and trim
    ctx.Vp('AO', p.gnd + m.ao * span, Math.max(100, m.rOut), 'AO');
    ctx.Vp('DO', m.dark ? p.vcc : p.gnd, 100, 'DO');
  },
  tick(c, dt) {
    const s = ldraSense(c), m = (c.state.m = ldraModel(c, s.L)); c.state.c4 = s.r;
    c4sMaybeDirty(c, m.ao, m.dark);
    moduleLeds(c, !m.dark, dt);   // the DO LED sits between VCC and the comparator's output: lit while DO is LOW (bright)
    c.sun.material.opacity += ((m.L / 100) * 0.85 - c.sun.material.opacity) * Math.min(1, dt * 10);
  },
  controls(c) {
    const m = c.state.m, car = car4Of(c), fall = c.props.aoFalls !== false;
    return `<span class="chipv">Light ${pct(m ? m.L : AMBIENT_LIGHT)}</span><button type="button" class="tool" data-act="ldra-ao" title="Which way AO moves as the light rises">${fall ? 'AO falls as it gets brighter' : 'AO rises as it gets brighter'}</button>${rangeCtl('sens', 'Sensitivity', c.props.sens ?? 100, 10, 300, '%', 5)}${car ? `<span class="note">On the car (${c4sMount(c)}): it reads the robot table</span><button type="button" class="tool" data-act="c4s-arena">Robot panel</button>` : notStarted('The prop')}`;
  },
  onTool(c, b) {
    if (b.dataset.act === 'ldra-ao') { c.props.aoFalls = c.props.aoFalls === false; dirty = true; save(); }
    if (b.dataset.act === 'c4s-arena') { const car = car4Of(c); if (car) car4Open(car); }
  },
  readings(c) {
    const m = c.state.m || ldraModel(c, ldraSense(c).L), on = c.state.powered, ao = pinV(c, 'AO'), d = pinV(c, 'DO'), car = car4Of(c);
    return [powerRow(c, on),
      ['Light on it', `${pct(m.L)} · about ${m.lux < 10 ? m.lux.toFixed(1) : Math.round(m.lux)} lux`, m.dark ? '' : 'hi'],
      ['Reads', car ? `the robot table (${c4sMount(c)})` : 'the bench: room light, torch, lamp'],
      ['LDR', `${c4sOhm(m.R)} (GL5528-like, illustrative)`],
      ['AO', on ? `${volts(ao)} · analogRead ≈ ${adc(ao)}` : '–', on ? 'hi' : ''],
      ['DO', on ? `${hiLo(d)} · ${m.dark ? 'darker than the knob' : 'brighter than the knob (LED on)'}` : '–'],
      ['AO direction', c.props.aoFalls === false ? 'rises with the light (inverted)' : 'falls as the light rises']];
  },
  tags(c) { const m = c.state.m; return [{ cls: 'val', text: `Light ${pct(m ? m.L : AMBIENT_LIGHT)}`, pos: lw(c, 14, c.height + 4) }]; },
};
TYPES.irline = {
  name: 'IR Line Tracking Sensor (TCRT5000)', meta: 'TCRT5000 · line · VCC GND DO AO', lift: 0, props: { surface: 90, blackHigh: true }, build: buildIRLine, module: true,
  elements(c, ctx) { ctx.R('VCC', 'GND', 2000, 'load'); },
  outputs(c, ctx, prev) {
    const p = modulePower(c, prev); c.state.powered = p.on; if (!p.on) return;
    const m = (c.state.m = irlModel(c, c.state.m ? c.state.m.r : irlSense(c).r)), span = p.vcc - p.gnd;   // the last reading, with today's props and trim
    ctx.Vp('AO', p.gnd + m.ao * span, 10000, 'AO');
    ctx.Vp('DO', m.doHigh ? p.vcc : p.gnd, 100, 'DO');
  },
  tick(c, dt) {
    const s = irlSense(c), m = (c.state.m = irlModel(c, s.r)); c.state.c4 = s.c4;
    c4sMaybeDirty(c, m.ao, m.doHigh);
    moduleLeds(c, !m.doHigh, dt);   // lit while DO is LOW: over white on the usual module
    c.emitMat.emissiveIntensity += ((c.state.powered ? 0.55 : 0) - c.emitMat.emissiveIntensity) * Math.min(1, dt * 8);   // IR looks faintly violet to a camera
  },
  controls(c) {
    const m = c.state.m, car = car4Of(c), inv = c.props.blackHigh === false;
    return `<span class="chipv">${m && m.black ? 'Black line' : 'White'} · ${pct((m ? m.r : 0.9) * 100)}</span>${car ? `<span class="note">On the car (${c4sMount(c)}): it reads the robot’s table</span><button type="button" class="tool" data-act="c4s-arena">Robot panel</button>` : rangeCtl('surface', 'Surface (0 black · 100 white)', c.props.surface ?? 90, 0, 100, '%')}<button type="button" class="tool" data-act="irl-pol" title="Which way AO and DO go over black">${inv ? 'LOW over black' : 'HIGH over black'}</button>`;
  },
  onTool(c, b) {
    if (b.dataset.act === 'irl-pol') { c.props.blackHigh = c.props.blackHigh === false; dirty = true; save(); }
    if (b.dataset.act === 'c4s-arena') { const car = car4Of(c); if (car) car4Open(car); }
  },
  readings(c) {
    const m = c.state.m || irlModel(c, irlSense(c).r), on = c.state.powered, ao = pinV(c, 'AO'), d = pinV(c, 'DO'), car = car4Of(c);
    return [powerRow(c, on),
      ['Surface', `${m.black ? 'black (line)' : 'white'} · reflects ${pct(m.r * 100)}`, m.black ? 'hi' : ''],
      ['Reads', car ? `the robot’s table (${c4sMount(c)})` : 'the Surface slider (bench)'],
      ['AO', on ? `${volts(ao)} · analogRead ≈ ${adc(ao)}` : '–', on ? 'hi' : ''],
      ['DO', on ? `${hiLo(d)}${m.doHigh ? '' : ' · DO LED on'}` : '–'],
      ['Polarity', c.props.blackHigh === false ? 'inverted: LOW over black' : 'HIGH over black (the usual module)']];
  },
  tags(c) { const m = c.state.m; return [{ cls: 'val', text: `${m && m.black ? 'Black line' : 'White'} · ${pct((m ? m.r : 0.9) * 100)}`, pos: lw(c, 14, c.height + 4) }]; },
};
// the screwdriver's buttons, readings rows and labels: the same wrapping the lab gives every TRIMS part at load time
// (that loop ran before this section, so these two parts get it here)
for (const type of ['ldra', 'irline']) {
  const list = TRIMS[type], T = TYPES[type], ctl = T.controls, rd = T.readings, tg = T.tags;
  T.controls = (c) => `${ctl ? ctl(c) : ''}${list.map((t, i) => `<button type="button" class="tool trim${SD.pot && SD.pot.c === c && SD.pot.i === i ? ' on' : ''}" data-trim="${i}" title="Turn the screw with a screwdriver">🪛 ${t.btn}</button>`).join('')}`;
  T.readings = (c) => [...(rd ? rd(c) : []), ...list.map((t) => [t.title, t.fmt(trimVal(c, t.key)), SD.pot && SD.pot.c === c && trimDef(c, c.trimKnobs[SD.pot.i].key) === t ? 'hi' : ''])];
  T.tags = (c) => { const base = tg ? tg(c) : []; if (!base.length) return base; base[0] = { ...base[0], text: `${base[0].text} · ${list.map((t) => t.tag(trimVal(c, t.key))).join(' · ')}` }; return base; };
}
// on the bench the analog LDR gets the same props as the 3-pin one (a torch, or a desk lamp) when you press Start
PROP_CHOICES.ldra = PROP_CHOICES.ldr.map((o) => ({ ...o, props: { ...o.props } }));
{ const se = LIBRARY.find((k) => k[0] === 'Sensors'); if (se) for (const [t, after] of [['ldra', 'ldr'], ['irline', 'ir']]) if (!se[1].includes(t)) { const i = se[1].indexOf(after); if (i >= 0) se[1].splice(i + 1, 0, t); else se[1].push(t); } }
if (typeof ESP_PARTS === 'object') {
  ESP_PARTS.ldra = { pw: '3v3', ana: ['AO'], out: ['DO'], text: 'LDR light module (analog): 3.3–5 V, so 3V3 is fine. Read AO with analogRead on GPIO 32–39 (it falls as the light rises); DO changes at the level set by its trim pot.' };
  ESP_PARTS.irline = { pw: '3v3', ana: ['AO'], out: ['DO'], text: 'TCRT5000 line sensor: 3.3–5 V (on 3V3 its IR LED is a little dimmer, so it reads a little closer). DO is HIGH over a black line on any pin; read AO on GPIO 32–39.' };
}
/* ---- end of the 4WD Robot Car sensors ---- */
