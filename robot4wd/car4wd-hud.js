// ---- 8. The robot in the lab's OWN viewport: no other window, renderer or animation loop. The table's objects (line track, lamps,
// obstacles, fence) and the overlays are added to the lab's scene; the robot panel lives inside the stage; everything updates from the
// car's tick in the lab's frame loop. Manual driving (joystick, keys, buttons, voice) and the programs drive the same motors and physics. ----
const C4H_CSS = `.c4h { --c4a: #6d4fe0; --c4a2: #8f78ff; --c4go: #1f9d68; --c4rev: #f08a24; position: absolute; right: 12px; bottom: 12px; z-index: 6; width: 336px; max-width: calc(100% - 24px); max-height: calc(100% - 24px); display: flex; flex-direction: column; background: rgba(255,255,255,.97); border: 1px solid var(--line); border-radius: 18px; box-shadow: 0 1px 2px rgba(36,27,77,.06), 0 18px 44px -14px rgba(36,27,77,.34); font: 12.5px/1.45 var(--font); color: var(--ink); overflow: hidden; backdrop-filter: blur(6px); }
.c4h[hidden] { display: none; } .c4h.min .c4h-body { display: none; } .c4h.min { width: auto; } .c4h.min .c4h-top { border-bottom: 0; }
.c4h button { font: 600 12px var(--font); color: var(--ink); cursor: pointer; } .c4h button:focus-visible, .c4h input:focus-visible, .c4h select:focus-visible, .c4h summary:focus-visible { outline: 2px solid var(--c4a); outline-offset: 1px; }
.c4h-top { display: flex; align-items: center; gap: 8px; padding: 9px 10px 9px 12px; border-bottom: 1px solid var(--line); background: linear-gradient(180deg, #fbfaff, #fff); }
.c4h-logo { width: 32px; height: 32px; flex: none; display: grid; place-items: center; border-radius: 10px; background: linear-gradient(135deg, #efeaff, #e2dafd); font-size: 17px; }
.c4h-title { min-width: 0; flex: 1; display: grid; line-height: 1.2; } .c4h-title b { font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .c4h-title small { color: var(--muted); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.c4h-chip { padding: 2px 9px; border-radius: 999px; background: var(--tint); font-size: 11px; font-weight: 700; white-space: nowrap; border: 1px solid transparent; } .c4h-chip.man { background: #fff3dc; color: #8a5a00; border-color: #f6dfae; } .c4h-chip.prog { background: #e6f7ee; color: #1b7f4f; border-color: #bfe9d2; } .c4h-chip.rem { background: #e8f0ff; color: #2b5fc4; border-color: #c8d8fb; } .c4h-chip.mod { background: #efeaff; color: #5136c4; border-color: #d9cffd; }
.c4h .x { border: 0; background: none; width: 28px; height: 28px; border-radius: 8px; font-size: 14px; color: var(--muted); } .c4h .x:hover { background: var(--tint); color: var(--ink); }
.c4h-body { overflow: auto; padding: 0 12px 12px; min-height: 0; scrollbar-width: thin; }
.c4h-stat { display: grid; grid-template-columns: 1fr 1.25fr 1fr; gap: 6px; margin: 10px 0 8px; }
.c4h-stat .st { position: relative; padding: 6px 8px; border-radius: 11px; background: var(--tint); border: 1px solid var(--line); display: grid; line-height: 1.15; overflow: hidden; }
.c4h-stat i { font-style: normal; font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; } .c4h-stat b { font-size: 14px; font-variant-numeric: tabular-nums; } .c4h-stat u { text-decoration: none; font-size: 10.5px; color: var(--muted); font-variant-numeric: tabular-nums; }
.c4h-stat em { position: absolute; left: 0; bottom: 0; height: 3px; background: var(--c4go); border-radius: 0 3px 3px 0; transition: width .3s; } .c4h-stat em.low { background: #e4a11b; } .c4h-stat em.crit { background: var(--bad); }
.c4h-stat .run b { color: var(--c4go); } .c4h-stat .stop b { color: var(--muted); }
.c4h-tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; padding: 3px; margin-bottom: 10px; background: var(--tint); border: 1px solid var(--line); border-radius: 12px; }
.c4h-tabs button { height: 30px; border: 0; border-radius: 9px; background: none; color: var(--muted); } .c4h-tabs button:hover { color: var(--ink); } .c4h-tabs button.on { background: #fff; color: var(--ink); box-shadow: 0 1px 3px rgba(36,27,77,.14); }
.c4h .b { height: 28px; padding: 0 10px; border: 1px solid var(--line); border-radius: 9px; background: #fff; display: inline-flex; align-items: center; justify-content: center; gap: 5px; white-space: nowrap; transition: background .12s, border-color .12s; } .c4h .b:hover { background: var(--tint); border-color: #d6cff0; }
.c4h .b.on { background: var(--ink); border-color: var(--ink); color: #fff; } .c4h .b.go { background: var(--c4go); border-color: var(--c4go); color: #fff; } .c4h .b.stop { background: #d4442f; border-color: #d4442f; color: #fff; } .c4h .b.big { height: 34px; font-size: 13px; flex: 1; } .c4h .b:disabled { opacity: .45; cursor: default; } .c4h .b.ghost { border-color: transparent; background: none; color: var(--muted); } .c4h .b.warn { color: #c0392b; }
.c4h-row { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; margin: 6px 0; }
.c4h-seg { display: flex; gap: 2px; padding: 3px; background: var(--tint); border: 1px solid var(--line); border-radius: 11px; margin: 0 0 6px; } .c4h-seg button { flex: 1; min-width: 0; height: 30px; border: 0; border-radius: 8px; background: none; color: var(--muted); display: grid; place-items: center; line-height: 1; gap: 1px; font-size: 11px; padding: 0 2px; }
.c4h-seg button span { font-size: 13px; } .c4h-seg.tall button { height: 40px; } .c4h-seg button:hover { color: var(--ink); } .c4h-seg button.on { background: #fff; color: var(--ink); box-shadow: 0 1px 3px rgba(36,27,77,.16); }
.c4h-auto { display: flex; align-items: center; gap: 4px; margin: 0 0 8px; font-size: 11px; color: var(--muted); } .c4h-auto button { height: 24px; padding: 0 8px; border: 1px solid var(--line); border-radius: 999px; background: #fff; font-size: 11px; font-weight: 600; } .c4h-auto button:hover { background: var(--tint); }
.c4h-f { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px 6px; align-items: center; margin: 4px 0; } .c4h-f label { color: var(--muted); }
.c4h-f input[type=number], .c4h-f select { width: 84px; height: 26px; border: 1px solid var(--line); border-radius: 8px; padding: 0 6px; font: inherit; background: #fff; } .c4h-f select.w { width: 172px; } .c4h-f input[type=range] { width: 130px; } .c4h-f input[type=color] { width: 36px; height: 24px; border: 1px solid var(--line); border-radius: 6px; padding: 0; }
.c4h input[type=range] { accent-color: var(--c4a); }
.c4h-pp { display: grid; grid-template-columns: minmax(0, 1fr) 96px 52px; gap: 2px 6px; align-items: center; margin: 4px 0; } .c4h-pp label { color: var(--muted); } .c4h-pp input[type=range] { width: 96px; } .c4h-pp input[type=number] { width: 52px; height: 26px; border: 1px solid var(--line); border-radius: 8px; padding: 0 4px; font: inherit; } .c4h-pp select { grid-column: 2 / 4; height: 26px; border: 1px solid var(--line); border-radius: 8px; font: inherit; background: #fff; }
.c4h h4 { margin: 12px 0 5px; font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase; color: var(--soft, #8d87a8); } .c4h h4:first-child { margin-top: 0; }
.c4h-note { color: var(--muted); font-size: 11.5px; margin: 4px 0; } .c4h-warn { color: #a3470a; background: #fff1e0; border: 1px solid #fbd9b4; border-radius: 9px; padding: 5px 8px; font-size: 11.5px; margin: 6px 0; } .c4h-src { font-size: 11px; color: #6d5a1a; background: #fff8e3; border: 1px solid #f3e3ae; border-radius: 9px; padding: 5px 8px; margin: 6px 0; }
.c4h-hint { display: flex; gap: 6px; align-items: flex-start; font-size: 11.5px; color: #4b3cb0; background: #f3f0ff; border: 1px solid #e2dafd; border-radius: 10px; padding: 6px 8px; margin: 6px 0; }
.c4h-drive { display: grid; grid-template-columns: 156px 1fr; gap: 10px; align-items: center; margin: 4px 0 6px; }
.c4h-base { position: relative; width: 152px; height: 152px; border-radius: 50%; background: radial-gradient(circle at 50% 46%, #fff 0 24%, #f3f0fc 25% 60%, #e8e3f7 61% 100%); border: 1px solid #d9d2f1; box-shadow: inset 0 3px 10px rgba(36,27,77,.13), 0 1px 0 #fff; touch-action: none; user-select: none; cursor: grab; }
.c4h-base.act { box-shadow: inset 0 3px 10px rgba(36,27,77,.13), 0 0 0 4px rgba(109,79,224,.14); }
.c4h-base .ring { position: absolute; inset: 14px; border-radius: 50%; border: 1px solid rgba(109,79,224,.14); pointer-events: none; }
.c4h-base .ar { position: absolute; width: 16px; height: 16px; display: grid; place-items: center; font-size: 9px; color: #a49dc4; pointer-events: none; transform: translate(-50%, -50%); } .c4h-base .ar.d { font-size: 5px; }
.c4h-base .dz { position: absolute; left: 50%; top: 50%; border-radius: 50%; border: 1px dashed #c9bff0; background: rgba(255,255,255,.55); transform: translate(-50%, -50%); pointer-events: none; }
.c4h-vec { position: absolute; left: 50%; top: 50%; height: 4px; margin-top: -2px; border-radius: 2px; background: linear-gradient(90deg, rgba(109,79,224,.12), rgba(109,79,224,.55)); transform-origin: 0 50%; pointer-events: none; width: 0; }
.c4h-knob { position: absolute; left: 50%; top: 50%; width: 54px; height: 54px; margin: -27px 0 0 -27px; border-radius: 50%; background: radial-gradient(circle at 36% 30%, #b3a4ff, #6d4fe0 55%, #4a33b8); box-shadow: 0 6px 14px rgba(56,36,160,.38), inset 0 -3px 6px rgba(0,0,0,.18), inset 0 2px 3px rgba(255,255,255,.35); pointer-events: none; transition: transform .06s; }
.c4h-knob::after { content: ''; position: absolute; inset: 14px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.25), rgba(255,255,255,0) 70%); }
.c4h-base.act .c4h-knob { transition: none; }
.c4h-side { display: grid; gap: 8px; justify-items: center; }
.c4h-pad { display: grid; grid-template-columns: repeat(3, 40px); gap: 4px; } .c4h-pad button { height: 34px; border: 1px solid var(--line); border-radius: 10px; background: #fff; font-size: 12px; color: #4b3cb0; } .c4h-pad button:hover { background: var(--tint); } .c4h-pad button:active, .c4h-pad button.on { background: var(--c4a); border-color: var(--c4a); color: #fff; } .c4h-pad .stopb { background: #d4442f; border-color: #d4442f; color: #fff; font-size: 11px; }
.c4h-swb { width: 100%; height: 30px; border: 1px solid #d9cffd; border-radius: 10px; background: #f3f0ff; color: #4b3cb0; font-size: 11.5px; } .c4h-swb.on { background: var(--c4a); color: #fff; border-color: var(--c4a); }
.c4h-speed { display: grid; grid-template-columns: auto 1fr 40px; gap: 8px; align-items: center; margin: 2px 0 4px; font-size: 11.5px; color: var(--muted); } .c4h-speed input { width: 100%; } .c4h-speed output { font-weight: 700; color: var(--ink); text-align: right; font-variant-numeric: tabular-nums; }
.c4h-dash { display: grid; grid-template-columns: 112px 1fr; gap: 10px; align-items: center; padding: 8px; margin: 8px 0; border: 1px solid var(--line); border-radius: 13px; background: linear-gradient(180deg, #fcfbff, #f6f4fd); }
.c4h-car { position: relative; width: 112px; height: 120px; } .c4h-car .body { position: absolute; left: 30px; right: 30px; top: 8px; bottom: 8px; border-radius: 12px 12px 9px 9px; background: linear-gradient(180deg, #e9e4fb, #dcd5f6); border: 1px solid #cfc6ef; display: grid; place-items: start center; } .c4h-car .body::before { content: '▲'; font-size: 9px; color: #7d70b8; margin-top: 4px; }
.c4h-car .w { position: absolute; width: 16px; height: 40px; border-radius: 5px; background: #2b2640; overflow: hidden; } .c4h-car .w i { position: absolute; left: 2px; right: 2px; border-radius: 2px; background: var(--c4go); } .c4h-car .w.r i { background: var(--c4rev); } .c4h-car .w::after { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: rgba(255,255,255,.35); }
.c4h-car .fl { left: 10px; top: 12px; } .c4h-car .fr { right: 10px; top: 12px; } .c4h-car .rl { left: 10px; bottom: 12px; } .c4h-car .rr { right: 10px; bottom: 12px; }
.c4h-car .n { position: absolute; font-size: 9.5px; font-weight: 700; color: var(--muted); font-variant-numeric: tabular-nums; } .c4h-car .n.fl { left: 0; top: 0; } .c4h-car .n.fr { right: 0; top: 0; text-align: right; } .c4h-car .n.rl { left: 0; bottom: 0; } .c4h-car .n.rr { right: 0; bottom: 0; text-align: right; }
.c4h-kv { display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 11.5px; align-content: center; } .c4h-kv span:nth-child(odd) { color: var(--muted); } .c4h-kv span:nth-child(even) { font-variant-numeric: tabular-nums; font-weight: 600; }
.c4h-hit { color: #c0392b; font-weight: 700; }
.c4h-lbl { font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase; color: var(--soft, #8d87a8); margin: 10px 0 4px; }
.c4h-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; } .c4h-cards button { display: grid; grid-template-columns: 30px 1fr; align-items: center; gap: 6px; text-align: left; padding: 7px 8px; border: 1px solid var(--line); border-radius: 12px; background: #fff; min-height: 50px; } .c4h-cards button:hover { border-color: #cfc5f4; background: #fcfbff; }
.c4h-cards button.on { border-color: var(--c4a); background: #f4f1ff; box-shadow: 0 0 0 2px rgba(109,79,224,.14); } .c4h-cards .ic { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 9px; background: var(--tint); font-size: 16px; } .c4h-cards b { display: block; font-size: 11.5px; line-height: 1.2; } .c4h-cards small { color: var(--muted); font-size: 10.5px; font-weight: 500; }
.c4h-cards button:last-child:nth-child(odd) { grid-column: 1 / -1; }
.c4h-about { padding: 8px 10px; border: 1px solid var(--line); border-radius: 12px; background: #fcfbff; margin: 8px 0; } .c4h-about p { margin: 0 0 4px; } .c4h-about ul { margin: 2px 0 6px; padding-left: 16px; } .c4h-about li { margin: 1px 0; color: var(--muted); font-size: 11.5px; } .c4h-about b.h { display: block; font-size: 11px; margin-top: 6px; }
.c4h details { margin: 6px 0; } .c4h summary { cursor: pointer; padding: 6px 8px; border-radius: 9px; background: var(--tint); border: 1px solid var(--line); font-weight: 600; font-size: 11.5px; list-style: none; display: flex; align-items: center; gap: 6px; } .c4h summary::-webkit-details-marker { display: none; } .c4h summary::before { content: '▸'; color: var(--muted); font-size: 10px; } .c4h details[open] > summary::before { content: '▾'; } .c4h summary .cnt { margin-left: auto; font-weight: 700; color: var(--muted); }
.c4h details > :not(summary) { padding: 0 2px; }
.c4h-list { display: grid; gap: 1px; } .c4h-list button { text-align: left; border: 0; background: none; padding: 4px 8px; border-radius: 7px; font-weight: 500; } .c4h-list button:hover { background: var(--tint); } .c4h-list button.on { background: #ece9ff; color: #3b2fb8; }
.c4h-ck { list-style: none; padding: 0; margin: 4px 0; display: grid; gap: 5px; } .c4h-ck li { display: grid; grid-template-columns: 10px 1fr; gap: 0 7px; font-size: 11.5px; } .c4h-ck li i { width: 8px; height: 8px; border-radius: 50%; margin-top: 4px; background: var(--ok); } .c4h-ck li.warn i { background: var(--orange); } .c4h-ck li.bad i { background: var(--bad); } .c4h-ck li span { grid-column: 2; color: var(--muted); }
.c4h-tbl { width: 100%; border-collapse: collapse; font-size: 11px; margin: 6px 0; } .c4h-tbl th, .c4h-tbl td { border: 1px solid var(--line); padding: 3px 5px; text-align: left; vertical-align: top; } .c4h-tbl th { background: var(--tint); font-weight: 700; } .c4h-tbl td.y { color: #1f8a4c; font-weight: 700; text-align: center; } .c4h-tbl td.n { color: #b03a2e; text-align: center; } .c4h-tbl td.m { color: var(--muted); text-align: center; }
.c4h-chips { display: flex; flex-wrap: wrap; gap: 5px; margin: 4px 0 8px; } .c4h-chips button { height: 28px; padding: 0 10px; border: 1px solid var(--line); border-radius: 999px; background: #fff; display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; } .c4h-chips button:hover { background: var(--tint); } .c4h-chips button.on { background: #f1edff; border-color: #cfc5f4; color: #3b2fb8; } .c4h-chips button.on::before { content: '✓'; font-size: 10px; }
.c4h-views { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; margin: 4px 0 8px; } .c4h-views button { height: 46px; border: 1px solid var(--line); border-radius: 11px; background: #fff; display: grid; place-items: center; gap: 0; font-size: 11px; line-height: 1.1; padding: 4px 2px; } .c4h-views button span { font-size: 15px; } .c4h-views button:hover { background: var(--tint); border-color: #d6cff0; } .c4h-views button.on { background: #f1edff; border-color: #cfc5f4; }
.c4h-lab { position: absolute; transform: translate(-50%, -100%); padding: 2px 7px; border-radius: 7px; background: rgba(36,27,77,.86); color: #fff; font: 600 10.5px var(--font); white-space: nowrap; pointer-events: none; z-index: 5; }
.c4h-menu { position: fixed; z-index: 1000; width: 430px; max-width: calc(100vw - 16px); max-height: 76vh; overflow: auto; background: #fff; border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 22px 50px -12px rgba(36,27,77,.35); padding: 10px; font: 12.5px var(--font); color: var(--ink); }
.c4h-menu .mh { display: flex; align-items: baseline; gap: 8px; padding: 2px 4px 8px; } .c4h-menu .mh b { font-size: 14px; } .c4h-menu .mh span { color: var(--muted); font-size: 11.5px; }
.c4h-menu .panelb { width: 100%; height: 32px; margin: 0 0 8px; border: 1px solid #d9cffd; border-radius: 10px; background: #f3f0ff; color: #4b3cb0; font: 600 12px var(--font); cursor: pointer; }
.c4h-menu .mg { display: grid; grid-template-columns: minmax(0, 1fr) repeat(3, 74px); gap: 4px 5px; align-items: center; } .c4h-menu .ch { font-size: 10.5px; color: var(--muted); text-align: center; font-weight: 700; letter-spacing: .02em; }
.c4h-menu .pj { display: grid; grid-template-columns: 30px 1fr; gap: 7px; align-items: center; padding: 4px 2px; } .c4h-menu .pj .ic { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 9px; background: var(--tint); font-size: 16px; } .c4h-menu .pj b { display: block; font-size: 12px; line-height: 1.2; } .c4h-menu .pj small { color: var(--muted); font-size: 10.5px; }
.c4h-menu .go { height: 30px; border: 1px solid var(--line); border-radius: 9px; background: #fff; font: 600 11.5px var(--font); color: var(--ink); cursor: pointer; } .c4h-menu .go:hover { background: #f4f1ff; border-color: #cfc5f4; color: #3b2fb8; } .c4h-menu .go.cur { background: var(--ink); border-color: var(--ink); color: #fff; }
.c4h-menu .ft { margin-top: 8px; color: var(--muted); font-size: 11px; padding: 0 4px; }
@media (max-width: 700px) { .c4h { width: calc(100% - 24px); max-height: 58%; } .c4h-drive { grid-template-columns: 1fr; justify-items: center; } .c4h-menu .mg { grid-template-columns: minmax(0, 1fr) repeat(3, 60px); } }
@media (prefers-reduced-motion: reduce) { .c4h-knob, .c4h-stat em { transition: none; } }`;
{ const st = document.createElement('style'); st.id = 'car4-hud-css'; st.textContent = C4H_CSS; document.head.appendChild(st); }
const C4_SENSOR_TYPES = ['ultrasonic', 'ir', 'ldr', 'ldra', 'irline'];
const c4n = (v, d = 0) => (Number.isFinite(v) ? v.toFixed(d) : '–');
// panel state (per page); the robot's own settings live in the car's props (saved with the circuit)
const C4H = { el: null, tab: 'drive', min: false, shown: true, joy: { x: 0, y: 0, on: false }, keys: new Set(), btn: null, voice: null, voiceCmd: null, tool: 'select', sel: null, follow: false, ov: { motors: true, wiring: true, beams: true, values: true, bounds: false, trail: true, wheels: true }, labels: [], lastCmd: '', uiT: 0, part: null };
const C4H_DRIVE = { maxSpeed: 80, minSpeed: 25, dead: 12, accel: 250, decel: 400, turn: 70, individual: false, safety: true, safetyCm: 12 };
const c4hCar = () => [...comps.values()].find((o) => o.type === 'car4wd') || null;
const c4hDrive = (c) => ({ ...C4H_DRIVE, ...((c && c.props.drive) || {}) });
// ---- 8a. the table's objects in the lab's scene ----
const C4W = { g: new THREE.Group(), ov: new THREE.Group(), obsM: new Map(), lightM: new Map(), car: null, ver: -1, trk: null };
C4W.g.name = 'robot-table'; C4W.ov.name = 'robot-overlays'; scene.add(C4W.g); scene.add(C4W.ov);
function c4wClear() {
  C4W.g.traverse((o) => { if (o.isMesh && o.userData.c4own) o.geometry.dispose(); }); C4W.g.clear(); C4W.obsM.clear(); C4W.lightM.clear(); C4W.ov.clear(); C4W.car = null; C4W.ver = -1;
  if (C4W.tex) { C4W.tex.dispose(); C4W.tex = null; } for (const d of C4H.labels) d.remove(); C4H.labels = [];
}
function c4wTrackCanvas(E) {   // the drawn line on a transparent canvas (the lab's workplane shows through); the sensors read car4Track's raster
  const sc = 0.5, W = Math.round(E.table.w * sc), H = Math.round(E.table.d * sc), cv = C4W.cv && C4W.cv.width === W && C4W.cv.height === H ? C4W.cv : document.createElement('canvas');
  cv.width = W; cv.height = H; const g = cv.getContext('2d'); g.clearRect(0, 0, W, H); g.lineCap = 'round'; g.lineJoin = 'round';
  if (E.show.track) for (const s of E.strokes) { if (!s.pts || !s.pts.length) continue; g.strokeStyle = s.color || E.lineColor; g.lineWidth = (s.w || E.lineW) * sc; g.beginPath(); s.pts.forEach(([x, z], i) => { const u = (x + E.table.w / 2) * sc, v = (z + E.table.d / 2) * sc; if (i) g.lineTo(u, v); else g.moveTo(u, v); }); g.stroke(); }
  C4W.cv = cv; return cv;
}
function c4wBuild(car) {
  c4wClear(); if (!car) return; C4W.car = car; const E = car4Env(car), T = E.table;
  // the line track, laid on the workplane
  const cv = c4wTrackCanvas(E); C4W.tex = new THREE.CanvasTexture(cv); C4W.tex.colorSpace = THREE.SRGBColorSpace; C4W.tex.anisotropy = 8;
  const top = new THREE.Mesh(new THREE.PlaneGeometry(T.w, T.d).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: C4W.tex, transparent: true, roughness: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  top.position.y = 0.2; top.receiveShadow = true; top.renderOrder = 1; top.userData = { c4own: true, c4table: true }; C4W.g.add(top); C4W.track = top;
  // the fence round the table: the robot's arena edge (80 mm, the ultrasonic sees it)
  const fm = cached('c4Fence', () => new THREE.MeshStandardMaterial({ color: 0xc8a57c, roughness: 0.7, transparent: true, opacity: 0.9 })), fh = E.fence ?? 80;
  if (fh > 0) for (const [w, d, x, z] of [[T.w + 20, 10, 0, -T.d / 2 - 5], [T.w + 20, 10, 0, T.d / 2 + 5], [10, T.d, -T.w / 2 - 5, 0], [10, T.d, T.w / 2 + 5, 0]]) { const f = new THREE.Mesh(new THREE.BoxGeometry(w, fh, d), fm); f.position.set(x, fh / 2, z); f.castShadow = true; f.receiveShadow = true; f.userData = { c4own: true }; C4W.g.add(f); }
  const mat = { box: cached('c4ObsBox', () => new THREE.MeshStandardMaterial({ color: 0xc69a6a, roughness: 0.8 })), wall: cached('c4ObsWall', () => new THREE.MeshStandardMaterial({ color: 0xe1ddd5, roughness: 0.75 })), cyl: cached('c4ObsCyl', () => new THREE.MeshPhysicalMaterial({ color: 0x5f86d8, roughness: 0.35, clearcoat: 0.5 })) };
  const edge = cached('c4ObsEdge', () => new THREE.LineBasicMaterial({ color: 0xe2443a }));
  if (E.show.obstacles) for (const o of E.obstacles) {
    const geo = o.kind === 'cyl' ? new THREE.CylinderGeometry(o.w / 2, o.w / 2, o.h, 40) : rbox(o.w, o.h, o.d, Math.min(4, o.w / 4, o.d / 4));
    const m = new THREE.Mesh(geo, mat[o.kind] || mat.box); m.castShadow = true; m.receiveShadow = true; m.userData = { c4obs: o.id, c4own: true }; C4W.g.add(m); C4W.obsM.set(o.id, m);
    const ol = o.kind === 'cyl' ? Array.from({ length: 41 }, (_, i) => new V3(Math.cos((i / 40) * Math.PI * 2) * o.w / 2, -o.h / 2 + 1, Math.sin((i / 40) * Math.PI * 2) * o.w / 2)) : [[1, 1], [1, -1], [-1, -1], [-1, 1], [1, 1]].map(([a, b]) => new V3((a * o.w) / 2, -o.h / 2 + 1, (b * o.d) / 2));
    const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ol), edge); ln.userData.c4bounds = true; ln.visible = C4H.ov.bounds; m.add(ln);
  }
  if (E.show.light) for (const l of E.lights) {
    const g = new THREE.Group(); g.userData.c4light = l.id; C4W.g.add(g);
    const pm = cached('c4Pole', () => new THREE.MeshStandardMaterial({ color: 0x3a3a42, metalness: 0.6, roughness: 0.4 }));
    const pole = new THREE.Mesh(cached('c4PoleG', () => new THREE.CylinderGeometry(3, 4, 1, 16)), pm); g.add(pole);
    const base = new THREE.Mesh(cached('c4BaseG', () => new THREE.CylinderGeometry(26, 30, 8, 32)), pm); base.position.y = 4; base.castShadow = true; g.add(base);
    const bulb = new THREE.Mesh(cached('c4BulbG', () => new THREE.SphereGeometry(16, 32, 20)), new THREE.MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffdc8a, emissiveIntensity: 1 })); g.add(bulb);
    const glow = new THREE.Mesh(cached('c4GlowG', () => new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2)), new THREE.MeshBasicMaterial({ map: c4wGlow(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffd98a })); glow.position.y = 0.6; glow.userData.noPickC4 = true; g.add(glow);
    C4W.lightM.set(l.id, { g, pole, bulb, glow });
  }
  // overlays: the ultrasonic beam, IR spots, LDR light lines, the trail, motor arrows, the collision outline
  const O = C4W.ov;
  C4W.beamBuf = new Float32Array(8 * 9); C4W.beam = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0x2fb36a, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide })); C4W.beam.geometry.setAttribute('position', new THREE.BufferAttribute(C4W.beamBuf, 3)); O.add(C4W.beam);
  C4W.spots = new THREE.Group(); O.add(C4W.spots);
  C4W.rayBuf = new Float32Array(16 * 6); C4W.rays = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffb02e, transparent: true, opacity: 0.85 })); C4W.rays.geometry.setAttribute('position', new THREE.BufferAttribute(C4W.rayBuf, 3)); O.add(C4W.rays);
  C4W.trail = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x6d5cff, transparent: true, opacity: 0.7 })); O.add(C4W.trail); C4W.trailN = -1;
  C4W.arrows = Object.fromEntries(CAR4_M.map((m) => { const a = new THREE.ArrowHelper(new V3(1, 0, 0), new V3(), 30, 0x2fb36a, 9, 7); O.add(a); return [m, a]; }));
  const D = car4Cfg(car, 'dims'); C4W.bounds = new THREE.Line(new THREE.BufferGeometry().setFromPoints([[1, 1], [1, -1], [-1, -1], [-1, 1], [1, 1]].map(([a, b]) => new V3((a * D.length) / 2, 1.5, (b * D.width) / 2))), new THREE.LineBasicMaterial({ color: 0xe2443a })); O.add(C4W.bounds);
  C4W.ver = E.ver; c4wSync(car);
}
function c4wGlow() { return cached('c4Glow', () => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,240,200,0.9)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }); }
function c4wSync(car) {
  const E = car4Env(car), t = car4Ph(car).t;
  for (const o of E.obstacles) { const m = C4W.obsM.get(o.id); if (!m) continue; const s = car4ObsShape(o, t); m.position.set(s.x, o.h / 2, s.z); m.rotation.y = s.r; }
  for (const l of E.lights) { const L = C4W.lightM.get(l.id); if (!L) continue; const y = l.y || 140, k = l.on ? l.level / 100 : 0, rad = (l.radius || 260) / 260; L.g.position.set(l.x, 0, l.z); L.pole.scale.y = y - 16; L.pole.position.y = (y - 16) / 2; L.bulb.position.y = y; L.bulb.material.emissiveIntensity = 0.15 + 2.6 * k; L.glow.scale.setScalar((80 + 420 * k) * Math.sqrt(rad)); L.glow.material.opacity = 0.85 * k; }
}
function c4wChanged(car, keepHist) { const E = car4Env(car); E.ver++; delete car.state.trk; car4Track(car); c4wBuild(car); save(); c4hRender(); }
// the overlays, once a frame
function c4wOverlays(car) {
  const R = car4SenseAll(car), ph = car4Ph(car), E = car4Env(car); let nb = 0, nr = 0, n = 0;
  C4W.beam.visible = C4W.spots.visible = C4W.rays.visible = C4H.ov.beams;
  for (const x of R) {
    if (!x.w) continue;
    if (x.kind === 'us' && nb === 0) {
      const S = car4Cfg(car, 'sensors'), len = Math.min(x.dist ?? 900, 900), half = (S.usFov / 2) * deg, y = x.w.y;
      for (let k = 0; k < 8; k++) { const a0 = x.w.a - half + (2 * half * k) / 8, a1 = x.w.a - half + (2 * half * (k + 1)) / 8; C4W.beamBuf.set([x.w.x, y, x.w.z, x.w.x + len * Math.cos(a0), y, x.w.z - len * Math.sin(a0), x.w.x + len * Math.cos(a1), y, x.w.z - len * Math.sin(a1)], k * 9); }
      nb = 24; C4W.beam.material.color.setHex(x.dist == null ? 0x2fb36a : x.dist < 150 ? 0xe2443a : x.dist < 300 ? 0xf0a020 : 0x2fb36a);
    }
    if (x.kind === 'line' || x.kind === 'ir') {
      let m = C4W.spots.children[n++]; if (!m) { m = new THREE.Mesh(cached('c4SpotG', () => new THREE.RingGeometry(5, 8, 24).rotateX(-Math.PI / 2)), new THREE.MeshBasicMaterial({ color: 0xff3b6b, transparent: true, depthWrite: false })); C4W.spots.add(m); }
      m.visible = true; m.position.set(x.w.x, x.kind === 'line' ? 0.8 : x.w.y, x.w.z); m.material.color.setHex(x.kind === 'line' ? (x.reflect < 0.5 ? 0x22d07a : 0xff3b6b) : x.dist != null ? 0xff3b6b : 0x22d07a);
      if (x.kind === 'ir' && x.dist != null && nr < 16) { C4W.rayBuf.set([x.w.x, x.w.y, x.w.z, x.w.x + x.dist * x.w.fx, x.w.y, x.w.z + x.dist * x.w.fz], nr * 6); nr++; }
    }
    if (x.kind === 'ldr' && E.show.light) for (const l of E.lights) if (l.on && nr < 16) { C4W.rayBuf.set([x.w.x, x.w.y, x.w.z, l.x, l.y || 140, l.z], nr * 6); nr++; }
  }
  for (let i = n; i < C4W.spots.children.length; i++) C4W.spots.children[i].visible = false;
  C4W.beam.geometry.setDrawRange(0, nb); C4W.beam.geometry.attributes.position.needsUpdate = true; C4W.beam.geometry.computeBoundingSphere();
  C4W.rays.geometry.setDrawRange(0, nr * 2); C4W.rays.geometry.attributes.position.needsUpdate = true; C4W.rays.geometry.computeBoundingSphere();
  C4W.trail.visible = C4H.ov.trail && ph.trail.length > 1;
  if (C4W.trail.visible && ph.trail.length !== C4W.trailN) { C4W.trailN = ph.trail.length; const tp = new Float32Array((ph.trail.length + 1) * 3); ph.trail.forEach(([x, z], i) => tp.set([x, 1.2, z], i * 3)); tp.set([ph.x, 1.2, ph.z], ph.trail.length * 3); C4W.trail.geometry.setAttribute('position', new THREE.BufferAttribute(tp, 3)); C4W.trail.geometry.computeBoundingSphere(); }
  const cs = Math.cos(ph.th), sn = Math.sin(ph.th), D = car4Cfg(car, 'dims');
  for (const m of CAR4_M) {
    const a = C4W.arrows[m], w = car4WheelAt(m, D), rpm = (ph.w[m] * 30) / Math.PI, on = C4H.ov.motors && Math.abs(rpm) > 2; a.visible = on; if (!on) continue;
    const oz = w.z + car4Side(m) * 30, wx = ph.x + w.x * cs + oz * sn, wz = ph.z - w.x * sn + oz * cs;
    a.position.set(wx, D.wheelD + 14, wz); a.setDirection(new V3(Math.sign(rpm) * cs, 0, -Math.sign(rpm) * sn)); a.setLength(14 + Math.min(46, Math.abs(rpm) * 0.35), 9, 7); a.setColor(rpm > 0 ? 0x22b06a : 0xf08a20);
  }
  C4W.bounds.visible = !!C4H.ov.bounds; C4W.bounds.position.set(ph.x, 0, ph.z); C4W.bounds.rotation.y = ph.th;
  for (const m of C4W.obsM.values()) for (const ch of m.children) if (ch.userData.c4bounds) ch.visible = !!C4H.ov.bounds;
  if (car.spin) for (const m of CAR4_M) if (car.spin[m]) car.spin[m].visible = C4H.ov.wheels;
  // the robot's wires (Wiring overlay)
  if (car.harnG && car.harnG.visible !== C4H.ov.wiring) car.harnG.visible = C4H.ov.wiring; if (C4_TETH.visible !== C4H.ov.wiring) C4_TETH.visible = C4H.ov.wiring;   // the robot's harness (its wires' lab arcs stay hidden)
}
// readings over the sensors and wheels (Sensor values overlay): small labels in the stage that follow the 3D points
function c4wLabels(car) {
  const list = [], ph = car4Ph(car);
  if (C4H.ov.values && C4H.shown) {
    const dup = typeof labelsOn !== 'undefined' && labelsOn && run.state === 'running';   // the lab's own value tags already show the sensors then
    if (!dup) for (const x of car4SenseAll(car)) { if (!x.w) continue; list.push([new V3(x.w.x, (x.w.y || 0) + 32, x.w.z), x.kind === 'us' ? (x.dist != null ? `${c4n(x.dist / 10, 1)} cm` : 'no echo') : x.kind === 'ldr' ? `light ${c4n(x.light)}` : x.kind === 'line' ? (x.reflect < 0.5 ? 'black' : 'white') : x.dist != null ? 'object' : 'clear']); }
    const cs = Math.cos(ph.th), sn = Math.sin(ph.th), D = car4Cfg(car, 'dims');
    for (const m of CAR4_M) { const w = car4WheelAt(m, D), oz = w.z + car4Side(m) * 36; list.push([new V3(ph.x + w.x * cs + oz * sn, D.wheelD + 34, ph.z - w.x * sn + oz * cs), `${m} ${c4n((ph.w[m] * 30) / Math.PI)} rpm`]); }
  }
  while (C4H.labels.length < list.length) { const d = document.createElement('div'); d.className = 'c4h-lab'; stage.appendChild(d); C4H.labels.push(d); }
  C4H.labels.forEach((d, i) => { const it = list[i]; if (!it) { d.hidden = true; return; } const vis = toScreen(it[0], d); d.hidden = !vis; if (vis && d.textContent !== it[1]) d.textContent = it[1]; });
}

// ---- 8b. manual driving: one command interface (left/right, or each motor) into the car's motor model, through the driver ----
const C4H_MODES = [['program', 'Program', '▶'], ['manual', 'Joystick', '🕹️'], ['keys', 'Keyboard', '⌨️'], ['remote', 'Bluetooth', '📶'], ['voice', 'Voice', '🎤']];
const C4H_AUTO = [['light', '💡', 'Light'], ['obstacle', '📡', 'Obstacle'], ['line', '➰', 'Line']];
// the joystick project in program mode: the on-screen joystick moves the joystick MODULE's lever, and the program reads it
function c4hModule(car) { const pr = car && c4pOf(car); if (!pr || pr.proj !== 'joystick' || car.props.src === 'manual' || (car.props.mode || 'program') !== 'program') return null; return [...comps.values()].find((o) => o.type === 'joystick') || null; }
function c4hMode(car, m) {
  if (!car) return; const pr = c4pOf(car), was = car.props.mode || 'program';
  if (m === 'light' || m === 'obstacle' || m === 'line') { const ctrl = pr ? pr.ctrl : 'arduino', drv = pr ? pr.drv : undefined; const nc = c4pLoad(ctrl, m, drv); nc.props.mode = 'program'; nc.props.src = 'circuit'; c4hStopManual(nc); save(); c4hRender(); toast(`${C4P_PROJ[m].name}: press Start (or the panel's Start) to run its program.`); return; }
  if (m === 'manual' || m === 'keys' || m === 'voice') { if (run.state !== 'stopped') stopProgram(); car.props.src = 'manual'; car.state.manBy = m === 'keys' ? 'keyboard' : m === 'voice' ? 'voice' : 'joystick'; }
  else { c4hStopManual(car); car.props.src = 'circuit'; if (m !== 'voice' && C4H.voice) c4hVoice(false); }
  if (m !== 'voice' && C4H.voice && m !== 'remote') c4hVoice(false);
  car.props.mode = m; c4hStopManual(car, m === 'manual' || m === 'keys' || m === 'voice'); dirty = true; save(); c4hRender();
  if (was !== m) toast(m === 'program' ? 'Program control: the program drives the motors (press Start).' : m === 'remote' ? 'Bluetooth remote (virtual): the joystick sends commands to your running program.' : 'Manual control: the joystick, the keys and the buttons drive the motors.');
}
function c4hStopManual(car, keepSrc) { C4H.joy = { x: 0, y: 0, on: false }; C4H.keys.clear(); C4H.btn = null; C4H.voiceCmd = null; car.state.man = { L: 0, R: 0 }; car.state.manCur = { L: 0, R: 0 }; if (!keepSrc && car.props.src === 'manual') car.props.src = 'circuit'; c4hKnob(); }
function c4hTarget(car) {   // where the inputs point: left/right from -1 to 1 (before ramps and limits)
  const D = c4hDrive(car), J = C4H.joy, r = Math.hypot(J.x, J.y), dz = D.dead / 100; let x = 0, y = 0, by = '';
  if (J.on && r > dz) { const k = (r - dz) / (1 - dz) / r; x = J.x * k; y = J.y * k; by = 'joystick'; }
  else if (C4H.keys.size) { y = (C4H.keys.has('w') ? 1 : 0) - (C4H.keys.has('s') ? 1 : 0); x = (C4H.keys.has('d') ? 1 : 0) - (C4H.keys.has('a') ? 1 : 0); by = 'keyboard'; }
  else if (C4H.btn) { [x, y] = { F: [0, 1], B: [0, -1], L: [-1, 0], R: [1, 0] }[C4H.btn] || [0, 0]; by = 'buttons'; }
  else if (C4H.voiceCmd) { [x, y] = { F: [0, 1], B: [0, -1], L: [-1, 0.35], R: [1, 0.35], S: [0, 0] }[C4H.voiceCmd] || [0, 0]; by = 'voice'; }
  const t = D.turn / 100; let L = y + x * t, R = y - x * t; const mx = Math.max(1, Math.abs(L), Math.abs(R)); L /= mx; R /= mx;
  return { L, R, x, y, by };
}
function c4hManualTick(car, dt) {
  const D = c4hDrive(car), tg = c4hTarget(car), cur = car.state.manCur || (car.state.manCur = { L: 0, R: 0 }), sc = D.maxSpeed / 100, mn = D.minSpeed / 100;
  const want = (v) => (Math.abs(v) < 0.02 ? 0 : Math.sign(v) * Math.max(mn, Math.abs(v) * sc));
  let L = want(tg.L), R = want(tg.R), warn = '';
  // safety: an obstacle closer than the set distance stops forward motion (turning and reversing still work)
  let block = false;
  if (D.safety) {
    const us = car4SenseAll(car).find((x) => x.kind === 'us'), v = Math.max(0, car4Ph(car).v * 1000), look = D.safetyCm * 10 + v * 0.12;   // what it covers while it stops
    if (us && us.dist != null && us.dist < look) { const f = (L + R) / 2; if (f > 0) { L -= f; R -= f; block = true; } warn = `Obstacle ${c4n(us.dist / 10, 1)} cm ahead: forward blocked (safety override). Reverse or turn away.`; }
  }
  const step = (c, t) => { const rate = (Math.abs(t) > Math.abs(c) && Math.sign(t) === Math.sign(c || t) ? D.accel : D.decel) / 100; return c + clamp(t - c, -rate * dt, rate * dt); };
  if (block) { const fc = (cur.L + cur.R) / 2; if (fc > 0) { cur.L -= fc; cur.R -= fc; } }
  cur.L = step(cur.L, L); cur.R = step(cur.R, R);
  const man = { L: cur.L, R: cur.R };
  if (D.individual && !car4Driver(car).paired) for (const m of CAR4_M) { const v = (car.props.drive && car.props.drive.motors && car.props.drive.motors[m]) || 0; if (v) man[m] = (v / 100) * sc; }
  car.state.man = man; car.state.manBy = tg.by || car.state.manBy; C4H.warn = warn;
}
// the virtual Bluetooth remote: the joystick's direction becomes a letter sent to the running program (as a phone app would)
function c4hRemoteTick(car) {
  const tg = c4hTarget(car); let k = 'S'; const f = (tg.L + tg.R) / 2, turn = tg.L - tg.R;
  if (Math.abs(f) > 0.15 || Math.abs(turn) > 0.15) k = Math.abs(f) >= Math.abs(turn) / 2 ? (f > 0 ? 'F' : 'B') : turn > 0 ? 'R' : 'L';
  if (C4H.voiceCmd) k = C4H.voiceCmd;
  if (k !== C4H.lastCmd && run.state === 'running') { c4pSend(k); C4H.lastCmd = k; C4H.rlog = [`${new Date().toLocaleTimeString()} sent ${k}`, ...(C4H.rlog || [])].slice(0, 6); }
}
// voice: the browser's speech recognition, when it is there and allowed
function c4hVoice(on) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!on) { if (C4H.voice) { try { C4H.voice.onend = null; C4H.voice.stop(); } catch { /* fine */ } } C4H.voice = null; C4H.voiceState = 'off'; c4hRender(); return; }
  if (!SR) { C4H.voiceState = 'unsupported'; c4hRender(); return; }
  const r = new SR(); r.lang = 'en-US'; r.continuous = true; r.interimResults = false;
  r.onresult = (e) => { const t = e.results[e.results.length - 1][0].transcript.toLowerCase().trim(); C4H.heard = t;
    const k = /\bstop|halt|brake\b/.test(t) ? 'S' : /\b(back|backward|backwards|reverse)\b/.test(t) ? 'B' : /\bleft\b/.test(t) ? 'L' : /\bright\b/.test(t) ? 'R' : /\b(forward|ahead|go|move)\b/.test(t) ? 'F' : null;
    if (k) { C4H.voiceCmd = k === 'S' ? null : k; C4H.voiceDone = k === 'S' ? 'stopped' : `doing “${t}”`; const car = c4hCar(); if (car && (car.props.mode || 'program') === 'remote') { c4pSend(k); C4H.lastCmd = k; } } else C4H.voiceDone = `not a command: “${t}”`; c4hRender(); };
  r.onerror = (e) => { C4H.voiceState = e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'denied' : 'error: ' + e.error; C4H.voice = null; c4hRender(); };
  r.onend = () => { if (C4H.voice === r) { try { r.start(); } catch { /* ended for good */ } } };
  try { r.start(); C4H.voice = r; C4H.voiceState = 'listening'; } catch (err) { C4H.voiceState = 'error: ' + (err.message || err); }
  c4hRender();
}

// ---- 8c. the panel inside the stage ----
function c4hEnsure() {
  if (C4H.el) return C4H.el;
  const el = C4H.el = document.createElement('div'); el.className = 'c4h'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', '4WD robot panel'); el.hidden = true; stage.appendChild(el);
  for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'wheel', 'dblclick', 'contextmenu']) el.addEventListener(ev, (e) => e.stopPropagation());
  el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && el.contains(b)) c4hClick(b, e); });
  el.addEventListener('input', (e) => c4hInput(e.target, false)); el.addEventListener('change', (e) => c4hInput(e.target, true));
  const hold = (node, on, off) => { try { node.setPointerCapture(C4H.pid); } catch { /* fine */ } on(); const up = () => { off(); node.removeEventListener('pointerup', up); node.removeEventListener('pointercancel', up); }; node.addEventListener('pointerup', up); node.addEventListener('pointercancel', up); };
  el.addEventListener('pointerdown', (e) => {
    let base = e.target.closest('.c4h-base'), pb = !base && e.target.closest('[data-hold]'); const sw = !base && !pb && e.target.closest('[data-sw]');
    if (!base && !pb && !sw) return; const car = c4hCar(); if (!car) return; C4H.pid = e.pointerId;
    const mod = c4hModule(car);
    if (sw) { if (mod) hold(sw, () => { pressComp(mod, true); sw.classList.add('on'); }, () => { pressComp(mod, false); sw.classList.remove('on'); }); return; }
    if (mod) { if (run.state === 'stopped') { c4pRun(true); toast('Started the program: it reads the joystick module.'); } }
    else if (!['manual', 'keys', 'voice', 'remote'].includes(car.props.mode || 'program')) { const k = pb && pb.dataset.hold; c4hMode(car, 'manual'); base = base && el.querySelector('.c4h-base'); pb = k && el.querySelector(`[data-hold="${k}"]`); if (!base && !pb) return; }
    if (pb) { const k = pb.dataset.hold; hold(pb, () => { C4H.btn = k; pb.classList.add('on'); }, () => { C4H.btn = null; pb.classList.remove('on'); }); return; }
    try { base.setPointerCapture(e.pointerId); } catch { /* fine */ } const rect = base.getBoundingClientRect(); base.classList.add('act');
    const move = (ev) => { const R = rect.width / 2 - 27, dx = ev.clientX - (rect.left + rect.width / 2), dy = ev.clientY - (rect.top + rect.height / 2), d = Math.hypot(dx, dy), k = d > R ? R / d : 1; C4H.joy = { x: (dx * k) / R, y: (-dy * k) / R, on: true }; c4hKnob(); };
    const up = () => { C4H.joy = { x: 0, y: 0, on: false }; c4hKnob(); base.classList.remove('act'); base.removeEventListener('pointermove', move); base.removeEventListener('pointerup', up); base.removeEventListener('pointercancel', up); };
    move(e); base.addEventListener('pointermove', move); base.addEventListener('pointerup', up); base.addEventListener('pointercancel', up);
  });
  return el;
}
function c4hKnob() {
  const el = C4H.el; if (!el) return; const k = el.querySelector('.c4h-knob'), v = el.querySelector('.c4h-vec'); if (!k) return;
  const R = 49, x = C4H.joy.x * R, y = -C4H.joy.y * R; k.style.transform = `translate(${x}px, ${y}px)`;
  if (v) { const len = Math.hypot(x, y); v.style.width = `${len}px`; v.style.transform = `rotate(${Math.atan2(y, x)}rad)`; }
}
function c4hShow(on) { const el = c4hEnsure(), car = c4hCar(); C4H.shown = on && !!car; el.hidden = !C4H.shown; if (C4H.shown) c4hRender(); }
function c4hProject(car) { c4wBuild(car); c4hShow(true); c4hView('table'); }
function c4hudShow(on) { c4hShow(on); }          // called from the car's own panel button
function c4hudProject(car) { c4hProject(car); }  // called when a project (or a saved version) is loaded
function c4hRender() {
  const el = c4hEnsure(), car = c4hCar(); if (!car || el.hidden) return;
  const pr = c4pOf(car), mode = car.props.mode || 'program', D = c4hDrive(car), E = car4Env(car), drv = car4Driver(car), tab = C4H.tab, mod = c4hModule(car), PJ = pr ? C4P_PROJ[pr.proj] : null;
  const chip = mod ? ['mod', 'Joystick module'] : mode === 'remote' ? ['rem', 'Bluetooth'] : ['manual', 'keys', 'voice'].includes(mode) ? ['man', 'Manual'] : ['prog', 'Program'];
  const f = (label, input) => `<div class="c4h-f"><label>${label}</label>${input}</div>`, num = (attr, v, min, max, step) => `<input type="number" ${attr} value="${v}" min="${min}" max="${max}" step="${step}">`;
  const sub = pr ? `${C4P_CTRL[pr.ctrl].name} · ${C4P_DRV[pr.drv].short}` : 'Pick a project on the Project tab';
  let h = `<div class="c4h-top"><span class="c4h-logo" aria-hidden="true">${PJ ? PJ.icon : '🚗'}</span><div class="c4h-title"><b>${PJ ? esc(PJ.name) : '4WD Robot'}</b><small>${esc(sub)}</small></div><span class="c4h-chip ${chip[0]}" title="Who drives the motors now">${chip[1]}</span><button type="button" class="x" data-c="min" title="${C4H.min ? 'Expand' : 'Collapse'}" aria-label="${C4H.min ? 'Expand' : 'Collapse'} the robot panel" aria-expanded="${!C4H.min}">${C4H.min ? '▴' : '▾'}</button><button type="button" class="x" data-c="hide" title="Hide (the 4WD Robot button brings it back)" aria-label="Hide the robot panel">✕</button></div><div class="c4h-body">`;
  h += `<div class="c4h-stat" data-live="stat" aria-live="off"></div>`;
  h += `<div class="c4h-tabs" role="tablist">${[['drive', '🕹️ Drive'], ['project', '🧩 Project'], ['table', '🗺️ Table'], ['view', '🎥 View']].map(([k, t]) => `<button type="button" role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" data-tab="${k}">${t}</button>`).join('')}</div>`;
  if (tab === 'drive') {
    const hasUS = car4Mounted(car).some((x) => x.type === 'ultrasonic');
    h += `<div class="c4h-seg tall" role="radiogroup" aria-label="Who drives the robot">${C4H_MODES.map(([k, t, ic]) => `<button type="button" role="radio" aria-checked="${mode === k}" class="${mode === k ? 'on' : ''}" data-mode="${k}" title="${t}"><span aria-hidden="true">${ic}</span>${t}</button>`).join('')}</div>`;
    h += `<div class="c4h-auto"><span>Autonomous:</span>${C4H_AUTO.map(([k, ic, t]) => `<button type="button" data-mode="${k}" title="Load the ${t} project and its program">${ic} ${t}</button>`).join('')}</div>`;
    if (mode === 'program') {
      h += `<div class="c4h-row"><button type="button" class="b big ${run.state === 'stopped' ? 'go' : 'stop'}" data-c="run">${run.state === 'stopped' ? '▶ Start the program' : '■ Stop the program'}</button></div>`;
      if (pr && pr.proj === 'basic' && pr.ctrl === 'rbsbit') h += `<div class="c4h-row"><button type="button" class="b" data-c="pressA">Press A (next move)</button><button type="button" class="b" data-c="pressB">Press B (stop / demo)</button></div>`;
      else if (pr && pr.proj === 'basic') h += `<p class="c4h-note">Commands to the program (Serial):</p><div class="c4h-row">${[['F', '▲'], ['B', '▼'], ['L', '◀'], ['R', '▶'], ['A', '↺'], ['C', '↻'], ['S', '■'], ['D', 'Demo']].map(([k, t]) => `<button type="button" class="b" data-cmd="${k}" title="${k}">${t}</button>`).join('')}</div>`;
      if (mod) h += `<div class="c4h-hint"><span aria-hidden="true">🕹️</span><span>The joystick below moves the <b>joystick module</b> on the table. Your program reads VRx, VRy and SW and drives the motors, as on the real robot.</span></div>`;
      else h += `<p class="c4h-note">${PJ ? esc(PJ.expected) : 'Load a project on the Project tab: its program drives the motors.'}</p>`;
    }
    const tick = [[0, 1, '▲'], [1, 0, '▶'], [0, -1, '▼'], [-1, 0, '◀'], [0.71, 0.71, '●'], [0.71, -0.71, '●'], [-0.71, -0.71, '●'], [-0.71, 0.71, '●']].map(([x, y, t]) => `<span class="ar${t === '●' ? ' d' : ''}" style="left:${76 + x * 64}px;top:${76 - y * 64}px">${t}</span>`).join('');
    const dz = Math.max(10, 6 + D.dead * 1.9);
    h += `<div class="c4h-drive"><div class="c4h-base" role="application" aria-label="Joystick: drag the knob to drive, let go to stop">${tick}<span class="ring"></span><span class="dz" style="width:${dz}px;height:${dz}px"></span><span class="c4h-vec"></span><div class="c4h-knob"></div></div>
      <div class="c4h-side"><div class="c4h-pad"><span></span><button type="button" data-hold="F" aria-label="Forward">▲</button><span></span><button type="button" data-hold="L" aria-label="Left">◀</button><button type="button" class="stopb" data-c="stop" aria-label="Stop">STOP</button><button type="button" data-hold="R" aria-label="Right">▶</button><span></span><button type="button" data-hold="B" aria-label="Backward">▼</button><span></span></div>
      ${mod ? '<button type="button" class="c4h-swb" data-sw="1" aria-label="Press the joystick stick (SW)">⏺ Press stick (SW)</button>' : ''}</div></div>`;
    if (!mod) h += `<div class="c4h-speed"><label for="c4h-spd">Speed</label><input id="c4h-spd" type="range" min="10" max="100" step="1" value="${D.maxSpeed}" data-k="maxSpeed" aria-label="Maximum speed (%)"><output>${D.maxSpeed}%</output></div>`;
    h += `<p class="c4h-note">${mod ? 'W A S D push the stick too. The top speed is the program’s MAX_SPEED (Project tab); Space stops the program.' : mode === 'program' ? 'Touch the joystick or the arrows, or press W A S D, to drive by hand: the program stops and the motors are yours.' : 'Keys: W forward, S back, A left, D right, Space stop (not while you type in the code).'}</p>`;
    if (mode === 'remote') h += `<div class="c4h-src">${pr && pr.ctrl !== 'rbsbit' && pr.proj === 'basic' ? `Virtual Bluetooth link to the program’s Serial input: ${run.state === 'running' ? '<b>connected</b>' : 'press Start to connect'}. The program receives F B L R S. ${(C4H.rlog || []).map((x) => `<br>${esc(x)}`).join('')}` : pr && pr.ctrl === 'rbsbit' ? 'The RBS bit’s blocks in the lab cannot read a serial or Bluetooth stream: use Manual, or the A/B buttons of its Basic program.' : 'Load the Basic 4WD Movement project for the Arduino or the ESP32: its program reads these commands.'}</div>`;
    if (mode === 'voice') { const st = C4H.voiceState || 'off'; h += `<div class="c4h-row"><button type="button" class="b${C4H.voice ? ' stop' : ' go'}" data-c="voice">${C4H.voice ? '■ Stop listening' : '🎤 Listen'}</button><span class="c4h-note">${st === 'unsupported' ? 'Speech recognition is not available in this browser (use Chrome or Edge on its own page).' : st === 'denied' ? 'The microphone is blocked here (inside claude.ai it usually is): open the lab on its own page.' : st === 'listening' ? 'Listening… say forward, back, left, right or stop.' : st.startsWith('error') ? esc(st) : 'Commands: forward, back, left, right, stop.'}</span></div>${C4H.heard ? `<p class="c4h-note">Heard: “${esc(C4H.heard)}” → ${esc(C4H.voiceDone || '')}</p>` : ''}`; }
    h += `<div class="c4h-dash"><div class="c4h-car" role="img" aria-label="The four wheels: green forward, orange backward">${['fl', 'fr', 'rl', 'rr'].map((k) => `<div class="w ${k}"><i data-w="${k.toUpperCase()}"></i></div><span class="n ${k}" data-n="${k.toUpperCase()}">0</span>`).join('')}<div class="body"></div></div><div class="c4h-kv" data-live="kv"></div></div>`;
    h += `<details><summary>⚙️ Driving settings</summary>${[['minSpeed', 'Minimum speed (%)', 0, 80, 1], ['dead', 'Dead zone (%)', 0, 40, 1], ['accel', 'Acceleration (%/s)', 20, 1000, 10], ['decel', 'Deceleration (%/s)', 20, 2000, 10], ['turn', 'Turning sensitivity (%)', 10, 100, 1], ['safetyCm', 'Safety stop distance (cm)', 3, 60, 1]].map(([k, t, a, b, s]) => f(t, num(`data-k="${k}"`, D[k], a, b, s))).join('')}
      ${f('Safety override (ultrasonic)', `<input type="checkbox" data-k="safety"${D.safety ? ' checked' : ''}>`)}${D.safety && !hasUS ? '<p class="c4h-note">No ultrasonic on this robot, so nothing can stop it before an obstacle (load the Obstacle avoidance project for one).</p>' : ''}${f('Each motor on its own', `<input type="checkbox" data-k="individual"${D.individual ? ' checked' : ''}${drv.paired ? ' disabled' : ''}>`)}
      ${drv.paired ? `<p class="c4h-note">The ${esc(drv.name)} has two channels: the left motors share one, the right motors the other, so they cannot be driven one by one.</p>` : D.individual ? CAR4_M.map((m) => f(`${CAR4_MN[m]} (%)`, `<input type="range" min="-100" max="100" step="1" value="${(car.props.drive && car.props.drive.motors && car.props.drive.motors[m]) || 0}" data-motor="${m}" aria-label="${CAR4_MN[m]} motor">`)).join('') : ''}</details>`;
    h += `<div data-live="warn"></div>`;
    h += `<div class="c4h-row"><button type="button" class="b" data-c="reset">↺ Reset robot</button><button type="button" class="b warn" data-c="estop">⛔ Emergency stop</button></div>`;
  }
  if (tab === 'project') {
    const ctrl = pr ? pr.ctrl : (C4H.pickCtrl || 'arduino'), proj = pr ? pr.proj : null, drvs = C4P_CTRL[ctrl].drivers;
    h += `<div class="c4h-lbl" id="c4h-l-ctrl">Controller</div><div class="c4h-seg" role="radiogroup" aria-labelledby="c4h-l-ctrl">${Object.entries(C4P_CTRL).map(([k, x]) => `<button type="button" role="radio" aria-checked="${ctrl === k}" class="${ctrl === k ? 'on' : ''}" data-pick-ctrl="${k}" title="${esc(x.full)}">${esc(x.name.replace(' (micro:bit V2)', ''))}</button>`).join('')}</div>`;
    if (drvs.length > 1) h += `<div class="c4h-lbl" id="c4h-l-drv">Motor driver</div><div class="c4h-seg" role="radiogroup" aria-labelledby="c4h-l-drv">${drvs.map((k) => `<button type="button" role="radio" aria-checked="${!!pr && pr.drv === k}" class="${pr && pr.drv === k ? 'on' : ''}" data-pick-drv="${k}" title="${esc(C4P_DRV[k].name)}">${esc(C4P_DRV[k].short)} · ${C4P_DRV[k].channels} ch</button>`).join('')}</div>`;
    else h += `<p class="c4h-note">Motor driver: <b>${esc(C4P_DRV[drvs[0]].name)}</b></p>`;
    h += `<div class="c4h-lbl">Project</div><div class="c4h-cards">${Object.entries(C4P_PROJ).map(([k, x]) => `<button type="button" class="${proj === k ? 'on' : ''}" data-pick-proj="${k}" aria-pressed="${proj === k}"><span class="ic" aria-hidden="true">${x.icon}</span><span><b>${esc(x.name)}</b><small>${esc(x.level)} · ${x.mins} min</small></span></button>`).join('')}</div>`;
    if (pr) {
      const J = C4P_PROJ[pr.proj], P = pr.params, row = (k) => { const p = C4P_PARAMS[pr.proj].find((q) => q.k === k); if (!p || (p.only && !p.only.includes(pr.ctrl))) return ''; if (p.type === 'choice') return `<div class="c4h-pp" title="${esc(p.tip)}"><label>${esc(p.label)}</label><select data-pp="${p.k}">${p.choices.map(([v, t]) => `<option value="${v}"${Number(P[k]) === v ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`; return `<div class="c4h-pp" title="${esc(p.tip)}"><label>${esc(p.label)}</label><input type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${P[k]}" data-pp="${p.k}" aria-label="${esc(p.label)}"><input type="number" min="${p.min}" max="${p.max}" step="${p.step}" value="${P[k]}" data-pp="${p.k}" aria-label="${esc(p.label)}"></div>`; };
      h += `<div class="c4h-row"><button type="button" class="b big ${run.state === 'stopped' ? 'go' : 'stop'}" data-c="run">${run.state === 'stopped' ? '▶ Start' : '■ Stop'}</button><button type="button" class="b" data-c="reset" title="Put the robot back where it stands">↺ Robot</button><button type="button" class="b" data-c="resetproj" title="Build the project again with its default settings">⟲ Project</button></div>`;
      const li = (list) => `<ul>${list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
      h += `<div class="c4h-about"><p>${esc(J.what)}</p><details><summary>How it works · what you learn</summary><p class="c4h-note">${esc(J.how)}</p><b class="h">You will learn to</b>${li(J.objectives)}<b class="h">What you should see</b><p class="c4h-note">${esc(J.expected)}</p><b class="h">If it goes wrong</b>${li(J.mistakes)}<b class="h">Challenges</b>${li(J.challenges)}</details></div>`;
      h += `<h4>Settings · the program’s constants</h4>${C4P_PARAMS[pr.proj].map((p) => row(p.k)).join('')}<p class="c4h-note">The program is in the code editor (${esc(C4P_CTRL[pr.ctrl].lang)}): a setting rewrites its constant, and a running program restarts.</p>`;
      if (pr.proj === 'light') { const l = E.lights[0]; h += `<h4>Light and LDRs</h4>${l ? `${f('Lamp on', `<input type="checkbox" data-light="${l.id}" data-f="on"${l.on ? ' checked' : ''}>`)}${f('Intensity (%)', `<input type="range" min="0" max="100" step="1" value="${l.level}" data-light="${l.id}" data-f="level" aria-label="Intensity">`)}${f('Radius (mm)', num(`data-light="${l.id}" data-f="radius"`, l.radius || 260, 60, 1500, 10))}<p class="c4h-note">Drag the lamp on the table to move it.</p>` : ''}${car4Mounted(car).filter((x) => x.type === 'ldra' || x.type === 'ldr').map((se) => f(`${se.props.carMount === 'ldrL' ? 'Left' : 'Right'} LDR sensitivity (%)`, num(`data-ssens="${se.id}"`, se.props.sens ?? 100, 5, 300, 5))).join('')}${f('Room light', `<input type="range" min="0" max="30" step="1" value="${E.ambient}" data-env="ambient" aria-label="Room light">`)}`; }
      if (pr.proj === 'obstacle') { const S = car4Cfg(car, 'sensors'); h += `<h4>Ultrasonic</h4>${f('Detection range (mm)', num('data-cfg="sensors.usMax"', S.usMax, 200, 6000, 100))}${f('Field of view (°)', num('data-cfg="sensors.usFov"', S.usFov, 2, 40, 1))}<p class="c4h-note">Add or drag obstacles on the Table tab.</p>`; }
      if (pr.proj === 'line') { const S = car4Cfg(car, 'sensors'); h += `<h4>Track and sensors</h4>${f('Track width (mm)', num('data-env="lineW"', E.lineW, 5, 60, 1))}${f('Sensor spacing (mm)', num('data-cfg="sensors.lineSpacing"', S.lineSpacing, 6, 45, 1))}${f('Sensor height (mm)', num('data-cfg="sensors.lineHeight"', S.lineHeight, 3, 30, 1))}`; }
      const ck = [...c4pChecks(car), ...car4Checks(car)], nb = ck.filter((k) => k.level === 'bad').length, nw = ck.filter((k) => k.level === 'warn').length;
      h += `<details${nb ? ' open' : ''}><summary>✅ Hardware checks <span class="cnt">${nb ? `${nb} to fix` : nw ? `${nw} note${nw > 1 ? 's' : ''}` : 'all OK'}</span></summary><ul class="c4h-ck">${ck.map((k) => `<li class="${k.level}"><i></i><b>${esc(k.title)}</b><span>${esc(k.text)}</span></li>`).join('')}</ul></details>`;
      const wl = pr.wiring || [], wok = wl.filter((w) => w.ok).length;
      h += `<details><summary>🔌 Wiring <span class="cnt">${wok}/${wl.length} connected</span></summary><div class="c4h-note">${wl.map((w) => `${w.ok ? '✓' : '✗'} ${esc(w.from)} → ${esc(w.to)}`).join('<br>')}</div></details>`;
    }
    h += `<details><summary>🧰 Hardware and compatibility</summary>${c4hCompat()}</details>`;
  }
  if (tab === 'table') {
    const s = C4H.sel;
    h += `<div class="c4h-lbl">Show</div><div class="c4h-chips">${[['track', '➰ Line track'], ['light', '💡 Light'], ['obstacles', '📦 Obstacles']].map(([k, t]) => `<button type="button" class="${E.show[k] ? 'on' : ''}" data-show="${k}" aria-pressed="${!!E.show[k]}">${t}</button>`).join('')}</div>`;
    h += `<div class="c4h-lbl">Tool</div><div class="c4h-seg">${[['select', '✋ Select / move'], ['draw', '✏️ Draw line']].map(([k, t]) => `<button type="button" class="${C4H.tool === k ? 'on' : ''}" data-tool="${k}" aria-pressed="${C4H.tool === k}">${t}</button>`).join('')}</div>`;
    h += `<div class="c4h-lbl">Add</div><div class="c4h-chips">${[['box', '📦 Box'], ['cyl', '🛢️ Cylinder'], ['wall', '🧱 Wall'], ['light', '💡 Lamp']].map(([k, t]) => `<button type="button" data-add="${k}">${t}</button>`).join('')}</div>`;
    h += f('Track shape', `<select class="w" data-env="shape">${[['oval', 'Oval'], ['circle', 'Circle'], ['s', 'S-curve'], ['junctions', 'Junctions and a crossing'], ['custom', 'My drawing']].map(([k, t]) => `<option value="${k}"${(E.shape || 'oval') === k ? ' selected' : ''}>${t}</option>`).join('')}</select>`);
    h += f('Line width (mm)', num('data-env="lineW"', E.lineW, 5, 60, 1)) + f('Line colour', `<input type="color" value="${esc(E.lineColor)}" data-env="lineColor">`) + f('Room light', `<input type="range" min="0" max="30" step="1" value="${E.ambient}" data-env="ambient" aria-label="Room light">`);
    h += `<div class="c4h-row"><button type="button" class="b" data-c="resetTable">⟲ Reset table</button><button type="button" class="b" data-c="clearLines">Clear lines</button><button type="button" class="b" data-c="clearObs">Clear obstacles</button><button type="button" class="b" data-c="clearLights">Clear lights</button></div>`;
    if (s && s.kind === 'obs') { const o = E.obstacles.find((q) => q.id === s.id); if (o) { const a = `data-obs="${o.id}"`; h += `<h4>Selected: ${o.kind === 'cyl' ? 'cylinder' : o.kind}</h4>${f('Type', `<select ${a} data-f="kind">${['box', 'cyl', 'wall'].map((k) => `<option value="${k}"${o.kind === k ? ' selected' : ''}>${k === 'cyl' ? 'cylinder' : k}</option>`).join('')}</select>`)}${f(o.kind === 'cyl' ? 'Diameter (mm)' : 'Width (mm)', num(`${a} data-f="w"`, o.w, 10, 600, 5))}${o.kind === 'cyl' ? '' : f('Depth (mm)', num(`${a} data-f="d"`, o.d, 10, 600, 5))}${f('Height (mm)', num(`${a} data-f="h"`, o.h, 10, 400, 5))}${f('X (mm)', num(`${a} data-f="x"`, o.x, -PLANE.w / 2, PLANE.w / 2, 10))}${f('Y (mm)', num(`${a} data-f="z"`, o.z, -PLANE.d / 2, PLANE.d / 2, 10))}${f('Rotation (°)', num(`${a} data-f="rot"`, o.rot || 0, -180, 180, 5))}${f('Moves (mm)', num(`${a} data-f="amp"`, o.amp || 0, 0, 400, 10))}<div class="c4h-row"><button type="button" class="b" data-c="dup">Duplicate</button><button type="button" class="b" data-c="del">Delete</button></div>`; } }
    if (s && s.kind === 'light') { const l = E.lights.find((q) => q.id === s.id); if (l) { const a = `data-light="${l.id}"`; h += `<h4>Selected: lamp</h4>${f('On', `<input type="checkbox" ${a} data-f="on"${l.on ? ' checked' : ''}>`)}${f('Intensity (%)', `<input type="range" min="0" max="100" step="1" value="${l.level}" ${a} data-f="level" aria-label="Intensity">`)}${f('X (mm)', num(`${a} data-f="x"`, l.x, -PLANE.w / 2, PLANE.w / 2, 10))}${f('Y (mm)', num(`${a} data-f="z"`, l.z, -PLANE.d / 2, PLANE.d / 2, 10))}${f('Height (mm)', num(`${a} data-f="y"`, l.y || 140, 40, 600, 10))}${f('Radius (mm)', num(`${a} data-f="radius"`, l.radius || 260, 60, 1500, 10))}<div class="c4h-row"><button type="button" class="b" data-c="dup">Duplicate</button><button type="button" class="b" data-c="del">Delete</button></div>`; } }
    h += `<p class="c4h-note">Draw line: drag on the table. Select / move: drag a box, wall, cylinder or lamp. It is the same table for every project.</p>`;
  }
  if (tab === 'view') {
    h += `<div class="c4h-views">${[['iso', '🧊', 'Isometric'], ['persp', '📐', 'Perspective'], ['table', '🗺️', 'Whole table'], ['front', '⬆️', 'Front'], ['back', '⬇️', 'Back'], ['top', '⏫', 'Top'], ['left', '⬅️', 'Left'], ['right', '➡️', 'Right'], ['bottom', '⏬', 'Bottom']].map(([k, ic, t]) => `<button type="button" data-view="${k}"><span aria-hidden="true">${ic}</span>${t}</button>`).join('')}</div>`;
    h += `<div class="c4h-chips"><button type="button" class="${C4H.follow ? 'on' : ''}" data-c="follow" aria-pressed="${!!C4H.follow}">🎯 Follow the robot</button><button type="button" class="${C4H.ex ? 'on' : ''}" data-c="explode" aria-pressed="${!!C4H.ex}">💥 Exploded view</button></div>`;
    h += `<div class="c4h-lbl">Show</div><div class="c4h-chips">${[['wheels', 'Wheels'], ['motors', 'Motor direction'], ['wiring', 'Wiring'], ['beams', 'Sensor beams'], ['values', 'Sensor values'], ['trail', 'Path'], ['bounds', 'Collision outline']].map(([k, t]) => `<button type="button" class="${C4H.ov[k] ? 'on' : ''}" data-ov="${k}" aria-pressed="${!!C4H.ov[k]}">${t}</button>`).join('')}${[['obstacles', 'Obstacles'], ['light', 'Light source'], ['track', 'Line track']].map(([k, t]) => `<button type="button" class="${E.show[k] ? 'on' : ''}" data-show="${k}" aria-pressed="${!!E.show[k]}">${t}</button>`).join('')}</div>`;
    h += `<h4>Parts</h4><div class="c4h-list">${Object.keys(CAR4_PARTS).filter((id) => car.mdl && car.mdl.parts.has(id)).map((id) => `<button type="button" class="${C4H.part === id ? 'on' : ''}" data-part="${id}">${esc(CAR4_PARTS[id][0])}</button>`).join('')}</div>${C4H.part ? `<p class="c4h-note"><b>${esc(CAR4_PARTS[C4H.part][0])}</b> (${C4H.part}): ${esc(CAR4_PARTS[C4H.part][1])} ${esc(CAR4_PARTS[C4H.part][2])}.</p>` : ''}<p class="c4h-src">${esc(CAR4.dimsSource)}</p>`;
  }
  h += '</div>'; el.innerHTML = h; el.classList.toggle('min', C4H.min); c4hKnob(); c4hLive(car, true);
}
// the hardware table: which driver goes with which controller here, what each driver needs, and where each sensor is wired.
// ✓ = one of the 12 setups; ✗ = does not fit (a shield for the Uno's headers, an edge-connector board); – = could be wired by hand, not set up here.
const C4H_FIT = {
  arduino: { amsr3: 'y', l293d: 'y', rbsbitdrv: ['n', 'An edge-connector board for the RBS bit'], hg7881: ['m', 'Can be wired to an Uno by hand; not one of the setups here'] },
  rbsbit: { amsr3: ['n', 'A shield for the Uno’s headers'], l293d: ['n', 'A shield for the Uno’s headers'], rbsbitdrv: 'y', hg7881: ['m', 'Can be wired by hand (3.3 V logic); not one of the setups here'] },
  esp32: { amsr3: ['n', 'A shield for the Uno’s headers'], l293d: ['n', 'A shield for the Uno’s headers'], rbsbitdrv: ['n', 'An edge-connector board for the RBS bit'], hg7881: 'y' },
};
const C4H_DRVSPEC = {   // per-channel limits from the drivers' datasheets; the voltage drops are the model's illustrative values
  amsr3: ['L298P', '2 A per channel', '≥ 4.8 V (refuses less)', '≈1.8 V (illustrative)'],
  l293d: ['L293D ×2 (+74HC595)', '0.6 A per channel', '≥ 4.5 V on EXT_PWR', '≈1.4 V (illustrative)'],
  rbsbitdrv: ['PCA9685 (I²C) + H-bridges', 'see the board’s documentation', '≥ 3.0 V (model)', '≈0.3 V (illustrative)'],
  hg7881: ['L9110S ×4', '0.8 A per channel', '≥ 2.5 V', '≈0.4 V (illustrative)'],
};
function c4hCompat() {
  const drvs = Object.keys(C4P_DRV), cell = (v) => { const [k, why] = Array.isArray(v) ? v : [v, 'One of the 12 setups']; return `<td class="${k}" title="${esc(why)}">${k === 'y' ? '✓' : k === 'n' ? '✗' : '–'}</td>`; };
  let h = `<table class="c4h-tbl"><tr><th></th>${drvs.map((d) => `<th>${esc(C4P_DRV[d].short)}</th>`).join('')}</tr>${Object.entries(C4P_CTRL).map(([ck, C]) => `<tr><th>${esc(C.name)}</th>${drvs.map((d) => cell(C4H_FIT[ck][d])).join('')}</tr>`).join('')}</table>`;
  h += `<p class="c4h-note">✓ one of the 12 setups · ✗ does not fit · – could be wired by hand, not set up here (hover for why).</p>`;
  h += `<table class="c4h-tbl"><tr><th>Driver</th><th>Chip</th><th>Ch.</th><th>Current</th><th>Supply</th><th>Battery</th><th>Drop</th></tr>${drvs.map((d) => { const S = C4H_DRVSPEC[d], D = C4P_DRV[d]; return `<tr><td>${esc(D.short)}</td><td>${esc(S[0])}</td><td>${D.channels}${D.channels === 2 ? ' (paired)' : ''}</td><td>${esc(S[1])}</td><td>${esc(S[2])}</td><td>${D.battery}</td><td>${esc(S[3])}</td></tr>`; }).join('')}</table>`;
  const P = C4P_PINS, us = (c) => `TRIG ${P[c].trig}, ECHO ${P[c].echo}`;
  h += `<table class="c4h-tbl"><tr><th>Sensor</th><th>Arduino Uno</th><th>RBS bit</th><th>ESP32</th></tr>
    <tr><td>HC-SR04 ultrasonic</td><td>${us('arduino')} · 5 V</td><td>${us('rbsbit')} · 3.3 V (HC-SR04P)</td><td>${us('esp32')} · 3.3 V (HC-SR04P)</td></tr>
    <tr><td>LDR modules (AO)</td><td>${P.arduino.ldrL}, ${P.arduino.ldrR}</td><td>${P.rbsbit.ldrL}, ${P.rbsbit.ldrR}</td><td>GPIO ${P.esp32.ldrL}, ${P.esp32.ldrR}</td></tr>
    <tr><td>TCRT5000 line ×3 (AO)</td><td>${P.arduino.irL}, ${P.arduino.irC}, ${P.arduino.irR}</td><td>${P.rbsbit.irL}, ${P.rbsbit.irC}, ${P.rbsbit.irR}</td><td>GPIO ${P.esp32.irL}, ${P.esp32.irC}, ${P.esp32.irR}</td></tr>
    <tr><td>Sensor supply</td><td>${P.arduino.vcc}</td><td>3.3 V (${P.rbsbit.vcc})</td><td>${P.esp32.vcc}</td></tr></table>`;
  h += `<p class="c4h-note">${Object.values(C4P_PINS).map((x) => esc(x.why)).join(' ')}</p>`;
  return h;
}
function c4hLive(car, force) {
  const now = performance.now(); if (!force && now - C4H.uiT < 150) return; C4H.uiT = now; const el = C4H.el; if (!el || el.hidden || C4H.min) return;
  const ph = car4Ph(car), pk = car4Pack(car), I = car.state.Iall || 0, vb = pk.voc - pk.rin * I, soc = Math.round(pk.soc * 100);
  const st = el.querySelector('[data-live="stat"]');
  if (st) st.innerHTML = `<div class="st"><i>Speed</i><b>${c4n(Math.abs(ph.v * 1000))}</b><u>mm/s${ph.v < -0.002 ? ' · back' : ''}</u></div><div class="st"><i>Battery · ${pk.wiring}</i><b>${soc}%</b><u>${c4n(vb, 2)} V · ${c4n(I * 1000)} mA</u><em class="${soc < 15 ? 'crit' : soc < 35 ? 'low' : ''}" style="width:${soc}%"></em></div><div class="st ${run.state === 'running' ? 'run' : 'stop'}"><i>Program</i><b>${run.state === 'running' ? '● Running' : run.state === 'stopped' ? '○ Stopped' : '◌ ' + esc(run.state)}</b></div>`;
  const kv = el.querySelector('[data-live="kv"]');
  if (kv) kv.innerHTML = [['Position', `${c4n(ph.x)}, ${c4n(-ph.z)} mm`], ['Heading', `${c4n((((ph.th / deg) % 360) + 360) % 360)}°`], ['Speed', `${c4n(ph.v * 1000)} mm/s`], ['Turning', `${c4n(ph.r / deg)} °/s`], ['Travelled', `${c4n(ph.odo / 1000, 2)} m`], ...(ph.hit ? [['Contact', `<span class="c4h-hit">${esc(ph.hit.what)}</span>`]] : [])].map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');
  for (const m of CAR4_M) {
    const rpm = (ph.w[m] * 30) / Math.PI, f = Math.min(1, Math.abs(rpm) / 200), w = el.querySelector(`[data-w="${m}"]`), n = el.querySelector(`[data-n="${m}"]`);
    if (w) { const hp = f * 50; w.style.height = `${hp}%`; w.style.top = rpm >= 0 ? `${50 - hp}%` : '50%'; w.parentElement.classList.toggle('r', rpm < -0.5); }
    if (n) n.textContent = `${c4n(rpm)}`;
  }
  const wn = el.querySelector('[data-live="warn"]'); if (wn) wn.innerHTML = C4H.warn ? `<div class="c4h-warn">⚠️ ${esc(C4H.warn)}</div>` : '';
  const out = el.querySelector('.c4h-speed output'), sp = el.querySelector('.c4h-speed input'); if (out && sp) out.textContent = `${sp.value}%`;
}
function c4hClick(b, e) {
  const car = c4hCar(); if (!car) return; const d = b.dataset;
  if (d.tab) { C4H.tab = d.tab; return c4hRender(); }
  if (d.mode) return c4hMode(car, d.mode);
  if (d.pickCtrl) { const pr = c4pOf(car); if (!pr) { C4H.pickCtrl = d.pickCtrl; return c4hRender(); } if (pr.ctrl === d.pickCtrl) return; c4pLoad(d.pickCtrl, pr.proj); return; }   // another controller: its own defaults
  if (d.pickDrv) { const pr = c4pOf(car); if (pr && pr.drv !== d.pickDrv) c4pLoad(pr.ctrl, pr.proj, d.pickDrv, pr.params); return; }
  if (d.pickProj) { const pr = c4pOf(car), ctrl = pr ? pr.ctrl : C4H.pickCtrl || 'arduino'; if (pr && pr.proj === d.pickProj) return; c4pLoad(ctrl, d.pickProj, pr && C4P_CTRL[ctrl].drivers.includes(pr.drv) ? pr.drv : undefined); return; }
  if (d.view) return c4hView(d.view);
  if (d.ov) { C4H.ov[d.ov] = !C4H.ov[d.ov]; return c4hRender(); }
  if (d.show) { const E = car4Env(car); E.show[d.show] = !E.show[d.show]; return c4wChanged(car); }
  if (d.tool) { C4H.tool = d.tool; return c4hRender(); }
  if (d.add) return c4hAdd(car, d.add);
  if (d.cmd) { if (c4pSend(d.cmd)) toast(`Sent ${d.cmd} to the program.`); return; }
  if (d.part) { C4H.part = C4H.part === d.part ? null : d.part; c4hHighlight(car, C4H.part); return c4hRender(); }
  const c = d.c;
  if (c === 'min') { C4H.min = !C4H.min; return c4hRender(); }
  if (c === 'hide') return c4hShow(false);
  if (c === 'stop' || c === 'estop') { C4H.joy = { x: 0, y: 0, on: false }; C4H.keys.clear(); C4H.btn = null; C4H.voiceCmd = null; car.state.manCur = { L: 0, R: 0 }; car.state.man = { L: 0, R: 0 }; if (c === 'estop' && run.state !== 'stopped') stopProgram(); c4hKnob(); return c4hRender(); }
  if (c === 'run') { c4pRun(run.state === 'stopped'); setTimeout(c4hRender, 300); return; }
  if (c === 'reset') { car4Reset(car); C4W.trailN = -1; return c4hRender(); }
  if (c === 'resetproj') { const pr = c4pOf(car); if (pr) c4pLoad(pr.ctrl, pr.proj, pr.drv); return; }
  if (c === 'loadproj') { const el = C4H.el; c4pLoad(el.querySelector('[data-k="ctrl"]').value, el.querySelector('[data-k="proj"]').value, el.querySelector('[data-k="drv"]').value); return; }
  if (c === 'pressA' || c === 'pressB') return c4pPress(c === 'pressA' ? 'A' : 'B');
  if (c === 'voice') return c4hVoice(!C4H.voice);
  if (c === 'follow') { C4H.follow = !C4H.follow; C4H.lastC = null; return c4hRender(); }
  if (c === 'explode') { C4H.ex = !C4H.ex; c4hExplode(car); return c4hRender(); }
  if (c === 'resetTable') { const pr = c4pOf(car); car.props.env = { ...car4Preset('oval'), shape: 'oval' }; const E = car4Env(car); E.lights = car4Preset('light').lights; E.obstacles = car4Preset('obstacles').obstacles; if (pr) c4pTable(car, pr.proj); C4H.sel = null; return c4wChanged(car); }
  if (c === 'clearLines' || c === 'clearObs' || c === 'clearLights') { const E = car4Env(car); if (c === 'clearLines') { E.strokes = []; E.shape = 'custom'; } if (c === 'clearObs') E.obstacles = []; if (c === 'clearLights') E.lights = []; C4H.sel = null; return c4wChanged(car); }
  if (c === 'del' || c === 'dup') { const E = car4Env(car), s = C4H.sel; if (!s) return; const arr = s.kind === 'obs' ? E.obstacles : E.lights, i = arr.findIndex((o) => o.id === s.id); if (i < 0) return; if (c === 'del') { arr.splice(i, 1); C4H.sel = null; } else { const o = { ...arr[i], id: car4Id(s.kind === 'obs' ? 'o' : 'l'), x: arr[i].x + 60, z: arr[i].z + 60 }; arr.push(o); C4H.sel = { kind: s.kind, id: o.id }; } return c4wChanged(car); }
}
function c4hInput(el, done) {
  const car = c4hCar(); if (!car) return; const d = el.dataset, num = () => { const v = parseFloat(el.value); return Number.isFinite(v) ? v : null; };
  if (d.k === 'mode') { if (done) c4hMode(car, el.value); return; }
  if (d.k === 'ctrl' || d.k === 'proj' || d.k === 'drv') { if (!done) return; const pr = c4pOf(car); if (!pr) { if (d.k === 'ctrl') c4hRender(); return; } const E = C4H.el, ctrl = E.querySelector('[data-k="ctrl"]').value, proj = E.querySelector('[data-k="proj"]').value, drv = d.k === 'drv' ? el.value : C4P_CTRL[ctrl].drivers.includes(pr.drv) ? pr.drv : C4P_CTRL[ctrl].drivers[0]; c4pLoad(ctrl, proj, drv, pr.proj === proj ? pr.params : null); return; }
  if (d.k && d.k in C4H_DRIVE) { const v = el.type === 'checkbox' ? el.checked : num(); if (v == null) return; car.props.drive = { ...(car.props.drive || {}), [d.k]: v }; if (done) { save(); if (el.type === 'checkbox' || d.k === 'dead') c4hRender(); } return; }
  if (d.motor) { const v = num(); if (v == null) return; car.props.drive = { ...(car.props.drive || {}), motors: { ...((car.props.drive || {}).motors || {}), [d.motor]: v } }; if (car.props.mode !== 'manual') c4hMode(car, 'manual'); return; }
  if (d.pp) { const v = el.tagName === 'SELECT' ? Number(el.value) : num(); if (v == null) return; if (!done && el.type === 'range') { const o = el.parentElement.querySelector('input[type=number]'); if (o) o.value = v; return; } if (!done) return; c4pSet(car, d.pp, v); return c4hRender(); }
  if (d.cfg) { const [k, f] = d.cfg.split('.'), v = num(); if (v == null || v <= 0) return; car.props.cfg = car.props.cfg || {}; car.props.cfg[k] = { ...(car.props.cfg[k] || {}), [f]: v }; if (k === 'sensors' && done) { car4SyncMounts(car); } dirty = true; if (done) save(); return; }
  if (d.ssens) { const s = comps.get(+d.ssens); const v = num(); if (s && v != null) { s.props.sens = clamp(v, 5, 300); dirty = true; if (done) save(); } return; }
  if (d.obs || d.light) {
    const E = car4Env(car), arr = d.obs ? E.obstacles : E.lights, o = arr.find((q) => q.id === (d.obs || d.light)), f = d.f; if (!o) return;
    const v = el.type === 'checkbox' ? el.checked : el.tagName === 'SELECT' ? el.value : num(); if (v == null) return;
    const lim = { w: [10, 600], d: [10, 600], h: [10, 400], level: [0, 100], y: [40, 600], amp: [0, 400], radius: [60, 1500] }[f]; o[f] = lim ? clamp(v, ...lim) : v; o.placed = true;
    if (done) c4wChanged(car); else c4wSync(car); return;
  }
  if (d.env) { const E = car4Env(car);
    if (d.env === 'shape') { if (!done) return; if (el.value !== 'custom') E.strokes = car4Preset(el.value).strokes; for (const s of E.strokes) s.w = E.lineW; E.shape = el.value; E.show.track = true; return c4wChanged(car); }
    const v = el.type === 'color' ? el.value : num(); if (v == null) return;
    if (d.env === 'lineW') { E.lineW = clamp(v, 5, 60); for (const s of E.strokes) s.w = E.lineW; } if (d.env === 'lineColor') E.lineColor = v; if (d.env === 'ambient') E.ambient = clamp(v, 0, 40);
    if (done) c4wChanged(car); return;
  }
}
function c4hAdd(car, kind) {
  const E = car4Env(car), ph = car4Ph(car), ax = ph.x + 300 * Math.cos(ph.th), az = ph.z - 300 * Math.sin(ph.th);
  const x = Math.round(clamp(ax, -PLANE.w / 2 + 80, PLANE.w / 2 - 80)), z = Math.round(clamp(az, -PLANE.d / 2 + 80, PLANE.d / 2 - 80));
  if (kind === 'light') { const o = { id: car4Id('l'), x, z, y: 140, level: 85, on: true, radius: 300, placed: true }; E.lights.push(o); E.show.light = true; C4H.sel = { kind: 'light', id: o.id }; }
  else { const dd = { box: [100, 100, 110], cyl: [100, 100, 140], wall: [300, 24, 120] }[kind]; const o = { id: car4Id('o'), kind, x, z, w: dd[0], d: dd[1], h: dd[2], rot: 0, amp: 0, period: 6 }; E.obstacles.push(o); E.show.obstacles = true; C4H.sel = { kind: 'obs', id: o.id }; }
  C4H.tab = 'table'; c4wChanged(car);
}
function c4hHighlight(car, id) {
  for (const [m, mat] of C4H.hi || []) m.material = mat; C4H.hi = new Map(); if (!id || !car.mdl) return; const P = car.mdl.parts.get(id); if (!P) return;
  P.g.traverse((o) => { if (!o.isMesh || !o.material || Array.isArray(o.material) || !('emissive' in o.material)) return; C4H.hi.set(o, o.material); const h = o.material.clone(); h.emissive = new THREE.Color(0x6d5cff); h.emissiveIntensity = 0.45; if (h.transparent && h.opacity < 0.6) h.opacity = 0.55; o.material = h; });
}
function c4hExplode(car) {   // the car's own parts lift apart (at rest only: the boards and wires stay where they are)
  if (!car.mdl) return; const on = C4H.ex && !car4Displaced(car);
  for (const P of car.mdl.parts.values()) P.g.position.copy(on ? P.explode : new V3());
  shadowDirty = true;
}
// camera views in the lab's own viewport, relative to the robot's heading
const C4H_VIEWS = { iso: [1, 0.82, -1, 1.0], front: [1, 0.2, 0, 0.8], back: [-1, 0.2, 0, 0.8], left: [0, 0.2, -1, 0.8], right: [0, 0.2, 1, 0.8], top: [-0.001, 1, 0, 1.05], bottom: [0.3, -0.9, 0.18, 0.9], persp: [1.15, 0.6, -1.05, 1.05] };
// the view from below: the lab's orbit limit (84°) is opened and everything under the workplane's surface (the desk, the mat) is cut
// away while it lasts; going back above the table (any other view, or orbiting up) puts both back
const C4H_CLIP = [new THREE.Plane(new V3(0, 1, 0), -2.5)];
function c4hBelow(on) {
  if (C4H.polar0 == null) C4H.polar0 = controls.maxPolarAngle;
  C4H.below = on; controls.maxPolarAngle = on ? Math.PI - 0.08 : C4H.polar0; renderer.clippingPlanes = on ? C4H_CLIP : []; shadowDirty = true;
}
function c4hView(name) {
  const car = c4hCar(); if (!car) return;
  if (name === 'table') { if (C4H.below) c4hBelow(false); const dir = new V3(0.42, 0.66, 0.62).normalize(), tgt = new V3(90, 0, 30); flyTo(tgt.clone().addScaledVector(dir, 1450), tgt, 800); C4H.lastC = null; return; }
  if ((name === 'bottom') !== !!C4H.below) c4hBelow(name === 'bottom');
  const ph = car4Ph(car), v = C4H_VIEWS[name] || C4H_VIEWS.iso, cs = Math.cos(ph.th), sn = Math.sin(ph.th);
  const dir = new V3(v[0] * cs + v[2] * sn, v[1], -v[0] * sn + v[2] * cs).normalize(), tgt = new V3(ph.x, 60, ph.z), dist = (270 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * v[3] * 0.55;
  // keep the view clear: stop in front of the first obstacle, lamp or fence between the robot and the camera
  let d = Math.max(380, dist); const hit = new THREE.Raycaster(tgt, dir, 1, d).intersectObjects([C4W.g], true).find((h) => h.object.isMesh && !h.object.userData.c4table && !h.object.userData.noPickC4);
  if (hit) d = Math.max(170, hit.distance - 30);
  flyTo(tgt.clone().addScaledVector(dir, d), tgt, 700); C4H.lastC = null;
}
// the toolbar: 4WD Robot opens a menu of the 12 projects (in place, no window)
{ const ex = document.getElementById('btnExamples'); if (ex && !document.getElementById('btnRobot4')) { const b = document.createElement('button'); b.type = 'button'; b.id = 'btnRobot4'; b.className = ex.className; b.textContent = '4WD Robot'; b.title = 'The 4WD robot projects: Arduino, RBS bit, ESP32'; b.setAttribute('aria-haspopup', 'true'); ex.after(b);
  b.addEventListener('click', (e) => {
    e.stopPropagation(); const old = document.querySelector('.c4h-menu'); if (old) { old.remove(); return; }
    const m = document.createElement('div'); m.className = 'c4h-menu'; m.setAttribute('role', 'menu'); m.setAttribute('aria-label', '4WD Robot projects');
    const car = c4hCar(), pr = car && c4pOf(car), short = { arduino: 'Arduino', rbsbit: 'RBS bit', esp32: 'ESP32' };
    m.innerHTML = `<div class="mh"><b>4WD Robot</b><span>Pick a project and the controller to build it with</span></div>${car ? '<button type="button" class="panelb" data-m="panel">Show the robot panel</button>' : ''}
      <div class="mg"><span></span>${Object.keys(C4P_CTRL).map((k) => `<span class="ch">${short[k]}</span>`).join('')}
      ${Object.entries(C4P_PROJ).map(([pk, J]) => `<div class="pj"><span class="ic" aria-hidden="true">${J.icon}</span><span><b>${esc(J.name)}</b><small>${esc(J.level)} · ${J.mins} min</small></span></div>${Object.keys(C4P_CTRL).map((ck) => `<button type="button" role="menuitem" class="go${pr && pr.proj === pk && pr.ctrl === ck ? ' cur' : ''}" data-m="${ck}:${pk}" aria-label="${esc(J.name)} with the ${esc(C4P_CTRL[ck].name)}">${pr && pr.proj === pk && pr.ctrl === ck ? '✓ ' : ''}${short[ck]}</button>`).join('')}`).join('')}</div>
      <p class="ft">The robot is built on this workplane and drives in this view. The Project tab of the robot panel changes the driver and the settings.</p>`;
    const r = b.getBoundingClientRect(); m.style.top = `${r.bottom + 6}px`; m.style.left = `${Math.max(8, Math.min(window.innerWidth - 438, r.right - 430))}px`;
    document.body.appendChild(m);
    m.addEventListener('click', (ev) => { const it = ev.target.closest('[data-m]'); if (!it) return; m.remove(); if (it.dataset.m === 'panel') return c4hShow(true); const [ck, pk] = it.dataset.m.split(':'); c4pLoad(ck, pk); });
    const off = (ev) => { if (!m.contains(ev.target) && ev.target !== b) { m.remove(); document.removeEventListener('click', off); document.removeEventListener('keydown', esc2); } }, esc2 = (ev) => { if (ev.key === 'Escape') { m.remove(); b.focus(); document.removeEventListener('click', off); document.removeEventListener('keydown', esc2); } };
    setTimeout(() => { document.addEventListener('click', off); document.addEventListener('keydown', esc2); }, 0);
    const first = m.querySelector('button'); if (first) first.focus();
  }); } }
// ---- 8d. the table's objects under the pointer: drag lamps and obstacles, draw lines (captured before the lab's own handlers) ----
{
  const ray = new THREE.Raycaster(), ptr = new V2(), plane = new THREE.Plane(new V3(0, 1, 0), 0);
  const cast = (e) => { const b = stage.getBoundingClientRect(); ptr.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); ray.setFromCamera(ptr, camera); return ray; };
  let drag = null;
  stage.addEventListener('pointerdown', (e) => {
    const car = c4hCar(); if (!car || e.button !== 0 || e.target.closest('.c4h') || !C4W.car) return;
    const r = cast(e), p = new V3(), onT = r.ray.intersectPlane(plane, p), E = car4Env(car);
    if (C4H.tool === 'draw' && onT && C4H.shown) { const s = { w: E.lineW, pts: [[Math.round(p.x), Math.round(p.z)]] }; E.strokes.push(s); E.show.track = true; E.shape = 'custom'; drag = { kind: 'draw', s, t: 0 }; }
    else {
      const hits = r.intersectObjects([C4W.g], true).filter((h) => h.object.isMesh && !h.object.userData.noPickC4 && !h.object.userData.c4table); const h = hits[0]; if (!h) return;
      let o = h.object, lightId = null; while (o && o !== C4W.g) { if (o.userData.c4light) { lightId = o.userData.c4light; break; } o = o.parent; }
      const obsId = h.object.userData.c4obs, item = obsId ? E.obstacles.find((q) => q.id === obsId) : lightId ? E.lights.find((q) => q.id === lightId) : null; if (!item || !onT) return;
      drag = { kind: obsId ? 'obs' : 'light', o: item, dx: item.x - p.x, dz: item.z - p.z, moved: false }; C4H.sel = { kind: drag.kind, id: item.id }; C4H.tab = 'table'; c4hRender();
    }
    e.stopPropagation(); e.preventDefault(); controls.enabled = false; stage.setPointerCapture(e.pointerId);
  }, true);
  stage.addEventListener('pointermove', (e) => {
    if (!drag) return; const car = c4hCar(); if (!car) { drag = null; return; } const p = new V3(); if (!cast(e).ray.intersectPlane(plane, p)) return; const E = car4Env(car), cx = (v, h) => clamp(v, -h / 2, h / 2);
    if (drag.kind === 'draw') { const last = drag.s.pts[drag.s.pts.length - 1]; if (Math.hypot(last[0] - p.x, last[1] - p.z) > 8) { drag.s.pts.push([Math.round(cx(p.x, PLANE.w)), Math.round(cx(p.z, PLANE.d))]); const now = performance.now(); if (now - drag.t > 80) { drag.t = now; E.ver++; delete car.state.trk; c4wTrackCanvas(E); if (C4W.tex) C4W.tex.needsUpdate = true; } } }
    else { drag.o.x = Math.round(cx(p.x + drag.dx, PLANE.w)); drag.o.z = Math.round(cx(p.z + drag.dz, PLANE.d)); drag.o.placed = true; drag.moved = true; c4wSync(car); }
    e.stopPropagation();
  }, true);
  const up = (e) => { if (!drag) return; const car = c4hCar(), D = drag; drag = null; controls.enabled = true; if (!car) return; if (D.kind === 'draw' && D.s.pts.length < 2) car4Env(car).strokes.pop(); c4wChanged(car); e && e.stopPropagation(); };
  stage.addEventListener('pointerup', up, true); stage.addEventListener('pointercancel', up, true);
}
// keyboard: W A S D and Space while the stage (or the robot panel) has the attention and nothing is being typed
{
  const typing = (t) => !!(t && t.closest && (t.closest('input, textarea, select, [contenteditable], .blocklyWidgetDiv, .blocklyHtmlInput') || t.isContentEditable));
  window.addEventListener('keydown', (e) => {
    const car = c4hCar(); if (!car || typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return; const k = e.key.toLowerCase();
    const mode = car.props.mode || 'program';
    if (k === ' ' && e.target && e.target.closest && e.target.closest('button, a, summary, [role=button], [role=tab]')) return;   // Space presses a focused button, as usual
    if (k === ' ' && (C4H.shown || mode !== 'program')) { C4H.keys.clear(); C4H.joy = { x: 0, y: 0, on: false }; C4H.btn = null; C4H.voiceCmd = null; car.state.manCur = { L: 0, R: 0 }; car.state.man = { L: 0, R: 0 }; if (mode === 'program' && run.state !== 'stopped') stopProgram(); e.preventDefault(); return; }
    if (!'wasd'.includes(k) || k.length !== 1 || !C4H.shown) return;
    if (c4hModule(car)) { if (run.state === 'stopped') { c4pRun(true); toast('Started the program: it reads the joystick module.'); } }
    else if (!['manual', 'keys', 'voice', 'remote'].includes(mode)) c4hMode(car, 'keys');
    C4H.keys.add(k); e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { C4H.keys.delete(e.key.toLowerCase()); });
  window.addEventListener('blur', () => { C4H.keys.clear(); C4H.joy = { x: 0, y: 0, on: false }; c4hKnob(); });
}
// the joystick project: the on-screen joystick, the arrows and W A S D push the joystick MODULE's stick (0–100 on each axis, 50 at rest);
// the program reads VRx/VRy through the circuit. When none of them is in use, the lab's own drag of the lever is left alone.
function c4hModuleTick(car, jm) {
  const J = C4H.joy; let x = 0, y = 0, act = false;
  if (J.on) { x = J.x; y = J.y; act = true; }
  else if (C4H.keys.size) { y = (C4H.keys.has('w') ? 1 : 0) - (C4H.keys.has('s') ? 1 : 0); x = (C4H.keys.has('d') ? 1 : 0) - (C4H.keys.has('a') ? 1 : 0); act = true; }
  else if (C4H.btn) { [x, y] = { F: [0, 1], B: [0, -1], L: [-1, 0], R: [1, 0] }[C4H.btn] || [0, 0]; act = true; }
  if (!act && !C4H.modOn) return; C4H.modOn = act;
  const k = Math.hypot(x, y) > 1 ? 1 / Math.hypot(x, y) : 1, nx = clamp(50 + x * k * 50, 0, 100), ny = clamp(50 + y * k * 50, 0, 100);
  if (Math.abs(jm.props.x - nx) > 0.1 || Math.abs(jm.props.y - ny) > 0.1) { jm.props.x = nx; jm.props.y = ny; dirty = true; }
}
// called from the car's tick in the lab's frame loop: the table, the overlays, manual driving, the camera follow, the panel
function c4hudTick(car, dt) {
  if (!C4H.el) c4hShow(true);   // a saved robot circuit was opened: its panel comes up once (× hides it)
  if (C4W.car !== car || C4W.ver !== car4Env(car).ver) c4wBuild(car);
  if (car4Env(car).obstacles.some((o) => o.amp)) c4wSync(car);
  const mode = car.props.mode || 'program';
  const jm = c4hModule(car);
  if (car.props.src === 'manual') c4hManualTick(car, dt); else if (mode === 'remote') { c4hRemoteTick(car); C4H.warn = ''; } else if (jm) c4hModuleTick(car, jm);
  c4wOverlays(car); c4wLabels(car);
  if (C4H.follow) { const ph = car4Ph(car), C = new V3(ph.x, 60, ph.z); if (C4H.lastC) { const d = C.clone().sub(C4H.lastC); camera.position.add(d); controls.target.add(d); } C4H.lastC = C; }
  if (C4H.ex && car4Displaced(car)) { C4H.ex = false; c4hExplode(car); }
  if (C4H.below && !fly && camera.position.y > controls.target.y) c4hBelow(false);   // orbited back above the table
  if (C4H.lastRun !== run.state) {
    const was = C4H.lastRun; C4H.lastRun = run.state;
    if (run.state === 'running' && was && was !== 'running' && car.props.src === 'manual') c4hMode(car, 'program');   // Start: the program owns the motors
    else if (C4H.el && !C4H.el.hidden) c4hRender();
  }
  if (C4H.el && !C4H.el.hidden) c4hLive(car, false);
}
// nothing left to drive: the table objects and the panel go when the car goes
for (const nm of ['clearAll', 'removeComp']) {
  const orig = nm === 'clearAll' ? clearAll : removeComp;
  const wrapped = function (...a) {
    const c = a[0];   // the robot goes: what was mounted on it stays on the bench, upright and on the table
    if (nm === 'removeComp' && c && c.type === 'car4wd') { car4Release(c); for (const o of [...comps.values()]) if (o.props && o.props.onCar && (o.props.carId == null || o.props.carId === c.id)) car4Unmount(o); }
    const r = orig.apply(this, a); queueMicrotask(() => { car4TetherSweep(); if (!c4hCar()) { c4wClear(); if (C4H.el) C4H.el.hidden = true; C4H.shown = false; if (C4H.below) c4hBelow(false); } }); return r;
  };
  if (nm === 'clearAll') clearAll = wrapped; else removeComp = wrapped;
}
// a sensor on the car does not get the bench's props (a toy car, a lamp) at Start: the table gives it what it reads
{ const sp0 = spawnProps; spawnProps = function (c, from) { if (c && c.props && c.props.carMount) return; return sp0(c, from); }; }
// older calls: the robot is shown in the lab's own viewport
function car4Open(c) { c4hShow(true); c4hView('iso'); }
function car4Close() { c4hShow(false); }

// ---- 8e. the hardware checks for the loaded project: driver, battery, motor ratings and currents, sensor voltages, pins ----
function c4pChecks(c) {
  const pr = c4pOf(c); if (!pr) return []; const out = [], mc = car4Cfg(c, 'motor'), pk = car4Pack(c), D = C4P_DRV[pr.drv];
  if (!C4P_CTRL[pr.ctrl].drivers.includes(pr.drv)) out.push({ level: 'bad', title: `${D.short} doesn’t fit the ${C4P_CTRL[pr.ctrl].name}`, text: `Use ${C4P_CTRL[pr.ctrl].drivers.map((k) => C4P_DRV[k].short).join(' or ')}.` });
  const minV = { amsr3: 4.8, l293d: 4.5, hg7881: 2.5, rbsbitdrv: 3.0 }[pr.drv], drop = { amsr3: 1.8, l293d: 1.4, hg7881: 0.4, rbsbitdrv: 0.3 }[pr.drv];
  if (pk.voc < minV) out.push({ level: 'bad', part: 'battery_holder_18650', title: `${pk.wiring} (${pk.voc.toFixed(1)} V) is too low for the ${D.short}`, text: pr.drv === 'amsr3' ? 'The L298P needs at least VIH + 2.5 V ≈ 4.8 V on its motor supply. Wire the holder 2S (7.4 V).' : pr.drv === 'l293d' ? 'The L293D needs at least 4.5 V on EXT_PWR. Wire the holder 2S.' : 'Charge or rewire the battery.' });
  const vMot = pk.full - drop; if (vMot > mc.ratedV + 0.05) out.push({ level: 'warn', part: 'motor_front_left', title: `Up to ${vMot.toFixed(1)} V on the TT motors (rated ${mc.ratedV} V)`, text: `At full PWM the motors get more than their rating. Keep the speeds below about ${Math.round((255 * mc.ratedV) / vMot)} (of 255), or use 2P where the driver allows it.` });
  if (D.channels === 2) { const pair = 2 * mc.stallA; out.push({ level: pair > 2 ? 'bad' : 'ok', part: 'motor_front_left', title: 'Paired motors: two motors per channel', text: `The left motors share channel A, the right motors channel B: up to ${pair.toFixed(1)} A per channel if both stall (the Rev3 allows 2 A per channel). Running, a pair draws about 0.2–0.5 A.` }); }
  if (pr.drv === 'l293d' && mc.stallA > 0.6) out.push({ level: 'warn', part: 'motor_front_left', title: 'L293D: 600 mA per channel', text: `A stalled TT motor can draw ${mc.stallA} A (the value you set): avoid pushing against walls for long. Running current is well below the limit.` });
  if (pr.drv === 'hg7881' && mc.stallA > 0.8) out.push({ level: 'warn', part: 'motor_front_left', title: 'HG7881: 800 mA per channel', text: 'A stalled motor can exceed it.' });
  if (pr.proj === 'obstacle' && pr.ctrl !== 'arduino') out.push({ level: 'warn', sensor: (car4Mounted(c).find((s) => s.type === 'ultrasonic') || {}).id, title: 'HC-SR04 on 3.3 V', text: 'Here the sensor runs from 3.3 V, so its ECHO is 3.3 V and safe for the board. A classic HC-SR04 needs 5 V: then use the 3.3 V-capable HC-SR04P, or a 1 kΩ / 2 kΩ divider on ECHO.' });
  if (pr.ctrl === 'esp32') out.push({ level: 'ok', title: 'ESP32 pins', text: 'Motors on GPIO 25 26 32 33 18 19 22 23 (outputs, LEDC PWM). Sensors on GPIO 34 35 39 (input-only, ADC1) and 13/27 for the ultrasonic. No strapping pin (0, 2, 5, 12, 15) is used.' });
  if (pr.ctrl === 'arduino') out.push({ level: 'ok', title: 'Arduino pins', text: pr.drv === 'amsr3' ? 'Shield: D3 D8 D9 D11 D12 D13, A0 A1. Sensors: D2 D10, A2–A4. PWM on D3 and D11.' : 'Shield (AFMotor): D3–D8, D11, D12. Sensors: D2 D10, A2–A4.' });
  if (pr.ctrl === 'rbsbit') out.push({ level: 'ok', title: 'RBS bit pins', text: 'Motors through the expansion board’s I²C motor driver. Sensors on P0 P1 P2 (analog) with 3.3 V on the headers’ V.' });
  // connectors: every motor lead and the battery lead on a JST connector of its kind (motor / power) on the driver
  const dc = car4Driver(c).o, PD = dc ? jstPortsOf(dc) || [] : [];
  if (dc) {
    const on = new Map(), bad = [];
    for (const w of wires) {
      const a = comps.get(epParts(w.a)[0]), b = comps.get(epParts(w.b)[0]), ce = a === c ? w.a : b === c ? w.b : null, de = a === dc ? w.a : b === dc ? w.b : null; if (!ce || !de) continue;
      const cp = epParts(ce)[1], dp = epParts(de)[1]; if (!/^(FL|FR|RL|RR|B)[+-]$/.test(cp)) continue;   // only the motor and battery leads
      const kind = cp.startsWith('B') ? 'power' : 'motor', port = PD.find((q) => q.pins.includes(dp) || q.pins.some((x) => dp === x + '2'));
      if (!port || (port.kind || 'motor') !== kind) { bad.push(`${cp} → ${dp}`); continue; }
      const who = kind === 'power' ? 'battery' : cp.slice(0, 2); if (!on.has(port.label)) on.set(port.label, new Set()); on.get(port.label).add(who);
    }
    const list = [...on.entries()].map(([lab, set]) => `${[...set].join(' + ')} → ${lab}${set.size > 1 ? ' (a Y-lead: paired)' : ''}`).join(', ');
    out.push(bad.length ? { level: 'warn', title: `${bad.length} lead${bad.length > 1 ? 's' : ''} not on a JST connector`, text: bad.join('; ') }
      : { level: 'ok', title: 'Connectors: JST-XH plugs for the motors and the battery', text: `${list}. The sensors use Dupont jumper cables, grouped as ribbons along the deck.` });
  }
  const miss = (pr.wiring || []).filter((w) => !w.ok); if (miss.length) out.push({ level: 'bad', title: `${miss.length} connection${miss.length > 1 ? 's' : ''} could not be made`, text: miss.map((w) => `${w.from} → ${w.to}`).join('; ') });
  out.push({ level: 'ok', title: `${C4P_CTRL[pr.ctrl].name}: power`, text: pr.ctrl === 'arduino' ? 'Here the Uno runs from USB. On the robot, power it from the 2S battery through the shield’s Vin (7.4 V is inside the Uno’s 7–12 V Vin range when charged).' : pr.ctrl === 'esp32' ? 'Here the ESP32 runs from USB, as in the lab’s other ESP32 examples. On the robot, feed 5 V to VIN (a USB power bank or a 5 V buck converter): the 2P cells (3.0–4.2 V) are too low for its regulator.' : 'The RBS bit gets its power from the expansion board, which runs from the 2P holder on VIN.' });
  return out;
}

// ---- 9. the API for a simulation engine: RBSLab.car4wd ----
window.RBSLab = Object.assign(window.RBSLab || {}, {
  car4wd: {
    profile: CAR4, mounts: CAR4_MOUNTS, presets: CAR4_PRESETS, projects: { controllers: C4P_CTRL, drivers: C4P_DRV, projects: C4P_PROJ, params: C4P_PARAMS, pins: C4P_PINS },
    cars: () => [...comps.values()].filter((o) => o.type === 'car4wd'), panel: (on = true) => c4hShow(on), view: (v) => c4hView(v),
    load: (ctrl, proj, drv, params) => c4pLoad(ctrl, proj, drv, params), project: (c) => c4pOf(c), set: (c, k, v) => c4pSet(c, k, v), run: (start = true) => c4pRun(start), send: (ch) => c4pSend(ch), press: (k) => c4pPress(k),
    mode: (m) => c4hMode(c4hCar(), m), joystick(x, y) { C4H.joy = { x: clamp(x, -1, 1), y: clamp(y, -1, 1), on: !!(x || y) }; c4hKnob(); }, keys: (list) => { C4H.keys = new Set(list); },
    sw(on = true) { const jm = [...comps.values()].find((o) => o.type === 'joystick'); if (jm) pressComp(jm, !!on); return !!jm; }, module: () => { const jm = [...comps.values()].find((o) => o.type === 'joystick'); return jm ? { x: jm.props.x, y: jm.props.y, pressed: !!jm.state.pressed } : null; },
    saveVersion(c, name) { const x = c4pSnapshot(c, name); if (!x) return null; const L = c4pSaves(); L.unshift(x); c4pPutSaves(L.slice(0, 40)); return x; }, versions: () => c4pSaves(), openVersion: (i) => { const x = c4pSaves()[i]; return x ? c4pOpenSnapshot(x) : null; },
    code: (ctrl, drv, proj, params) => (ctrl === 'rbsbit' ? c4pBlocks(proj, { ...c4pDefaults(proj, ctrl), ...(params || {}) }) : c4pCpp(ctrl, drv, proj, { ...c4pDefaults(proj, ctrl), ...(params || {}) })),
    state(c) { const ph = car4Ph(c), pk = car4Pack(c); return { x: ph.x, z: ph.z, heading: ph.th, speed: ph.v, yawRate: ph.r, collision: ph.hit, t: ph.t, odometer: ph.odo, mode: c.props.mode || 'program', src: c.props.src, man: c.state.man, displaced: car4Displaced(c), motors: Object.fromEntries(CAR4_M.map((m) => [m, { volts: ph.V[m], amps: ph.I[m], rpm: (ph.w[m] * 30) / Math.PI }])), battery: { wiring: pk.wiring, soc: pk.soc, voltage: pk.voc - pk.rin * (c.state.Iall || 0), current: c.state.Iall || 0 } }; },
    members: (c) => [...car4Members(c)].map((o) => ({ id: o.id, type: o.type, onCar: o.props.onCar || null, lift: o.lift })),
    components(c) { const m = car4Model({ dims: c.props.cfg && c.props.cfg.dims, wiring: car4Cfg(c, 'battery').wiring }); m.g.updateMatrixWorld(true); return [...m.parts.values()].map((P) => { const b = new THREE.Box3().setFromObject(P.g), s = b.getSize(new V3()), k = b.getCenter(new V3()); return { id: P.id, name: CAR4_PARTS[P.id][0], material: CAR4_PARTS[P.id][2], centre: [k.x, k.y, k.z], size: [s.x, s.y, s.z], explode: P.explode.toArray() }; }); },
    env: (c) => car4Env(c), sense: (c) => car4SenseAll(c).map((x) => ({ id: x.s.id, type: x.s.type, mount: x.s.props.carMount, kind: x.kind, dist: x.dist, light: x.light, reflect: x.reflect })),
    checks: (c) => [...c4pChecks(c), ...car4Checks(c)], reset: (c) => car4Reset(c), step(c, seconds) { const n = Math.round(seconds / 0.05); for (let i = 0; i < n; i++) car4Tick(c, 0.05, performance.now()); return this.state(c); },
  },
});
