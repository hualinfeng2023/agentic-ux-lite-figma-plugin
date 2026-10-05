// ============================================================
// Agentic UX Lite Builder — Figma plugin (api 1.0.0)
// Generates the full Lite component library from the V4 spec:
// "Agentic UX Lite - Atomic Design 对标与组件概念设计 V4" (28 pages).
//
// VALUE PROVENANCE
// EXACT (from spec): action/default #B8410F; action/on #FFFFFF;
//   text/default #191C1B; status/success/text #126743;
//   status/warning/text #7A4A00; status/danger/text #9E2A25;
//   surface/0 #F6F4EE; surface/1 #FCFBF7; surface/2 #EEEDE7;
//   surface/3 #E5E4DD; full type scale; spacing/radius tokens;
//   32-icon list; 28 component matrices; template layout params.
// DERIVED IN CODE (spec states the rule, not the hex):
//   status/*/bg tints -> mixed toward white to hit documented WCAG ratios
//     (success 5.93 / warning 6.14 / danger 6.10 / info 6.04);
//   text/muted -> mixed toward paper to hit 6.33:1;
//   status/info/text -> blue #1E5FA8 chosen to match palette temperature
//     (spec names blue/* but gives no hex);
//   action/hover|active -> darkened 10% / 18%;
//   border/hairline|strong, disabled/fg|bg -> neutral mixes;
//   focus/ring -> action/default (meets >= 3:1);
//   selected/line -> action/default (spec fixes Surface 2 + 2px line,
//     color unspecified);
//   Primitives ramps 100-900 -> generated around the exact 700 anchors.
// ============================================================

'use strict';

// ---------------- color utils ----------------
function hx(h) {
  h = h.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255
  };
}
function toHx(c) {
  const p = v => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0');
  return ('#' + p(c.r) + p(c.g) + p(c.b)).toUpperCase();
}
function mix(h1, h2, t) {
  const a = hx(h1), b = hx(h2);
  return toHx({ r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: b.b + (b.b - a.b) * t });
}
function lin(v) { return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
function lum(h) { const c = hx(h); return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b); }
function ratio(h1, h2) {
  const a = lum(h1), b = lum(h2);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
// mix fg toward white until contrast(fg, tint) >= target (background tints)
function tintFor(fg, target) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 24; i++) {
    const m = (lo + hi) / 2;
    if (ratio(fg, mix(fg, '#FFFFFF', m)) >= target) hi = m; else lo = m;
  }
  return mix(fg, '#FFFFFF', hi);
}
// mix dark toward white until contrast(mix, bg) ~= target from above (muted text)
function muteFor(dark, bg, target) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 24; i++) {
    const m = (lo + hi) / 2;
    if (ratio(mix(dark, '#FFFFFF', m), bg) >= target) lo = m; else hi = m;
  }
  return mix(dark, '#FFFFFF', lo);
}

// ---------------- palette ----------------
const EXACT = {
  actionDefault: '#B8410F', actionOn: '#FFFFFF', textDefault: '#191C1B',
  success: '#126743', warning: '#7A4A00', danger: '#9E2A25',
  s0: '#F6F4EE', s1: '#FCFBF7', s2: '#EEEDE7', s3: '#E5E4DD'
};
const INFO_TEXT = '#1E5FA8'; // derived choice — see provenance note above

const PAL = {
  'action/default': EXACT.actionDefault,
  'action/hover': mix(EXACT.actionDefault, '#000000', 0.10),
  'action/active': mix(EXACT.actionDefault, '#000000', 0.18),
  'action/on': EXACT.actionOn,
  'text/default': EXACT.textDefault,
  'text/muted': muteFor(EXACT.textDefault, EXACT.s0, 6.33),
  'status/success/text': EXACT.success, 'status/success/bg': tintFor(EXACT.success, 5.93),
  'status/warning/text': EXACT.warning, 'status/warning/bg': tintFor(EXACT.warning, 6.14),
  'status/danger/text': EXACT.danger,   'status/danger/bg': tintFor(EXACT.danger, 6.10),
  'status/info/text': INFO_TEXT,        'status/info/bg': tintFor(INFO_TEXT, 6.04),
  'surface/0': EXACT.s0, 'surface/1': EXACT.s1, 'surface/2': EXACT.s2, 'surface/3': EXACT.s3,
  'border/hairline': mix(EXACT.textDefault, EXACT.s0, 0.88),
  'border/strong': mix(EXACT.textDefault, EXACT.s0, 0.74),
  'focus/ring': EXACT.actionDefault,
  'disabled/fg': mix(EXACT.textDefault, '#FFFFFF', 0.55),
  'disabled/bg': EXACT.s2,
  'selected/bg': EXACT.s2,
  'selected/line': EXACT.actionDefault
};

function ramp(anchor) {
  const o = {};
  for (const s of [100, 200, 300, 400, 500, 600, 700, 800, 900]) {
    if (s === 700) o[s] = anchor;
    else if (s < 700) o[s] = mix(anchor, '#FFFFFF', ((700 - s) / 600) * 0.88);
    else o[s] = mix(anchor, '#000000', ((s - 700) / 200) * 0.42);
  }
  return o;
}
const RAMPS = {
  'signal/orange': ramp(EXACT.actionDefault),
  'amber': ramp(EXACT.warning),
  'green': ramp(EXACT.success),
  'red': ramp(EXACT.danger),
  'blue': ramp(INFO_TEXT),
  'neutral': (function () {
    const o = {};
    [100, 200, 300, 400, 500, 600, 700, 800, 900].forEach((s, i) => {
      o[s] = mix('#191C1B', '#F6F4EE', i / 8);
    });
    return o;
  })()
};

// ---------------- icon geometry (Lucide, ISC — see LICENSE-lucide.txt) ----------------
// 24x24 viewBox, stroke-width 2, round caps/joins, no fill. Rendered at 16px
// with 1.5px stroke per spec.
const ICONS = [
  ['play', '<polygon points="6 3 20 12 6 21 6 3"/>'],
  ['pause', '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>'],
  ['stop', '<rect width="18" height="18" x="3" y="3" rx="2"/>'],
  ['undo', '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11"/>'],
  ['redo', '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5 5.5 5.5 0 0 0 9.5 20H13"/>'],
  ['refresh-cw', '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>'],
  ['rotate-ccw', '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'],
  ['check', '<path d="M20 6 9 17l-5-5"/>'],
  ['x', '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'],
  ['shield-check', '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>'],
  ['shield-alert', '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/>'],
  ['alert-triangle', '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>'],
  ['info', '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'],
  ['clock', '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'],
  ['help-circle', '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'],
  ['calendar', '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>'],
  ['user', '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'],
  ['user-check', '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>'],
  ['users', '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'],
  ['cpu', '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>'],
  ['terminal', '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>'],
  ['list', '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>'],
  ['activity', '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>'],
  ['filter', '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>'],
  ['search', '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'],
  ['sort-asc', '<path d="M11 5h10"/><path d="M11 9h7"/><path d="M11 13h4"/><polyline points="3 17 6 14 9 17"/><line x1="6" y1="4" x2="6" y2="14"/>'],
  ['sort-desc', '<path d="M11 5h10"/><path d="M11 9h7"/><path d="M11 13h4"/><polyline points="3 7 6 10 9 7"/><line x1="6" y1="10" x2="6" y2="20"/>'],
  ['chevron-right', '<path d="m9 18 6-6-6-6"/>'],
  ['chevron-down', '<path d="m6 9 6 6 6-6"/>'],
  ['more-horizontal', '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>'],
  ['external-link', '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'],
  ['copy', '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'],
  ['pin', '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z"/>'],
  ['send', '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>'],
  ['flag', '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>'],
  ['layers', '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>'],
  ['history', '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>'],
  ['wallet', '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>'],
  ['gauge', '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>'],
  ['pencil', '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>'],
  ['graduation-cap', '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>'],
  ['hand', '<path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>'],
  ['eye', '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>']
];

// ---------------- plugin state ----------------
const S = {};    // text styles, keyed by short id
const VV = {};   // variables, keyed by token name
const ICON_T = {}; // icon vector templates (detached), keyed by icon name
const SETS = {};   // component sets, keyed by set name
let FONT_OK = false;

async function loadFonts() {
  const reqs = [
    { family: 'Inter', style: 'Regular' },
    { family: 'Inter', style: 'Semi Bold' },
    { family: 'Noto Sans Mono', style: 'Regular' }
  ];
  try {
    for (const f of reqs) await figma.loadFontAsync(f);
    FONT_OK = true;
  } catch (e) {
    FONT_OK = false;
    figma.notify('Inter could not be loaded — install Inter and re-run for exact type. Continuing with fallback.', { timeout: 6000 });
  }
}

// ---------------- pages ----------------
function makePages() {
  const p0 = figma.createPage(); p0.name = '00 Foundations';
  const p1 = figma.createPage(); p1.name = '01 Components';
  const p2 = figma.createPage(); p2.name = '02 Templates';
  figma.root.appendChild(p0);
  figma.root.appendChild(p1);
  figma.root.appendChild(p2);
  const old = figma.root.children.find(c => c.name === 'Page 1');
  if (old && figma.root.children.length > 3) old.remove();
  figma.currentPage = p0;
  return [p0, p1, p2];
}

// ---------------- variables ----------------
function buildVariables() {
  const prim = figma.variables.createVariableCollection('Primitives');
  prim.renameMode(prim.modes[0].modeId, 'Light');
  const sem = figma.variables.createVariableCollection('Semantic');
  sem.renameMode(sem.modes[0].modeId, 'Light');
  const modeP = prim.modes[0].modeId, modeS = sem.modes[0].modeId;

  function cv(coll, mode, name, hex) {
    const v = figma.variables.createVariable(name, coll, 'COLOR');
    v.setValueForMode(mode, hx(hex));
    VV[name] = v;
    return v;
  }
  for (const hue of Object.keys(RAMPS)) {
    for (const s of [100, 200, 300, 400, 500, 600, 700, 800, 900]) {
      cv(prim, modeP, hue + '/' + s, RAMPS[hue][s]);
    }
  }
  for (const k of Object.keys(PAL)) cv(sem, modeS, k, PAL[k]);

  // spacing + radius as NUMBER variables inside Semantic (two-collection gate)
  const SP = { 'space/050': 4, 'space/100': 8, 'space/150': 12, 'space/200': 16, 'space/300': 24, 'space/400': 32, 'space/600': 48, 'space/800': 64 };
  const RA = { 'radius/none': 0, 'radius/xs': 2, 'radius/sm': 4, 'radius/md': 6, 'radius/lg': 8, 'radius/full': 999 };
  for (const k of Object.keys(SP)) {
    const v = figma.variables.createVariable(k, sem, 'FLOAT');
    v.setValueForMode(modeS, SP[k]); VV[k] = v;
  }
  for (const k of Object.keys(RA)) {
    const v = figma.variables.createVariable(k, sem, 'FLOAT');
    v.setValueForMode(modeS, RA[k]); VV[k] = v;
  }
}

// ---------------- text styles ----------------
// [style name, key, size, weight, lineHeight, letterSpacing, mono?]
const TYPE = [
  ['Type/Display', 'display', 48, 600, 52, -1.2, false],
  ['Type/H1', 'h1', 32, 600, 38, -0.6, false],
  ['Type/H2', 'h2', 24, 600, 30, -0.3, false],
  ['Type/H3', 'h3', 20, 600, 26, -0.2, false],
  ['Type/H4', 'h4', 16, 600, 22, 0, false],
  ['Type/Body LG', 'body-lg', 16, 400, 24, 0, false],
  ['Type/Body MD', 'body-md', 14, 400, 20, 0, false],
  ['Type/Body SM', 'body-sm', 13, 400, 18, 0, false],
  ['Type/Caption', 'caption', 12, 400, 16, 0.1, false],
  ['Type/Overline', 'overline', 11, 600, 16, 0.8, false],
  ['Type/Code', 'code', 12, 400, 18, 0, true]
];
function buildTextStyles() {
  for (const [name, key, size, weight, lh, ls, mono] of TYPE) {
    const st = figma.createTextStyle();
    st.name = name;
    st.fontName = mono
      ? { family: 'Noto Sans Mono', style: 'Regular' }
      : { family: 'Inter', style: weight === 600 ? 'Semi Bold' : 'Regular' };
    st.fontSize = size;
    st.lineHeight = { unit: 'PIXELS', value: lh };
    st.letterSpacing = { unit: 'PIXELS', value: ls };
    S[key] = st;
  }
}

// ---------------- draw helpers ----------------
// Frame helper with auto layout. o: {dir,p,c,pad,px,py,gap,radius,fill,rawfill,
// nofill,bstroke,sw,align,w,h,stretch,name,comp,clip,ai}
function F(parent, o) {
  o = o || {};
  const f = o.comp ? figma.createComponent() : figma.createFrame();
  if (o.name) f.name = o.name;
  f.layoutMode = o.dir || 'VERTICAL';
  f.primaryAxisSizingMode = o.p || 'AUTO';
  f.counterAxisSizingMode = o.c || 'AUTO';
  if (o.pad !== undefined) { f.paddingTop = o.pad; f.paddingBottom = o.pad; f.paddingLeft = o.pad; f.paddingRight = o.pad; }
  if (o.px !== undefined) { f.paddingLeft = o.px; f.paddingRight = o.px; }
  if (o.py !== undefined) { f.paddingTop = o.py; f.paddingBottom = o.py; }
  if (o.gap !== undefined) f.itemSpacing = o.gap;
  if (o.radius !== undefined) f.cornerRadius = o.radius;
  if (o.fill) f.setBoundVariable('fills', VV[o.fill]);
  else if (o.rawfill) f.fills = [{ type: 'SOLID', color: hx(o.rawfill) }];
  else if (o.nofill) f.fills = [];
  if (o.bstroke) {
    f.strokes = [{ type: 'SOLID', color: hx('#000000') }];
    f.setBoundVariable('strokes', VV[o.bstroke]);
    f.strokeWeight = o.sw || 1;
    f.strokeAlign = o.align || 'INSIDE';
  }
  if (o.w !== undefined || o.h !== undefined) {
    if (o.w !== undefined) f.layoutSizingHorizontal = 'FIXED';
    if (o.h !== undefined) f.layoutSizingVertical = 'FIXED';
    f.resize(o.w !== undefined ? o.w : f.width, o.h !== undefined ? o.h : f.height);
  }
  if (o.stretch) f.layoutAlign = 'STRETCH';
  if (o.ai) f.counterAxisAlignItems = o.ai;
  if (o.clip === false) f.clipsContent = false;
  parent.appendChild(f);
  return f;
}
// Text helper. o: {bold, mono, align, maxw}
function T(parent, str, style, token, o) {
  o = o || {};
  const t = figma.createText();
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  if (FONT_OK && S[style]) t.textStyleId = S[style].id;
  t.characters = String(str);
  if (token) t.setBoundVariable('fills', VV[token]);
  if (o.align) t.textAlignHorizontal = o.align;
  parent.appendChild(t);
  return t;
}
// Section title on a page
function secTitle(parent, title, sub) {
  const w = F(parent, { gap: 4, nofill: true, name: 'Section / ' + title });
  T(w, title, 'h2', 'text/default');
  if (sub) T(w, sub, 'caption', 'text/muted');
  return w;
}
// Icon use: clone detached vector template into a 16px box, recolor strokes
function IC(parent, name, size, token) {
  size = size || 16;
  token = token || 'text/default';
  const box = F(parent, { dir: 'HORIZONTAL', w: size, h: size, nofill: true, ai: 'CENTER', name: 'icon/' + name });
  box.primaryAxisAlignItems = 'CENTER';
  const tpl = ICON_T[name];
  if (tpl) {
    for (const v of tpl) {
      const c = v.clone();
      c.strokes = [{ type: 'SOLID', color: hx('#000000') }];
      c.setBoundVariable('strokes', VV[token]);
      box.appendChild(c);
    }
  }
  return box;
}
// Divider line
function HR(parent, token) {
  const d = F(parent, { h: 1, stretch: true, name: 'divider' });
  d.setBoundVariable('fills', VV[token || 'border/hairline']);
  return d;
}

// ---------------- icons ----------------
function buildIconTemplates() {
  const holder = figma.createFrame();
  holder.name = '_icon-templates';
  holder.visible = false;
  figma.currentPage.appendChild(holder);
  for (const [name, body] of ICONS) {
    // Import at 16px geometry directly (viewBox 24 -> width 16), then pin 1.5px stroke.
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#191C1B" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
    const node = figma.createNodeFromSvg(svg);
    const vecs = node.findAll(n => 'strokeWeight' in n);
    for (const v of vecs) v.strokeWeight = 1.5;
    const kept = [];
    for (const v of vecs) { holder.appendChild(v); kept.push(v); }
    node.remove();
    ICON_T[name] = kept;
  }
}

function buildIconComponents(host) {
  const grid = F(host, { gap: 24, nofill: true, name: 'Icons / grid' });
  let row = null, i = 0;
  for (const [name] of ICONS) {
    if (i % 8 === 0) row = F(grid, { dir: 'HORIZONTAL', gap: 24, nofill: true });
    const cell = F(row, { gap: 8, nofill: true, ai: 'CENTER', name: 'icon-cell/' + name });
    const comp = figma.createComponent();
    comp.name = 'Icon / ' + name + ' / 16';
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisAlignItems = 'CENTER';
    comp.counterAxisAlignItems = 'CENTER';
    comp.layoutSizingHorizontal = 'FIXED';
    comp.layoutSizingVertical = 'FIXED';
    comp.resize(16, 16);
    for (const v of ICON_T[name]) {
      const c = v.clone();
      c.strokes = [{ type: 'SOLID', color: hx('#000000') }];
      c.setBoundVariable('strokes', VV['text/default']);
      comp.appendChild(c);
    }
    cell.appendChild(comp);
    T(cell, name, 'caption', 'text/muted');
    i++;
  }
}

// ---------------- foundations page ----------------
function swatch(parent, name, hex, note) {
  const cell = F(parent, { gap: 6, nofill: true, w: 120, name: 'swatch/' + name });
  const box = F(cell, { h: 56, stretch: true, radius: 4, rawfill: hex, bstroke: 'border/hairline', name: 'sw' });
  T(cell, name, 'caption', 'text/default');
  T(cell, hex.toUpperCase(), 'code', 'text/muted');
  if (note) T(cell, note, 'caption', 'text/muted');
  return cell;
}

function buildFoundations(page) {
  let y = 0;
  const place = (f, gapAfter) => { f.x = 0; f.y = y; y += f.height + gapAfter; };

  // 1. Primitives
  {
    const sec = F(page, { gap: 16, nofill: true, name: 'Foundations / Primitives' });
    secTitle(sec, 'Primitives', 'Raw ramps. Components never bind these directly.');
    for (const hue of Object.keys(RAMPS)) {
      T(sec, hue, 'overline', 'text/muted');
      const row = F(sec, { dir: 'HORIZONTAL', gap: 12, nofill: true });
      for (const s of [100, 200, 300, 400, 500, 600, 700, 800, 900]) {
        swatch(row, hue + '/' + s, RAMPS[hue][s]);
      }
    }
    place(sec, 96);
  }

  // 2. Semantic
  {
    const sec = F(page, { gap: 16, nofill: true, name: 'Foundations / Semantic' });
    secTitle(sec, 'Semantic', 'The only layer components may bind. Foreground/background pairs verified against WCAG ratios.');
    const groups = [
      ['Action', ['action/default', 'action/hover', 'action/active', 'action/on'],
        ['action/on on action/default', '5.52:1']],
      ['Text', ['text/default', 'text/muted'], [['text/default on surface/0', '15.61:1'], ['text/muted on surface/0', '6.33:1']]],
      ['Status', ['status/success/text', 'status/success/bg', 'status/warning/text', 'status/warning/bg', 'status/danger/text', 'status/danger/bg', 'status/info/text', 'status/info/bg'],
        [['success pair', '5.93:1'], ['warning pair', '6.14:1'], ['danger pair', '6.10:1'], ['info pair', '6.04:1']]],
      ['Surface', ['surface/0', 'surface/1', 'surface/2', 'surface/3'], []],
      ['Border', ['border/hairline', 'border/strong'], []],
      ['Interaction', ['focus/ring', 'disabled/fg', 'disabled/bg', 'selected/bg', 'selected/line'], []]
    ];
    for (const [gname, tokens, notes] of groups) {
      T(sec, gname, 'overline', 'text/muted');
      const row = F(sec, { dir: 'HORIZONTAL', gap: 12, nofill: true });
      tokens.forEach((tk, i) => swatch(row, tk, PAL[tk], notes[i] ? notes[i][0] + ' · ' + notes[i][1] : null));
    }
    place(sec, 96);
  }

  // 3. Type
  {
    const sec = F(page, { gap: 12, nofill: true, name: 'Foundations / Type' });
    secTitle(sec, 'Type', 'Inter for product UI · Noto Sans CJK SC fallback · Noto Sans Mono for logs and IDs.');
    for (const [name, key, size, weight, lh, ls] of TYPE) {
      const row = F(sec, { dir: 'HORIZONTAL', gap: 24, nofill: true, ai: 'CENTER' });
      const lab = F(row, { w: 200, nofill: true });
      T(lab, name, 'caption', 'text/muted');
      T(lab, size + 'px / ' + weight + ' / ' + lh + 'px / ' + ls + 'px', 'code', 'text/muted');
      T(row, 'Pause 8 underperforming ad sets 0123456789', key, 'text/default');
    }
    place(sec, 96);
  }

  // 4. Spacing / radius / surface / border
  {
    const sec = F(page, { gap: 16, nofill: true, name: 'Foundations / Spatial' });
    secTitle(sec, 'Spacing · Radius · Surface', '8px base grid. Shadows are none — hierarchy comes from the 4-level surface ladder.');
    T(sec, 'Spacing', 'overline', 'text/muted');
    const srow = F(sec, { dir: 'HORIZONTAL', gap: 16, nofill: true, ai: 'CENTER' });
    for (const [n, v] of [['space/050', 4], ['space/100', 8], ['space/150', 12], ['space/200', 16], ['space/300', 24], ['space/400', 32], ['space/600', 48], ['space/800', 64]]) {
      const c = F(srow, { gap: 6, nofill: true, ai: 'CENTER' });
      const bar = F(c, { w: v, h: 24, rawfill: '#B8410F', radius: 2 });
      T(c, n, 'code', 'text/muted');
    }
    T(sec, 'Radius', 'overline', 'text/muted');
    const rrow = F(sec, { dir: 'HORIZONTAL', gap: 16, nofill: true });
    for (const [n, v] of [['radius/none', 0], ['radius/xs', 2], ['radius/sm', 4], ['radius/md', 6], ['radius/lg', 8]]) {
      const c = F(rrow, { gap: 6, nofill: true, ai: 'CENTER' });
      F(c, { w: 64, h: 40, fill: 'surface/2', radius: v, bstroke: 'border/hairline' });
      T(c, n + ' · ' + v + 'px', 'code', 'text/muted');
    }
    T(sec, 'Surface (light)', 'overline', 'text/muted');
    const brow = F(sec, { dir: 'HORIZONTAL', gap: 16, nofill: true });
    for (const [n, hex] of [['surface/0 · canvas', EXACT.s0], ['surface/1 · base', EXACT.s1], ['surface/2 · raised', EXACT.s2], ['surface/3 · overlay', EXACT.s3]]) {
      const c = F(brow, { gap: 6, nofill: true, ai: 'CENTER' });
      F(c, { w: 120, h: 64, rawfill: hex, radius: 4, bstroke: 'border/hairline' });
      T(c, n, 'code', 'text/muted');
    }
    place(sec, 96);
  }

  // 5. Icons
  {
    const sec = F(page, { gap: 16, nofill: true, name: 'Foundations / Icons' });
    secTitle(sec, 'Icons', '32 linear icons · 16px box · 1.5px stroke · round caps. Icons assist verbs and states, never replace text.');
    buildIconComponents(sec);
    place(sec, 96);
  }

  // 6. Interaction states
  {
    const sec = F(page, { gap: 16, nofill: true, name: 'Foundations / Interaction' });
    secTitle(sec, 'Interaction states', 'Focus, disabled and selected are always multi-signal — never color alone.');
    const row = F(sec, { dir: 'HORIZONTAL', gap: 32, nofill: true, ai: 'CENTER' });
    // focus
    const fc = F(row, { gap: 8, nofill: true, ai: 'CENTER' });
    const fb = F(fc, { dir: 'HORIZONTAL', px: 16, py: 10, radius: 4, fill: 'surface/1', bstroke: 'focus/ring', sw: 2, align: 'OUTSIDE', gap: 8, ai: 'CENTER' });
    T(fb, 'Focus', 'body-md', 'text/default');
    T(fc, 'focus/ring · 2px outside · offset 2px', 'code', 'text/muted');
    // disabled
    const dc = F(row, { gap: 8, nofill: true, ai: 'CENTER' });
    const db = F(dc, { dir: 'HORIZONTAL', px: 16, py: 10, radius: 4, fill: 'disabled/bg', gap: 8, ai: 'CENTER' });
    T(db, 'Disabled', 'body-md', 'disabled/fg');
    T(dc, 'disabled/fg on disabled/bg · not focusable', 'code', 'text/muted');
    // selected
    const sc = F(row, { gap: 8, nofill: true, ai: 'CENTER' });
    const srow2 = F(sc, { dir: 'HORIZONTAL', px: 16, py: 10, fill: 'selected/bg', gap: 8, ai: 'CENTER' });
    F(srow2, { w: 2, h: 20, fill: 'selected/line' });
    T(srow2, 'Selected', 'body-md', 'text/default');
    T(sc, 'selected/bg + 2px line · aria-selected', 'code', 'text/muted');
    place(sec, 96);
  }
}

// ---------------- component set infrastructure ----------------
function buildSet(host, def) {
  const comps = [];
  for (const a of def.variants) for (const b of def.sizes) for (const c of def.states) {
    const comp = figma.createComponent();
    comp.name = (def.vname || 'Variant') + '=' + a + ', Size=' + b + ', State=' + c;
    def.build(comp, { variant: a, size: b, state: c });
    host.appendChild(comp);
    comps.push(comp);
  }
  const set = figma.combineAsVariants(comps, host);
  set.name = def.name;
  layoutSetGrid(set, def.states.length);
  SETS[def.name] = set;
  return set;
}
function layoutSetGrid(set, cols) {
  const kids = set.children;
  let maxW = 0, maxH = 0;
  for (const k of kids) { maxW = Math.max(maxW, k.width); maxH = Math.max(maxH, k.height); }
  const gx = maxW + 40, gy = maxH + 40;
  kids.forEach((k, i) => { k.x = (i % cols) * gx; k.y = Math.floor(i / cols) * gy; });
}
function compSection(page, title, cursor) {
  const f = F(page, { gap: 24, nofill: true, name: 'Components / ' + title });
  secTitle(f, title, '');
  f.x = 0; f.y = cursor.y;
  cursor.y += f.height + 120;
  return f; // height grows as sets are appended; reposition after via fixSections
}
// state helpers
function ring(node, token) {
  node.strokes = [{ type: 'SOLID', color: hx('#000000') }];
  node.setBoundVariable('strokes', VV[token || 'focus/ring']);
  node.strokeWeight = 2;
  node.strokeAlign = 'OUTSIDE';
}
function spinner(parent, size, token) {
  const e = figma.createEllipse();
  e.resize(size, size);
  e.arcData = { startingAngle: 0, endingAngle: 3.8, innerRadius: 0.72 };
  e.strokes = [{ type: 'SOLID', color: hx('#000000') }];
  e.setBoundVariable('strokes', VV[token]);
  e.strokeWeight = Math.max(1.5, size / 8);
  e.strokeCap = 'ROUND';
  e.fills = [];
  parent.appendChild(e);
  return e;
}
function leftLine(row, token) {
  const l = F(row, { w: 2, h: 20, fill: token || 'selected/line', name: 'selected-line' });
  return l;
}

// ---------------- A1 · Button ----------------
const BTN_H = { Small: 36, Medium: 40, Large: 48 };
const BTN_PX = { Small: 12, Medium: 16, Large: 20 };
const BTN_TX = { Small: 'body-sm', Medium: 'body-md', Large: 'body-md' };
function buildButton(c, P) {
  const v = P.variant, s = P.size, st = P.state;
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
  c.itemSpacing = 8;
  c.paddingLeft = BTN_PX[s]; c.paddingRight = BTN_PX[s];
  c.cornerRadius = 4;
  c.minHeight = BTN_H[s];
  const label = v === 'Danger' ? 'Delete 12 ads' : v === 'Primary' ? 'Approve & pause 8' : v === 'Secondary' ? 'View run' : 'Cancel';
  let fillTok = 'action/default', textTok = 'action/on', borderTok = null;
  if (v === 'Secondary') { fillTok = 'surface/1'; textTok = 'text/default'; borderTok = 'border/hairline'; }
  if (v === 'Tertiary') { fillTok = null; textTok = 'text/default'; }
  if (v === 'Danger') { fillTok = 'status/danger/text'; textTok = 'action/on'; }
  if (st === 'Hover') {
    if (v === 'Primary') fillTok = 'action/hover';
    else if (v === 'Danger') fillTok = 'action/active';
    else fillTok = 'surface/2';
  }
  if (st === 'Active') {
    if (v === 'Primary') fillTok = 'action/active';
    else if (v === 'Danger') fillTok = 'status/danger/text';
    else fillTok = 'surface/3';
  }
  if (st === 'Disabled') { fillTok = 'disabled/bg'; textTok = 'disabled/fg'; borderTok = null; }
  if (fillTok) c.setBoundVariable('fills', VV[fillTok]); else c.fills = [];
  if (borderTok && st !== 'Focus') {
    c.strokes = [{ type: 'SOLID', color: hx('#000000') }];
    c.setBoundVariable('strokes', VV[borderTok]);
    c.strokeWeight = 1; c.strokeAlign = 'INSIDE';
  }
  if (st === 'Focus') ring(c, 'focus/ring');
  if (st === 'Loading') spinner(c, 16, textTok);
  T(c, st === 'Loading' ? label + '…' : label, BTN_TX[s], textTok);
}

// ---------------- A2 · Icon button ----------------
function buildIconButton(c, P) {
  const v = P.variant, s = P.size, st = P.state;
  const box = { Small: 36, Medium: 40, Large: 48 }[s];
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'FIXED';
  c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
  c.resize(box, box);
  c.cornerRadius = 4;
  const icon = v === 'Danger' ? 'x' : 'more-horizontal';
  let fillTok = null, iconTok = 'text/default', borderTok = null;
  if (v === 'Secondary') { fillTok = 'surface/1'; borderTok = 'border/hairline'; }
  if (v === 'Danger') iconTok = 'status/danger/text';
  if (st === 'Hover') { fillTok = 'surface/2'; if (v === 'Danger') { fillTok = 'status/danger/bg'; } }
  if (st === 'Active') fillTok = 'surface/3';
  if (st === 'Disabled') { iconTok = 'disabled/fg'; fillTok = 'disabled/bg'; borderTok = null; }
  if (fillTok) c.setBoundVariable('fills', VV[fillTok]); else c.fills = [];
  if (borderTok && st !== 'Focus') {
    c.strokes = [{ type: 'SOLID', color: hx('#000000') }];
    c.setBoundVariable('strokes', VV[borderTok]);
    c.strokeWeight = 1; c.strokeAlign = 'INSIDE';
  }
  if (st === 'Focus') ring(c, 'focus/ring');
  if (st === 'Loading') spinner(c, 16, iconTok); else IC(c, icon, 16, iconTok);
}

// ---------------- A3 · Text input ----------------
const IN_H = { Small: 36, Medium: 40, Large: 48 };
function buildTextInput(c, P) {
  const t = P.variant, s = P.size, st = P.state;
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 6;
  c.layoutSizingHorizontal = 'FIXED';
  c.resize(280, c.height);
  const field = F(c, { dir: 'HORIZONTAL', gap: 8, px: 12, radius: 4, fill: 'surface/1', bstroke: 'border/hairline', ai: 'CENTER', stretch: true, name: 'field' });
  field.minHeight = IN_H[s];
  const samples = { Text: ['Full name', 'Maya Chen'], Email: ['Work email', 'maya@acme.com'], Number: ['Daily budget cap', '42'], Password: ['API key', '••••••••'] };
  const [ph, val] = samples[t];
  const isEmpty = st === 'Empty' || st === 'Disabled';
  const isRO = st === 'Read-only';
  T(field, isEmpty ? ph : val, 'body-md', isEmpty ? (st === 'Disabled' ? 'disabled/fg' : 'text/muted') : 'text/default');
  if (st === 'Hover') { field.strokes = [{ type: 'SOLID', color: hx('#000') }]; field.setBoundVariable('strokes', VV['border/strong']); }
  if (st === 'Focus') ring(field, 'focus/ring');
  if (st === 'Error') {
    field.strokes = [{ type: 'SOLID', color: hx('#000') }]; field.setBoundVariable('strokes', VV['status/danger/text']);
    T(c, 'Enter a valid ' + ph.toLowerCase() + '.', 'caption', 'status/danger/text');
  }
  if (st === 'Disabled') field.setBoundVariable('fills', VV['disabled/bg']);
  if (isRO) field.setBoundVariable('fills', VV['surface/2']);
  if (st === 'Loading') { field.fills = []; field.setBoundVariable('fills', VV['surface/2']); spinner(field, 16, 'text/muted'); }
}

// ---------------- A4 · Textarea ----------------
function buildTextarea(c, P) {
  const b = P.variant, s = P.size, st = P.state;
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 6;
  c.layoutSizingHorizontal = 'FIXED';
  c.resize(320, c.height);
  const area = F(c, { gap: 4, px: 12, py: 10, radius: 4, fill: 'surface/1', bstroke: 'border/hairline', stretch: true, name: 'area' });
  if (s === 'Medium') { area.layoutSizingVertical = 'FIXED'; area.resize(area.width, 96); }
  else { area.layoutSizingVertical = 'FIXED'; area.resize(area.width, 128); }
  const body = 'CPA stayed 36% above the $42 target for 48 hours. 17 conversions are delayed by reporting lag.';
  if (st === 'Empty') T(area, 'Rejection reason — required for audit log…', 'body-md', 'text/muted');
  else T(area, b === 'Auto-grow' && st !== 'Empty' ? body + ' Review before rejecting.' : body, 'body-md', st === 'Disabled' ? 'disabled/fg' : 'text/default');
  if (st === 'Focus') ring(area, 'focus/ring');
  if (st === 'Error') {
    area.strokes = [{ type: 'SOLID', color: hx('#000') }]; area.setBoundVariable('strokes', VV['status/danger/text']);
    T(c, 'A reason is required before rejecting.', 'caption', 'status/danger/text');
  }
  if (st === 'Disabled') area.setBoundVariable('fills', VV['disabled/bg']);
  if (st === 'Read-only') area.setBoundVariable('fills', VV['surface/2']);
}

// ---------------- A5 · Status label ----------------
const SL_TONE = {
  Neutral: ['text/muted', 'border/hairline', null, 'Draft'],
  Info: ['status/info/text', 'status/info/text', 'status/info/bg', 'Scheduled'],
  Success: ['status/success/text', 'status/success/text', 'status/success/bg', 'Approved'],
  Warning: ['status/warning/text', 'status/warning/text', 'status/warning/bg', 'Paused'],
  Danger: ['status/danger/text', 'status/danger/text', 'status/danger/bg', 'Failed']
};
function buildStatusLabel(c, P) {
  const v = P.variant, s = P.size, st = P.state;
  const [textTok, lineTok, bgTok, label] = SL_TONE[v];
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
  c.itemSpacing = 6;
  c.paddingLeft = s === 'Small' ? 8 : 10; c.paddingRight = s === 'Small' ? 8 : 10;
  c.paddingTop = s === 'Small' ? 4 : 6; c.paddingBottom = s === 'Small' ? 4 : 6;
  c.cornerRadius = 2;
  const dis = st === 'Disabled';
  const strong = st === 'Strong';
  if (strong && bgTok) c.setBoundVariable('fills', VV[bgTok]); else c.fills = [];
  c.strokes = [{ type: 'SOLID', color: hx('#000') }];
  c.setBoundVariable('strokes', VV[dis ? 'disabled/fg' : lineTok]);
  c.strokeWeight = 1; c.strokeAlign = 'INSIDE';
  T(c, label, s === 'Small' ? 'caption' : 'body-sm', dis ? 'disabled/fg' : textTok);
}

// ---------------- A6 · Confidence ----------------
const CONF = {
  Low: ['status/danger/text', 24, 'Low confidence'],
  Medium: ['status/warning/text', 62, 'Medium confidence'],
  High: ['status/success/text', 91, 'High confidence'],
  Unknown: ['text/muted', 0, 'Confidence unknown']
};
function buildConfidence(c, P) {
  const v = P.variant, s = P.size, st = P.state;
  const [tok, pct, label] = CONF[v];
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
  c.itemSpacing = 8;
  const track = F(c, { w: 64, h: 4, fill: 'surface/2', radius: 999, name: 'track' });
  if (st === 'Default') {
    if (pct > 0) F(track, { w: Math.round(64 * pct / 100), h: 4, fill: tok, radius: 999, name: 'fill' });
    T(c, pct + '% · ' + label, s === 'Small' ? 'caption' : 'body-sm', tok);
  } else if (st === 'Loading') {
    F(track, { w: 32, h: 4, rawfill: '#CFCFC8', radius: 999 });
    T(c, '— · Scoring evidence…', s === 'Small' ? 'caption' : 'body-sm', 'text/muted');
  } else {
    T(c, 'Confidence unavailable', s === 'Small' ? 'caption' : 'body-sm', 'text/muted');
  }
}

// ---------------- A7 · Actor row ----------------
const ACTORS = {
  Agent: ['cpu', 'Optimization agent', 'requested 09:42'],
  User: ['user', 'Maya Chen', 'approved 09:47'],
  System: ['terminal', 'Run scheduler', 'queued 09:40'],
  Team: ['users', 'Growth team', 'owns this workspace']
};
function buildActorRow(c, P) {
  const v = P.variant, s = P.size, st = P.state;
  const [icon, name, meta] = ACTORS[v];
  const dis = st === 'Disabled';
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
  c.itemSpacing = 8;
  c.paddingLeft = 12; c.paddingRight = 12;
  c.paddingTop = s === 'Compact' ? 6 : 10; c.paddingBottom = s === 'Compact' ? 6 : 10;
  if (st === 'Selected') { c.setBoundVariable('fills', VV['selected/bg']); leftLine(c, 'selected/line'); }
  IC(c, icon, 16, dis ? 'disabled/fg' : 'text/muted');
  T(c, name, s === 'Compact' ? 'body-sm' : 'body-md', dis ? 'disabled/fg' : 'text/default');
  const sp = F(c, { w: 24, nofill: true }); sp.layoutSizingHorizontal = 'FIXED';
  T(c, meta, 'caption', 'text/muted');
}

// ---------------- A8 · Key-value row ----------------
const KV = {
  Text: ['Campaign operations', 'text/default'],
  Number: ['8', 'text/default'],
  Currency: ['$4,820 / day', 'text/default'],
  Date: ['Oct 6, 2026 09:42', 'text/default'],
  Link: ['View run', 'action/default']
};
function buildKeyValueRow(c, P) {
  const v = P.variant, s = P.size, st = P.state;
  const [val, tok] = KV[v];
  const dis = st === 'Disabled';
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
  c.itemSpacing = 16;
  c.paddingLeft = 12; c.paddingRight = 12;
  c.paddingTop = s === 'Compact' ? 6 : 10; c.paddingBottom = s === 'Compact' ? 6 : 10;
  const lab = F(c, { w: 160, nofill: true }); lab.layoutSizingHorizontal = 'FIXED';
  T(lab, 'Budget affected', s === 'Compact' ? 'body-sm' : 'body-md', dis ? 'disabled/fg' : 'text/muted');
  if (st === 'Warning') IC(c, 'alert-triangle', 16, 'status/warning/text');
  if (st === 'Changed') {
    const dot = F(c, { w: 6, h: 6, rawfill: '#B8410F', radius: 999 });
  }
  T(c, v === 'Link' && !dis ? val : val, s === 'Compact' ? 'body-sm' : 'body-md', dis ? 'disabled/fg' : (st === 'Warning' ? 'status/warning/text' : tok));
  if (st === 'Changed') T(c, 'updated 2m ago', 'caption', 'text/muted');
}

// ---------------- A9 · Event row ----------------
const EV_TONE = {
  Info: ['status/info/text', 'OK'],
  Success: ['status/success/text', 'REVERSIBLE'],
  Warning: ['status/warning/text', 'REVIEW'],
  Error: ['status/danger/text', 'FAILED'],
  System: ['text/muted', 'PAUSED']
};
function buildEventRow(c, P) {
  const v = P.variant, s = P.size, st = P.state;
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 4;
  const row = F(c, { dir: 'HORIZONTAL', gap: 12, px: 12, stretch: true, ai: 'CENTER', name: 'row' });
  row.paddingTop = s === 'Compact' ? 6 : 8; row.paddingBottom = s === 'Compact' ? 6 : 8;
  if (st === 'Hover') row.setBoundVariable('fills', VV['surface/1']);
  if (st === 'Selected') { row.setBoundVariable('fills', VV['selected/bg']); leftLine(row, 'selected/line'); }
  if (v === 'Narration') {
    // Human-readable execution narration (ChatGPT Agent / Operator pattern):
    // plain-language progress for non-technical supervisors, evidence underneath.
    IC(row, 'activity', 16, 'text/muted');
    T(row, 'Pausing 4 ad sets — CPA has been 36% above the $42 target for 48 hours.', s === 'Compact' ? 'body-sm' : 'body-md', 'text/default');
    const sp = F(row, { nofill: true }); sp.layoutSizingHorizontal = 'FILL';
    T(row, 'NARRATION', 'caption', 'text/muted');
    return;
  }
  if (v === 'Subagent') {
    // Collapsible subagent summary line (Claude Code pattern): summary + "Tab to expand".
    IC(row, 'cpu', 16, 'text/muted');
    T(row, 'Subagent · research', s === 'Compact' ? 'body-sm' : 'body-md', 'text/default');
    T(row, '3 tools · 12s', s === 'Compact' ? 'body-sm' : 'body-md', 'text/muted');
    const sp = F(row, { nofill: true }); sp.layoutSizingHorizontal = 'FILL';
    T(row, 'Tab to expand', 'caption', 'text/muted');
    if (st === 'Expanded') {
      const det = F(c, { gap: 2, px: 12, stretch: true, name: 'subagent-detail' });
      det.paddingLeft = 40;
      T(det, 'read 12 files · OK', 'caption', 'text/muted');
      T(det, 'grep pricing logic · OK', 'caption', 'text/muted');
      T(det, 'summary: shared-budget group found in 4 campaigns', 'caption', 'text/muted');
    }
    return;
  }
  const [tok, result] = EV_TONE[v];
  T(row, '09:47:12', 'code', 'text/muted');
  T(row, '02/08', 'code', 'text/muted');
  T(row, 'Paused', s === 'Compact' ? 'body-sm' : 'body-md', 'text/default');
  T(row, 'ad_set_184 · spend $610/day', s === 'Compact' ? 'body-sm' : 'body-md', 'text/muted');
  const sp = F(row, { nofill: true }); sp.layoutSizingHorizontal = 'FILL';
  T(row, result, 'caption', tok);
  if (st === 'Expanded') {
    const det = F(c, { dir: 'HORIZONTAL', gap: 8, px: 12, stretch: true, name: 'detail' });
    det.paddingLeft = 108;
    T(det, 'Scope locked · reversible for 24 hours · no external calls made.', 'caption', 'text/muted');
  }
}

// ---------------- A10 · Alert strip ----------------
const AL_TONE = {
  Info: ['status/info/text', 'status/info/bg', 'info', 'Conversion reporting is delayed by up to 3 hours.'],
  Success: ['status/success/text', 'status/success/bg', 'check', '4 changes applied. All reversible for 24 hours.'],
  Warning: ['status/warning/text', 'status/warning/bg', 'alert-triangle', 'Pausing the group also affects 4 healthy campaigns.'],
  Danger: ['status/danger/text', 'status/danger/bg', 'shield-alert', 'You lack permission to stop production runs.']
};
function buildAlertStrip(c, P) {
  const v = P.variant, s = P.size, st = P.state;
  const [tok, bg, icon, msg] = AL_TONE[v];
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
  c.itemSpacing = 12;
  c.paddingLeft = 12; c.paddingRight = 12;
  c.paddingTop = s === 'Compact' ? 8 : 12; c.paddingBottom = s === 'Compact' ? 8 : 12;
  c.cornerRadius = 4;
  c.setBoundVariable('fills', VV[bg]);
  IC(c, icon, 16, tok);
  T(c, msg, s === 'Compact' ? 'body-sm' : 'body-md', tok);
  if (st === 'With-action' || st === 'Dismissible') {
    const sp = F(c, { nofill: true }); sp.layoutSizingHorizontal = 'FILL';
  }
  if (st === 'With-action') T(c, 'Review scope', 'body-md', tok);
  if (st === 'Dismissible') IC(c, 'x', 16, tok);
}

// ---------------- A11 · Toggle ----------------
function buildToggle(c, P) {
  const left = P.variant === 'Label-left';
  const s = P.size, st = P.state;
  const on = st === 'On' || st === 'Hover' && false;
  const isOn = st === 'On';
  const dis = st === 'Disabled';
  const tw = s === 'Small' ? 32 : 40, th = s === 'Small' ? 18 : 22, kw = s === 'Small' ? 14 : 18;
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
  c.itemSpacing = 12;
  const label = T(c, 'Auto-approve low-risk steps', s === 'Small' ? 'body-sm' : 'body-md', dis ? 'disabled/fg' : 'text/default');
  const track = F(c, { w: tw, h: th, radius: 999, name: 'track' });
  track.layoutSizingHorizontal = 'FIXED'; track.layoutSizingVertical = 'FIXED';
  track.setBoundVariable('fills', VV[dis ? 'disabled/bg' : isOn ? 'action/default' : 'surface/3']);
  const knob = F(track, { w: kw, h: kw, rawfill: '#FFFFFF', radius: 999, name: 'knob' });
  knob.layoutSizingHorizontal = 'FIXED'; knob.layoutSizingVertical = 'FIXED';
  knob.x = isOn ? tw - kw - 2 : 2; knob.y = (th - kw) / 2;
  knob.layoutPositioning = 'ABSOLUTE';
  if (st === 'Hover' && !isOn) track.setBoundVariable('fills', VV['surface/2']);
  if (st === 'Focus') ring(track, 'focus/ring');
  if (!left) { c.insertChild(0, track); c.insertChild(1, label); }
  void on;
}

// ---------------- A12 · Checkbox ----------------
function buildCheckbox(c, P) {
  const desc = P.variant === 'Description';
  const s = P.size, st = P.state;
  const box = s === 'Small' ? 16 : 18;
  const checked = st === 'Checked' || st === 'Hover';
  const dis = st === 'Disabled';
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.counterAxisAlignItems = desc ? 'MIN' : 'CENTER';
  c.itemSpacing = 10;
  const b = F(c, { w: box, h: box, radius: 4, name: 'box', ai: 'CENTER' });
  b.layoutSizingHorizontal = 'FIXED'; b.layoutSizingVertical = 'FIXED';
  b.primaryAxisAlignItems = 'CENTER';
  if (checked && !dis) b.setBoundVariable('fills', VV['action/default']);
  else { b.setBoundVariable('fills', VV['surface/1']); b.strokes = [{ type: 'SOLID', color: hx('#000') }]; b.setBoundVariable('strokes', VV[st === 'Error' ? 'status/danger/text' : 'border/strong']); b.strokeWeight = 1; b.strokeAlign = 'INSIDE'; }
  if (dis) { b.fills = []; b.setBoundVariable('fills', VV['disabled/bg']); }
  if (st === 'Focus') ring(b, 'focus/ring');
  if (st === 'Hover' && !checked) { b.strokes = [{ type: 'SOLID', color: hx('#000') }]; b.setBoundVariable('strokes', VV['border/strong']); }
  if (checked) {
    if (st === 'Mixed') { F(b, { w: 8, h: 2, rawfill: '#FFFFFF', radius: 1 }); }
    else IC(b, 'check', 12, 'action/on');
  }
  const tx = F(c, { gap: 2, nofill: true });
  T(tx, 'Include shared-budget campaigns', s === 'Small' ? 'body-sm' : 'body-md', dis ? 'disabled/fg' : 'text/default');
  if (desc) T(tx, 'Runs paused here also affect 4 healthy campaigns.', 'caption', 'text/muted');
  if (st === 'Error') T(tx, 'Select at least one scope.', 'caption', 'status/danger/text');
}

// ---------------- A13 · Radio ----------------
function buildRadio(c, P) {
  const desc = P.variant === 'Description';
  const s = P.size, st = P.state;
  const box = s === 'Small' ? 16 : 18;
  const checked = st === 'Checked' || st === 'Hover';
  const dis = st === 'Disabled';
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.counterAxisAlignItems = desc ? 'MIN' : 'CENTER';
  c.itemSpacing = 10;
  const b = figma.createEllipse();
  b.resize(box, box);
  b.fills = [];
  b.setBoundVariable('fills', VV[dis ? 'disabled/bg' : checked ? 'action/on' : 'surface/1']);
  b.strokes = [{ type: 'SOLID', color: hx('#000') }];
  b.setBoundVariable('strokes', VV[dis ? 'disabled/fg' : st === 'Error' ? 'status/danger/text' : checked ? 'action/default' : 'border/strong']);
  b.strokeWeight = checked && !dis ? 5 : 1;
  c.appendChild(b);
  if (st === 'Focus') ring(b, 'focus/ring');
  const tx = F(c, { gap: 2, nofill: true });
  T(tx, 'Pause group and notify owner', s === 'Small' ? 'body-sm' : 'body-md', dis ? 'disabled/fg' : 'text/default');
  if (desc) T(tx, 'Recommended when 4+ healthy campaigns share the budget.', 'caption', 'text/muted');
  if (st === 'Error') T(tx, 'Choose one recovery path.', 'caption', 'status/danger/text');
}

// ---------------- A14 · Select ----------------
function buildSelect(c, P) {
  const multi = P.variant === 'Multi';
  const s = P.size, st = P.state;
  const dis = st === 'Disabled';
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 0;
  c.layoutSizingHorizontal = 'FIXED';
  c.resize(240, c.height);
  const field = F(c, { dir: 'HORIZONTAL', gap: 8, px: 12, radius: 4, fill: 'surface/1', bstroke: 'border/hairline', ai: 'CENTER', stretch: true, name: 'field' });
  field.minHeight = IN_H[s];
  const empty = st === 'Empty' || dis;
  T(field, empty ? 'Select status…' : multi ? '2 selected' : 'Paused', 'body-md', empty ? (dis ? 'disabled/fg' : 'text/muted') : 'text/default');
  const sp = F(field, { nofill: true }); sp.layoutSizingHorizontal = 'FILL';
  if (st === 'Loading') spinner(field, 14, 'text/muted'); else IC(field, 'chevron-down', 16, dis ? 'disabled/fg' : 'text/muted');
  if (st === 'Focus' || st === 'Open') ring(field, 'focus/ring');
  if (st === 'Error') { field.strokes = [{ type: 'SOLID', color: hx('#000') }]; field.setBoundVariable('strokes', VV['status/danger/text']); }
  if (dis) field.setBoundVariable('fills', VV['disabled/bg']);
  if (st === 'Open') {
    const menu = F(c, { gap: 2, px: 6, py: 6, radius: 4, fill: 'surface/3', bstroke: 'border/hairline', stretch: true, name: 'menu' });
    menu.layoutPositioning = 'ABSOLUTE';
    menu.y = IN_H[s] + 4; menu.x = 0;
    menu.layoutSizingHorizontal = 'FIXED'; menu.resize(240, menu.height);
    for (const [opt, sel] of [['Paused', true], ['Failed', false], ['Done', false]]) {
      const o = F(menu, { dir: 'HORIZONTAL', gap: 8, px: 8, py: 8, radius: 4, stretch: true, ai: 'CENTER' });
      if (sel) o.setBoundVariable('fills', VV['surface/2']);
      T(o, opt, 'body-md', 'text/default');
      if (sel) { const s2 = F(o, { nofill: true }); s2.layoutSizingHorizontal = 'FILL'; IC(o, 'check', 14, 'text/default'); }
    }
    c.clipsContent = false; menu.clipsContent = false;
  }
  if (st === 'Error') T(c, 'Select a status to continue.', 'caption', 'status/danger/text');
}

// ---------------- B1 · Search ----------------
function buildSearch(c, P) {
  const ctx = P.variant, s = P.size, st = P.state;
  const dis = st === 'Disabled';
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 0;
  c.layoutSizingHorizontal = 'FIXED';
  c.resize(ctx === 'Command' ? 480 : 320, c.height);
  const field = F(c, { dir: 'HORIZONTAL', gap: 8, px: 12, radius: 4, fill: 'surface/1', bstroke: 'border/hairline', ai: 'CENTER', stretch: true, name: 'field' });
  field.minHeight = IN_H[s];
  IC(field, 'search', 16, dis ? 'disabled/fg' : 'text/muted');
  const empty = st === 'Empty' || dis;
  T(field, empty ? (ctx === 'Table' ? 'Search runs, actors, IDs' : ctx === 'Command' ? 'Type a command or search…' : 'Search…') : st === 'Typing' ? 'paus' : 'paused', 'body-md', empty ? (dis ? 'disabled/fg' : 'text/muted') : 'text/default');
  const sp = F(field, { nofill: true }); sp.layoutSizingHorizontal = 'FILL';
  if (ctx === 'Command' && !dis) {
    const k = F(field, { px: 6, py: 2, radius: 4, fill: 'surface/2', bstroke: 'border/hairline' });
    T(k, '⌘K', 'caption', 'text/muted');
  }
  if (st === 'Loading') spinner(field, 14, 'text/muted');
  if (dis) field.setBoundVariable('fills', VV['disabled/bg']);
  if (st === 'Results' || st === 'No-results') {
    const menu = F(c, { gap: 2, px: 6, py: 6, radius: 4, fill: 'surface/3', bstroke: 'border/hairline', stretch: true, name: 'menu' });
    menu.layoutPositioning = 'ABSOLUTE'; menu.y = IN_H[s] + 4; menu.x = 0;
    menu.layoutSizingHorizontal = 'FIXED'; menu.resize(ctx === 'Command' ? 480 : 320, menu.height);
    c.clipsContent = false;
    if (st === 'Results') {
      for (const [t1, t2] of [['Pause underperforming ads', 'run_2841 · Paused'], ['Pause low-CTR creatives', 'run_2790 · Done']]) {
        const o = F(menu, { gap: 4, px: 8, py: 8, stretch: true });
        T(o, t1, 'body-md', 'text/default'); T(o, t2, 'caption', 'text/muted');
      }
    } else {
      const o = F(menu, { gap: 4, px: 8, py: 12, stretch: true, ai: 'CENTER' });
      T(o, 'No runs match "paus".', 'body-md', 'text/default');
      T(o, 'Clear filters to view 12 other runs.', 'caption', 'text/muted');
    }
  }
}

// ---------------- B2 · Table ----------------
const T_ROWS = [
  ['Pause underperforming ads', 'run_2841', 'Maya', 'Warning', 'Paused', '2m', true],
  ['Restore budget rules', 'run_2838', 'Alex', 'Danger', 'Failed', '18m', false],
  ['Archive expired drafts', 'run_2829', 'Agent', 'Success', 'Done', '1h', false]
];
function tcell(parent, w, fixed) {
  const f = F(parent, { dir: 'VERTICAL', gap: 2, px: 12, nofill: true, name: 'cell' });
  if (w > 0) { f.layoutSizingHorizontal = 'FIXED'; f.resize(w, f.height); }
  else { f.layoutSizingHorizontal = 'FILL'; }
  f.counterAxisAlignItems = 'MIN';
  return f;
}
function buildTable(c, P) {
  const v = P.variant, s = P.size, st = P.state;
  const compact = s === 'Compact';
  const sel = v === 'Selectable', sort = v === 'Sortable', exp = v === 'Expandable';
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 0;
  c.layoutSizingHorizontal = 'FIXED';
  c.resize(880, c.height);
  c.cornerRadius = 4;
  c.setBoundVariable('fills', VV['surface/1']);
  c.strokes = [{ type: 'SOLID', color: hx('#000') }];
  c.setBoundVariable('strokes', VV['border/hairline']);
  c.strokeWeight = 1; c.strokeAlign = 'INSIDE';
  const py = compact ? 8 : 12;
  // header
  const head = F(c, { dir: 'HORIZONTAL', gap: 0, stretch: true, fill: 'surface/2', name: 'header' });
  head.paddingTop = py; head.paddingBottom = py; head.counterAxisAlignItems = 'CENTER';
  if (sel) { const cc = tcell(head, 44); const bx = F(cc, { w: 16, h: 16, radius: 4, fill: 'action/default', ai: 'CENTER' }); bx.layoutSizingHorizontal = 'FIXED'; bx.layoutSizingVertical = 'FIXED'; F(bx, { w: 8, h: 2, rawfill: '#FFFFFF', radius: 1 }); }
  const h1 = tcell(head, 0); h1.layoutSizingHorizontal = 'FILL';
  T(h1, 'Run / action', 'overline', 'text/muted');
  const h2 = tcell(head, 120); T(h2, 'Owner', 'overline', 'text/muted');
  const h3 = tcell(head, 150);
  const hs = F(h3, { dir: 'HORIZONTAL', gap: 4, nofill: true, ai: 'CENTER' });
  T(hs, 'Status', 'overline', 'text/muted');
  if (sort) IC(hs, 'sort-desc', 12, 'text/muted');
  const h4 = tcell(head, 110);
  const hs2 = F(h4, { dir: 'HORIZONTAL', gap: 4, nofill: true, ai: 'CENTER' });
  T(hs2, 'Updated', 'overline', 'text/muted');
  if (sort) IC(hs2, 'sort-desc', 12, 'text/muted');
  if (exp) tcell(head, 40);
  HR(c, 'border/hairline');

  function statusMini(parent, tone, label) {
    const m = { Warning: 'status/warning/text', Danger: 'status/danger/text', Success: 'status/success/text' }[tone];
    const l = F(parent, { dir: 'HORIZONTAL', gap: 6, px: 8, py: 4, radius: 2, ai: 'CENTER' });
    l.strokes = [{ type: 'SOLID', color: hx('#000') }]; l.setBoundVariable('strokes', VV[m]);
    l.strokeWeight = 1; l.strokeAlign = 'INSIDE';
    T(l, label, 'caption', m);
  }
  function dataRow(r, selected) {
    const row = F(c, { dir: 'HORIZONTAL', gap: 0, stretch: true, name: 'row' });
    row.paddingTop = py; row.paddingBottom = py; row.counterAxisAlignItems = 'CENTER';
    if (selected) { row.setBoundVariable('fills', VV['selected/bg']); }
    if (sel) { const cc = tcell(row, 44); const bx = F(cc, { w: 16, h: 16, radius: 4, name: 'cbx', ai: 'CENTER' }); bx.layoutSizingHorizontal = 'FIXED'; bx.layoutSizingVertical = 'FIXED'; if (selected) { bx.setBoundVariable('fills', VV['action/default']); IC(bx, 'check', 12, 'action/on'); } else { bx.setBoundVariable('fills', VV['surface/1']); bx.strokes = [{ type: 'SOLID', color: hx('#000') }]; bx.setBoundVariable('strokes', VV['border/strong']); bx.strokeWeight = 1; bx.strokeAlign = 'INSIDE'; } }
    const c1 = tcell(row, 0); c1.layoutSizingHorizontal = 'FILL';
    T(c1, r[0], 'body-md', 'text/default'); T(c1, r[1], 'code', 'text/muted');
    const c2 = tcell(row, 120); T(c2, r[2], 'body-md', 'text/default');
    const c3 = tcell(row, 150); statusMini(c3, r[3], r[4]);
    const c4 = tcell(row, 110); T(c4, r[5], 'body-md', 'text/muted');
    if (exp) { const c5 = tcell(row, 40); IC(c5, 'chevron-down', 14, 'text/muted'); }
    return row;
  }

  if (st === 'Loading') {
    for (let i = 0; i < 3; i++) {
      const r = F(c, { dir: 'HORIZONTAL', gap: 12, px: 12, stretch: true, ai: 'CENTER' });
      r.paddingTop = py + 4; r.paddingBottom = py + 4;
      F(r, { w: 180, h: 12, fill: 'surface/3', radius: 2 });
      F(r, { w: 80, h: 12, fill: 'surface/3', radius: 2 });
      const sp = F(r, { nofill: true }); sp.layoutSizingHorizontal = 'FILL';
      F(r, { w: 60, h: 12, fill: 'surface/3', radius: 2 });
      if (i < 2) HR(c, 'border/hairline');
    }
  } else if (st === 'Populated') {
    T_ROWS.forEach((r, i) => { dataRow(r, i === 0); if (i < 2) HR(c, 'border/hairline'); });
  } else if (st === 'Empty') {
    const e = F(c, { gap: 8, px: 24, stretch: true, ai: 'CENTER', name: 'empty' });
    e.paddingTop = 40; e.paddingBottom = 40;
    T(e, '0', 'display', 'text/muted');
    T(e, 'No runs match these filters', 'h4', 'text/default');
    T(e, 'Clear 2 filters to view 12 other runs.', 'body-md', 'text/muted');
  } else if (st === 'Error') {
    const e = F(c, { gap: 8, px: 24, stretch: true, ai: 'CENTER' });
    e.paddingTop = 32; e.paddingBottom = 32;
    const a = F(e, { dir: 'HORIZONTAL', gap: 12, px: 12, py: 12, radius: 4, fill: 'status/danger/bg', ai: 'CENTER' });
    IC(a, 'shield-alert', 16, 'status/danger/text');
    T(a, 'Runs failed to load. Retry to refresh this view.', 'body-md', 'status/danger/text');
  } else if (st === 'Offline') {
    const n = F(c, { dir: 'HORIZONTAL', gap: 8, px: 12, py: 8, stretch: true, fill: 'status/warning/bg', ai: 'CENTER' });
    IC(n, 'alert-triangle', 14, 'status/warning/text');
    T(n, 'Updates stopped at 09:48 — showing 12 cached rows.', 'caption', 'status/warning/text');
    T_ROWS.forEach((r, i) => { dataRow(r, false); if (i < 2) HR(c, 'border/hairline'); });
  }
  // footer
  HR(c, 'border/hairline');
  const ft = F(c, { dir: 'HORIZONTAL', gap: 8, px: 12, stretch: true, ai: 'CENTER' });
  ft.paddingTop = 10; ft.paddingBottom = 10;
  T(ft, '3 of 12 runs', 'caption', 'text/muted');
  const sp = F(ft, { nofill: true }); sp.layoutSizingHorizontal = 'FILL';
  T(ft, '‹  1 of 4  ›', 'caption', 'text/muted');
}

// ---------------- B3 · Toast ----------------
const TOAST = {
  Info: ['status/info/text', 'status/info/bg', 'info'],
  Success: ['status/success/text', 'status/success/bg', 'check'],
  Warning: ['status/warning/text', 'status/warning/bg', 'alert-triangle'],
  Danger: ['status/danger/text', 'status/danger/bg', 'shield-alert']
};
function buildToast(c, P) {
  const v = P.variant, st = P.state;
  const [tok, bg, icon] = TOAST[v];
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
  c.itemSpacing = 12;
  c.paddingLeft = 16; c.paddingRight = 12; c.paddingTop = 12; c.paddingBottom = 12;
  c.cornerRadius = 4;
  c.setBoundVariable('fills', VV[bg]);
  c.strokes = [{ type: 'SOLID', color: hx('#000') }]; c.setBoundVariable('strokes', VV[tok]);
  c.strokeWeight = 1; c.strokeAlign = 'INSIDE';
  IC(c, icon, 16, tok);
  const msg = st === 'Timed' ? '4 ad sets paused. Undo (10s)' : st === 'With-action' ? '4 ad sets paused.' : st === 'Dismissing' ? '4 ad sets paused.' : '4 ad sets paused. All reversible for 24 hours.';
  T(c, msg, 'body-md', tok);
  if (st === 'With-action' || st === 'Timed') T(c, 'Undo', 'body-md', tok);
  if (st === 'Persistent' || st === 'Dismissing') IC(c, 'x', 14, tok);
  if (st === 'Dismissing') c.opacity = 0.5;
}

// ---------------- B4 · Tooltip ----------------
function buildTooltip(c, P) {
  const p = P.variant, s = P.size, st = P.state;
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 0;
  c.clipsContent = false;
  const trig = F(c, { dir: 'HORIZONTAL', px: 12, py: 8, radius: 4, gap: 6, ai: 'CENTER', name: 'trigger' });
  trig.strokes = [{ type: 'SOLID', color: hx('#000') }]; trig.setBoundVariable('strokes', VV['border/strong']);
  trig.strokeWeight = 1; trig.strokeAlign = 'INSIDE'; trig.dashPattern = [4, 4];
  T(trig, 'hover target', 'caption', 'text/muted');
  if (st === 'Hidden') return;
  const bub = F(c, { px: s === 'Small' ? 8 : 12, py: s === 'Small' ? 6 : 8, radius: 4, rawfill: '#191C1B', name: 'bubble' });
  bub.layoutPositioning = 'ABSOLUTE';
  T(bub, 'Pause stops future steps. Completed work is kept.', s === 'Small' ? 'caption' : 'body-sm', null);
  bub.children[0].fills = [{ type: 'SOLID', color: hx('#FFFFFF') }];
  const caret = F(c, { w: 8, h: 8, rawfill: '#191C1B', name: 'caret' });
  caret.layoutPositioning = 'ABSOLUTE';
  caret.rotation = 45;
  const tw = 190, th = 40;
  if (p === 'Top') { bub.x = -60; bub.y = -th - 14; caret.x = 34; caret.y = -12; }
  if (p === 'Bottom') { bub.x = -60; bub.y = 44; caret.x = 34; caret.y = 40; }
  if (p === 'Left') { bub.x = -tw - 14; bub.y = -4; caret.x = -12; caret.y = 10; }
  if (p === 'Right') { bub.x = 108; bub.y = -4; caret.x = 104; caret.y = 10; }
}

// ---------------- B5 · Tabs ----------------
function buildTabs(c, P) {
  const style = P.variant, s = P.size, st = P.state;
  const dis = st === 'Disabled';
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = style === 'Contained' ? 4 : 24;
  c.counterAxisAlignItems = 'CENTER';
  if (style === 'Contained') { c.setBoundVariable('fills', VV['surface/2']); c.cornerRadius = 6; c.paddingTop = 4; c.paddingBottom = 4; c.paddingLeft = 4; c.paddingRight = 4; }
  const tabs = ['Runs', 'Approvals', 'Activity'];
  tabs.forEach((t, i) => {
    const sel = (st === 'Selected' && i === 1) || (st !== 'Selected' && i === 0 && (st === 'Default' || st === 'Hover' || st === 'Focus'));
    const tb = F(c, { px: s === 'Small' ? 8 : 12, py: s === 'Small' ? 6 : 8, radius: style === 'Contained' ? 4 : 0, name: 'tab' });
    if (style === 'Contained' && sel) tb.setBoundVariable('fills', VV['surface/0']);
    if (st === 'Focus' && i === 1) ring(tb, 'focus/ring');
    if (st === 'Hover' && i === 1 && !sel) tb.setBoundVariable('fills', VV['surface/1']);
    T(tb, t + (t === 'Approvals' ? '  3' : ''), s === 'Small' ? 'body-sm' : 'body-md', dis ? 'disabled/fg' : sel ? 'text/default' : 'text/muted');
    if (style === 'Underline' && sel) {
      const u = F(tb, { h: 2, stretch: true, fill: 'action/default', name: 'underline' });
      u.layoutPositioning = 'ABSOLUTE'; u.y = tb.height + 2; u.x = 0;
      tb.clipsContent = false;
    }
  });
}

// ---------------- B6 · Progress ----------------
function buildProgress(c, P) {
  const m = P.variant, s = P.size, st = P.state;
  const h = s === 'Small' ? 4 : 6;
  const tok = st === 'Success' ? 'status/success/text' : st === 'Error' ? 'status/danger/text' : st === 'Paused' ? 'text/muted' : 'action/default';
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
  c.itemSpacing = 12;
  if (m === 'Segmented') {
    const segs = F(c, { dir: 'HORIZONTAL', gap: 4, nofill: true });
    for (let i = 0; i < 8; i++) F(segs, { w: 24, h: h, radius: 999, fill: i < 5 ? tok : 'surface/2' });
  } else {
    const track = F(c, { w: 200, h: h, fill: 'surface/2', radius: 999 });
    track.layoutSizingHorizontal = 'FIXED';
    const fw = m === 'Determinate' ? 124 : 64;
    const fl = F(track, { w: fw, h: h, fill: tok, radius: 999 });
    fl.layoutPositioning = 'ABSOLUTE'; fl.x = m === 'Determinate' ? 0 : 40; fl.y = 0;
  }
  T(c, m === 'Determinate' ? '62%' : st === 'Paused' ? 'Paused at 06/08' : st === 'Error' ? 'Failed at step 06' : 'Working…', 'caption', 'text/muted');
}

// ---------------- B7 · Skeleton ----------------
function sk(parent, w, h) {
  const b = F(parent, { w: w, h: h, fill: 'surface/3', radius: 4 });
  b.layoutSizingHorizontal = w === 0 ? 'STRETCH' : 'FIXED';
  return b;
}
function buildSkeleton(c, P) {
  const v = P.variant, s = P.size, st = P.state;
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 8;
  c.layoutSizingHorizontal = 'FIXED';
  const W = { Small: 200, Medium: 320, Large: 480 }[s];
  c.resize(W, c.height);
  if (st === 'Reduced-motion') T(c, 'Content is loading.', 'caption', 'text/muted');
  if (v === 'Text') { sk(c, W, 12); sk(c, Math.round(W * 0.7), 12); sk(c, Math.round(W * 0.85), 12); }
  if (v === 'Row') {
    for (let i = 0; i < 3; i++) {
      const r = F(c, { dir: 'HORIZONTAL', gap: 12, stretch: true, ai: 'CENTER', nofill: true });
      const av = F(r, { w: 24, h: 24, fill: 'surface/3', radius: 999 }); av.layoutSizingHorizontal = 'FIXED'; av.layoutSizingVertical = 'FIXED';
      const tx = F(r, { gap: 6, nofill: true }); tx.layoutSizingHorizontal = 'FILL';
      sk(tx, 0, 12); sk(tx, 0, 10);
    }
  }
  if (v === 'Panel') sk(c, W, 120);
  if (v === 'Table') { for (let i = 0; i < 4; i++) sk(c, W, 28); }
  if (st === 'Reduced-motion') { const n = F(c, { nofill: true }); }
}

// ---------------- B8 · Spinner ----------------
function buildSpinner(c, P) {
  const ctx = P.variant, s = P.size, st = P.state;
  const size = { Small: 14, Medium: 20, Large: 32 }[s];
  const tok = ctx === 'Inline' ? 'text/muted' : ctx === 'Control' ? 'action/default' : 'text/default';
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
  c.itemSpacing = 8;
  if (st === 'Active') {
    spinner(c, size, tok);
    if (ctx === 'Page') T(c, 'Loading run history…', 'body-md', 'text/muted');
  } else {
    const e = figma.createEllipse();
    e.resize(size, size);
    e.strokes = [{ type: 'SOLID', color: hx('#000') }];
    e.setBoundVariable('strokes', VV['surface/3']);
    e.strokeWeight = Math.max(1.5, size / 8);
    e.fills = [];
    c.appendChild(e);
    T(c, 'Loading (reduced motion).', 'caption', 'text/muted');
  }
}

// ---------------- B9 · Avatar ----------------
function buildAvatar(c, P) {
  const k = P.variant, s = P.size, st = P.state;
  const size = { XS: 24, SM: 32, MD: 40, LG: 48 }[s];
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
  c.clipsContent = false;
  const a = F(c, { w: size, h: size, radius: 999, fill: 'surface/2', bstroke: 'border/hairline', ai: 'CENTER', name: 'avatar' });
  a.layoutSizingHorizontal = 'FIXED'; a.layoutSizingVertical = 'FIXED';
  a.primaryAxisAlignItems = 'CENTER';
  const dis = st === 'Unavailable';
  if (k === 'Initial') T(a, 'MC', s === 'XS' || s === 'SM' ? 'caption' : 'body-sm', dis ? 'disabled/fg' : 'text/default');
  if (k === 'Image') a.setBoundVariable('fills', VV['surface/3']);
  if (k === 'Agent') IC(a, 'cpu', Math.round(size * 0.5), dis ? 'disabled/fg' : 'text/default');
  if (k === 'Team') IC(a, 'users', Math.round(size * 0.5), dis ? 'disabled/fg' : 'text/default');
  if (st === 'Online' || st === 'Offline') {
    const dot = F(c, { w: Math.max(8, size / 4), h: Math.max(8, size / 4), radius: 999, name: 'dot' });
    dot.layoutPositioning = 'ABSOLUTE';
    dot.x = size - Math.max(8, size / 4) - 1; dot.y = size - Math.max(8, size / 4) - 1;
    dot.layoutSizingHorizontal = 'FIXED'; dot.layoutSizingVertical = 'FIXED';
    dot.strokes = [{ type: 'SOLID', color: hx('#F6F4EE') }]; dot.strokeWeight = 2;
    dot.setBoundVariable('fills', VV[st === 'Online' ? 'status/success/text' : 'text/muted']);
  }
}

// ---------------- B10 · Breadcrumb ----------------
function buildBreadcrumb(c, P) {
  const style = P.variant, s = P.size, st = P.state;
  const dis = st === 'Disabled';
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
  c.itemSpacing = 4;
  const items = style === 'Overflow' ? ['Runs', '…', 'Steps'] : ['Runs', 'run_2841', 'Steps'];
  items.forEach((t, i) => {
    const last = i === items.length - 1;
    const it = F(c, { px: 4, py: 2, radius: 4, nofill: true, ai: 'CENTER' });
    if (st === 'Focus' && last) ring(it, 'focus/ring');
    if (st === 'Hover' && !last) it.setBoundVariable('fills', VV['surface/1']);
    T(it, t, s === 'Small' ? 'body-sm' : 'body-md', dis ? 'disabled/fg' : last ? 'text/default' : 'text/muted');
    if (!last) IC(c, 'chevron-right', 12, 'text/muted');
  });
}

// ---------------- B11 · Pagination ----------------
function buildPagination(c, P) {
  const style = P.variant, s = P.size, st = P.state;
  const dis = st === 'Disabled';
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
  c.itemSpacing = 4;
  function pgBtn(label, active, icon) {
    const b = F(c, { w: 32, h: 32, radius: 4, ai: 'CENTER', name: 'pg' });
    b.layoutSizingHorizontal = 'FIXED'; b.layoutSizingVertical = 'FIXED';
    b.primaryAxisAlignItems = 'CENTER';
    if (active) b.setBoundVariable('fills', VV['surface/2']);
    if (icon) IC(b, icon, 14, dis ? 'disabled/fg' : 'text/default');
    else T(b, label, 'body-sm', dis ? 'disabled/fg' : 'text/default');
    return b;
  }
  if (style === 'Pages') {
    pgBtn('', false, 'chevron-right').rotation = 180;
    ['1', '2', '3'].forEach((n, i) => pgBtn(n, i === 0));
    T(c, '…', 'body-sm', 'text/muted');
    pgBtn('12', false);
    pgBtn('', false, 'chevron-right');
  } else if (style === 'Simple') {
    pgBtn('', false, 'chevron-right').rotation = 180;
    T(c, '1 of 4', 'body-sm', dis ? 'disabled/fg' : 'text/default');
    pgBtn('', false, 'chevron-right');
  } else {
    pgBtn('', false, 'chevron-right').rotation = 180;
    T(c, 'Newer', 'body-sm', dis ? 'disabled/fg' : 'text/default');
    T(c, 'Older', 'body-sm', dis ? 'disabled/fg' : 'text/default');
    pgBtn('', false, 'chevron-right');
  }
  if (st === 'Focus') ring(c.children[1] || c, 'focus/ring');
  if (st === 'Loading') spinner(c, 14, 'text/muted');
}

// ---------------- B12 · Popover ----------------
function buildPopover(c, P) {
  const kind = P.variant, s = P.size, st = P.state;
  const W = { Small: 200, Medium: 280, Large: 360 }[s];
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 0;
  c.layoutSizingHorizontal = 'FIXED';
  c.resize(W, c.height);
  c.clipsContent = false;
  const trig = F(c, { dir: 'HORIZONTAL', gap: 8, px: 12, py: 8, radius: 4, fill: 'surface/1', bstroke: 'border/hairline', ai: 'CENTER', stretch: true, name: 'trigger' });
  T(trig, 'More filters', 'body-md', 'text/default');
  const sp = F(trig, { nofill: true }); sp.layoutSizingHorizontal = 'FILL';
  IC(trig, st === 'Open' ? 'chevron-down' : 'chevron-right', 14, 'text/muted');
  if (st === 'Closed') return;
  const panel = F(c, { gap: 8, px: 12, py: 12, radius: 4, fill: 'surface/3', stretch: true, name: 'panel' });
  panel.layoutPositioning = 'ABSOLUTE'; panel.y = 44; panel.x = 0;
  panel.layoutSizingHorizontal = 'FIXED'; panel.resize(W, panel.height);
  panel.strokes = [{ type: 'SOLID', color: hx('#000') }];
  panel.setBoundVariable('strokes', VV[st === 'Error' ? 'status/danger/text' : 'border/hairline']);
  panel.strokeWeight = 1; panel.strokeAlign = 'INSIDE';
  if (st === 'Focus-within') ring(panel, 'focus/ring');
  if (kind === 'Menu') {
    for (const [t, sel] of [['Production', true], ['Staging', false], ['Archived', false]]) {
      const o = F(panel, { dir: 'HORIZONTAL', gap: 8, px: 8, py: 8, radius: 4, stretch: true, ai: 'CENTER' });
      if (sel) o.setBoundVariable('fills', VV['surface/2']);
      T(o, t, 'body-md', 'text/default');
      if (sel) { const s2 = F(o, { nofill: true }); s2.layoutSizingHorizontal = 'FILL'; IC(o, 'check', 14, 'text/default'); }
    }
  } else if (kind === 'Form') {
    T(panel, 'Daily budget cap', 'caption', 'text/muted');
    const inp = F(panel, { dir: 'HORIZONTAL', px: 10, py: 8, radius: 4, fill: 'surface/1', bstroke: 'border/hairline', stretch: true, ai: 'CENTER' });
    T(inp, '42', 'body-md', 'text/default');
    const b = F(panel, { dir: 'HORIZONTAL', px: 12, py: 8, radius: 4, fill: 'action/default', stretch: true, ai: 'CENTER' });
    b.primaryAxisAlignItems = 'CENTER';
    T(b, 'Apply cap', 'body-md', 'action/on');
  } else {
    const rows = [['Owner', 'Maya Chen'], ['Impact', '$4,820 / day'], ['Updated', '2m ago']];
    for (const [k, val] of rows) {
      const r = F(panel, { dir: 'HORIZONTAL', gap: 8, stretch: true });
      const kl = F(r, { w: 70, nofill: true }); kl.layoutSizingHorizontal = 'FIXED';
      T(kl, k, 'body-sm', 'text/muted');
      T(r, val, 'body-sm', 'text/default');
    }
  }
  if (st === 'Error') T(panel, 'Cap must be at least 10.', 'caption', 'status/danger/text');
}

// ---------------- B13 · Dialog ----------------
function buildDialog(c, P) {
  const kind = P.variant, s = P.size, st = P.state;
  const W = { Small: 400, Medium: 480, Large: 560 }[s];
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 0;
  c.layoutSizingHorizontal = 'FIXED';
  c.resize(W, c.height);
  if (st === 'Closed') {
    const t = F(c, { dir: 'HORIZONTAL', px: 16, py: 10, radius: 4, fill: kind === 'Danger' ? 'status/danger/text' : 'action/default', ai: 'CENTER' });
    t.primaryAxisAlignItems = 'CENTER';
    T(t, kind === 'Danger' ? 'Delete 12 ads' : kind === 'Form' ? 'Reject request' : 'Pause 8 ad sets', 'body-md', 'action/on');
    return;
  }
  const card = F(c, { gap: 16, px: 24, py: 24, radius: 8, fill: 'surface/3', stretch: true, name: 'card' });
  card.strokes = [{ type: 'SOLID', color: hx('#000') }];
  card.setBoundVariable('strokes', VV['border/hairline']);
  card.strokeWeight = 1; card.strokeAlign = 'INSIDE';
  const titles = { Confirm: 'Pause 8 ad sets?', Danger: 'Delete 12 published ads?', Form: 'Reject approval request' };
  T(card, titles[kind], 'h3', 'text/default');
  T(card, kind === 'Danger'
    ? 'This permanently deletes 12 published ads. This cannot be undone.'
    : kind === 'Form'
      ? 'A reason is required. It will be written to the audit log with your name and time.'
      : 'Completed steps are kept. You can resume or undo within 24 hours.', 'body-md', 'text/muted');
  if (kind === 'Form') {
    const ta = F(card, { px: 12, py: 10, radius: 4, fill: 'surface/1', bstroke: 'border/hairline', stretch: true });
    ta.layoutSizingVertical = 'FIXED'; ta.resize(ta.width, 72);
    T(ta, 'Rejection reason…', 'body-md', 'text/muted');
  }
  if (st === 'Error') {
    const a = F(card, { dir: 'HORIZONTAL', gap: 8, px: 12, py: 10, radius: 4, fill: 'status/danger/bg', stretch: true, ai: 'CENTER' });
    IC(a, 'shield-alert', 14, 'status/danger/text');
    T(a, 'Request failed. No changes were made.', 'body-sm', 'status/danger/text');
  }
  const ft = F(card, { dir: 'HORIZONTAL', gap: 12, stretch: true, name: 'footer' });
  ft.primaryAxisAlignItems = 'END';
  const cb = F(ft, { px: 16, py: 10, radius: 4, fill: 'surface/1', bstroke: 'border/hairline' });
  T(cb, 'Cancel', 'body-md', 'text/default');
  const pb = F(ft, { dir: 'HORIZONTAL', gap: 8, px: 16, py: 10, radius: 4, ai: 'CENTER' });
  pb.primaryAxisAlignItems = 'CENTER';
  pb.setBoundVariable('fills', VV[kind === 'Danger' ? 'status/danger/text' : 'action/default']);
  if (st === 'Submitting') spinner(pb, 14, 'action/on');
  T(pb, st === 'Submitting' ? 'Working…' : kind === 'Danger' ? 'Delete 12 ads' : kind === 'Form' ? 'Reject request' : 'Pause 8 ad sets', 'body-md', 'action/on');
}

// ---------------- B14 · Drawer ----------------
function buildDrawer(c, P) {
  const kind = P.variant, s = P.size, st = P.state;
  const W = { Small: 320, Medium: 400, Large: 480 }[s];
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 0;
  c.layoutSizingHorizontal = 'FIXED';
  c.resize(W, c.height);
  if (st === 'Closed') {
    const t = F(c, { dir: 'HORIZONTAL', px: 16, py: 10, radius: 4, fill: 'action/default', ai: 'CENTER' });
    t.primaryAxisAlignItems = 'CENTER';
    T(t, kind === 'Takeover' ? 'Take over' : 'Open details', 'body-md', 'action/on');
    return;
  }
  const panel = F(c, { gap: 20, px: 24, py: 24, fill: 'surface/3', stretch: true, name: 'panel' });
  panel.strokes = [{ type: 'SOLID', color: hx('#000') }];
  panel.setBoundVariable('strokes', VV['border/hairline']);
  panel.strokeWeight = 1; panel.strokeAlign = 'INSIDE';
  const hd = F(panel, { dir: 'HORIZONTAL', gap: 8, stretch: true, ai: 'CENTER' });
  const ht = F(hd, { gap: 4, nofill: true }); ht.layoutSizingHorizontal = 'FILL';
  const titles = { Detail: 'run_2841 · Details', Review: 'Review approval', Takeover: 'Take control of run 2841' };
  T(ht, titles[kind], 'h4', 'text/default');
  T(ht, kind === 'Takeover' ? 'Agent requested help · shared-budget conflict' : 'campaign_optimization · production', 'caption', 'text/muted');
  IC(hd, 'x', 16, 'text/muted');
  HR(panel, 'border/hairline');

  if (st === 'Loading') {
    for (let i = 0; i < 4; i++) { sk(panel, W - 48, 12); }
  } else if (st === 'Error') {
    const a = F(panel, { dir: 'HORIZONTAL', gap: 8, px: 12, py: 10, radius: 4, fill: 'status/danger/bg', stretch: true, ai: 'CENTER' });
    IC(a, 'shield-alert', 14, 'status/danger/text');
    T(a, 'Handover data failed to load. Retry to continue.', 'body-sm', 'status/danger/text');
  } else {
    const body = F(panel, { gap: 16, stretch: true, nofill: true });
    function kv(k, val, tone) {
      const r = F(body, { gap: 4, nofill: true, stretch: true });
      T(r, k, 'overline', 'text/muted');
      T(r, val, 'body-md', tone || 'text/default');
    }
    if (kind === 'Takeover') {
      kv('Goal', 'Reduce CPA below $42 without stopping top performers.');
      kv('Completed', '4 ad sets paused · all reversible for 24 hours.');
      kv('Blocked', 'Pausing the group also affects 4 healthy campaigns.', 'status/warning/text');
      kv('Decision', 'Pause the group, or restore the 4 completed changes.');
      kv('Authority', 'You execute. Agent stays read-only until you return control.');
      const priv = F(body, { dir: 'HORIZONTAL', gap: 8, px: 12, py: 10, radius: 4, fill: 'status/info/bg', stretch: true, ai: 'CENTER' });
      IC(priv, 'shield-check', 14, 'status/info/text');
      T(priv, 'Takeover privacy: nothing you enter is captured — no screenshots, no keystroke logging.', 'body-sm', 'status/info/text');
    } else if (kind === 'Review') {
      kv('Request', 'Pause 8 underperforming ad sets');
      kv('Evidence', 'CPA 36% above the $42 target for 48 hours.');
      kv('Limitation', '17 newest conversions are not yet reported.');
      kv('Confidence', '78% · Medium confidence');
    } else {
      kv('Owner', 'Maya Chen');
      kv('Impact', '$4,820 / day');
      kv('State', 'Paused at step 06/08');
      kv('Undo window', '24 hours');
    }
  }
  if (st === 'Read-only') {
    const a = F(panel, { dir: 'HORIZONTAL', gap: 8, px: 12, py: 10, radius: 4, fill: 'status/info/bg', stretch: true, ai: 'CENTER' });
    IC(a, 'info', 14, 'status/info/text');
    T(a, 'Read-only — control is held by Maya Chen.', 'body-sm', 'status/info/text');
  }
  const ft = F(panel, { dir: 'HORIZONTAL', gap: 12, stretch: true });
  ft.primaryAxisAlignItems = 'END';
  const dis = st === 'Read-only' || st === 'Loading';
  if (kind === 'Takeover' && !dis) {
    const rt = F(ft, { px: 8, py: 10, radius: 4, nofill: true });
    T(rt, 'Return control to agent', 'body-md', 'action/default');
  }
  const cb = F(ft, { px: 16, py: 10, radius: 4, fill: dis ? 'disabled/bg' : 'surface/1', bstroke: 'border/hairline' });
  T(cb, kind === 'Takeover' ? 'Keep paused' : 'Close', 'body-md', dis ? 'disabled/fg' : 'text/default');
  const pb = F(ft, { px: 16, py: 10, radius: 4, fill: dis ? 'disabled/bg' : 'action/default' });
  T(pb, kind === 'Takeover' ? 'Take control' : 'Open run', 'body-md', dis ? 'disabled/fg' : 'action/on');
}


// ---------------- C1 · Approval request (tiered decision card) ----------------
// Layout/interaction sweep (Codex CLI): evidence renders as an independent
// "Proposed command" block ABOVE the actions; decisions are numbered verbose
// single-line rows (no description lines); persistence is three explicit tiers
// (this turn / this session / don't ask again); a resolved decision renders as
// a dimmed inline snippet; Error is fail-closed (Deny and continue only).
const AP_REQ = {
  Command: ['Run this command?', '$ npm run test -- --watch', 'Requested by test agent · workspace acme-web', 'Bash · npm run test -- *'],
  Budget: ['Change daily budget?', 'ad_set_184 · $610 → $305 / day', 'Requested by optimization agent · 4 campaigns share this budget', 'Budget changes under $1,000 / day'],
  External: ['Send this email?', 'To: maya@acme.com · Subject: "CPA report — week 40"', 'Requested by reporting agent · 1 recipient · no attachments', 'Emails to maya@acme.com']
};
function buildApprovalRequest(c, P) {
  const kind = P.variant, s = P.size, st = P.state;
  const W = s === 'Compact' ? 400 : 480;
  const [title, action, ctx, rule] = AP_REQ[kind];
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 0;
  c.layoutSizingHorizontal = 'FIXED';
  c.resize(W, c.height);
  const card = F(c, { gap: 12, px: 20, py: 20, radius: 8, fill: 'surface/3', stretch: true, name: 'card' });
  card.strokes = [{ type: 'SOLID', color: hx('#000000') }];
  card.setBoundVariable('strokes', VV['border/hairline']);
  card.strokeWeight = 1; card.strokeAlign = 'INSIDE';
  const hd = F(card, { dir: 'HORIZONTAL', gap: 8, stretch: true, ai: 'CENTER' });
  IC(hd, 'shield-check', 16, 'action/default');
  const ht = F(hd, { gap: 2, nofill: true }); ht.layoutSizingHorizontal = 'FILL';
  T(ht, title, 'h4', 'text/default');
  T(ht, 'Approval required', 'caption', 'text/muted');
  // evidence block — independent of the modal, sits above the actions
  T(card, 'Proposed command', 'overline', 'text/muted');
  const ev = F(card, { px: 12, py: 10, radius: 4, fill: 'surface/1', bstroke: 'border/hairline', stretch: true, name: 'evidence' });
  ev.paddingLeft = 20;
  T(ev, action, 'code', 'text/default');
  T(card, ctx, 'body-sm', 'text/muted');
  if (st === 'Approved') {
    const ok = F(card, { dir: 'HORIZONTAL', gap: 8, px: 12, py: 10, radius: 4, fill: 'status/success/bg', stretch: true, ai: 'CENTER' });
    IC(ok, 'check', 14, 'status/success/text');
    T(ok, 'Approved for this turn · recorded at 09:52.', 'body-sm', 'status/success/text');
    return;
  }
  if (st === 'Denied') {
    const dn = F(card, { dir: 'HORIZONTAL', gap: 8, px: 12, py: 10, radius: 4, fill: 'status/danger/bg', stretch: true, ai: 'CENTER' });
    IC(dn, 'x', 14, 'status/danger/text');
    T(dn, 'Denied · the agent will propose an alternative.', 'body-sm', 'status/danger/text');
    return;
  }
  if (st === 'Resolved') {
    // dimmed inline snippet: first line + " …", truncated — keeps run history scannable
    const rs = F(card, { dir: 'HORIZONTAL', gap: 8, stretch: true, ai: 'CENTER', nofill: true, name: 'resolved-snippet' });
    IC(rs, 'check', 14, 'text/muted');
    const rt = F(rs, { gap: 2, nofill: true }); rt.layoutSizingHorizontal = 'FILL';
    T(rt, 'npm run build --workspace=ads --configuration=production …', 'code', 'text/muted');
    T(rt, 'Approved for this turn · recorded at 09:52.', 'caption', 'text/muted');
    return;
  }
  if (st === 'Error') {
    // fail-closed: the permission scope could not be displayed — no affirmative options
    const er = F(card, { gap: 10, px: 12, py: 12, radius: 4, fill: 'status/danger/bg', stretch: true, name: 'fail-closed' });
    const erow = F(er, { dir: 'HORIZONTAL', gap: 8, stretch: true, ai: 'CENTER' });
    IC(erow, 'shield-alert', 16, 'status/danger/text');
    T(erow, 'The permission scope could not be displayed.', 'body-md', 'status/danger/text');
    T(er, 'For safety, this request cannot be approved.', 'body-sm', 'status/danger/text');
    const db = F(er, { dir: 'HORIZONTAL', gap: 8, px: 14, py: 9, radius: 4, fill: 'action/default', ai: 'CENTER' });
    db.primaryAxisAlignItems = 'CENTER';
    T(db, 'Deny and continue', 'body-md', 'action/on');
    T(card, 'Esc decline', 'caption', 'text/muted');
    return;
  }
  if (st === 'Editing') {
    const ed = F(card, { gap: 10, px: 12, py: 12, radius: 4, fill: 'surface/1', bstroke: 'border/hairline', stretch: true, name: 'patch-editor' });
    const er = F(ed, { dir: 'HORIZONTAL', gap: 8, stretch: true, ai: 'CENTER' });
    IC(er, 'pencil', 14, 'text/default');
    T(er, 'Editing proposed patch', 'body-md', 'text/default');
    const eb = F(ed, { px: 12, py: 10, radius: 4, fill: 'surface/2', stretch: true });
    T(eb, action, 'code', 'text/default');
    T(ed, 'Edits apply to the proposed patch only. The agent re-validates after every edit.', 'caption', 'text/muted');
    const erow = F(ed, { dir: 'HORIZONTAL', gap: 8 });
    const ce = F(erow, { px: 14, py: 9, radius: 4, fill: 'action/default' });
    T(ce, 'Confirm edit', 'body-md', 'action/on');
    const cx = F(erow, { px: 14, py: 9, radius: 4, fill: 'surface/1', bstroke: 'border/hairline' });
    T(cx, 'Cancel', 'body-md', 'text/default');
    return;
  }
  if (st === 'Unprotected') {
    const wn = F(card, { gap: 10, px: 12, py: 12, radius: 4, fill: 'status/warning/bg', stretch: true, name: 'vcs-warning' });
    const wr = F(wn, { dir: 'HORIZONTAL', gap: 8, stretch: true, ai: 'CENTER' });
    IC(wr, 'alert-triangle', 16, 'status/warning/text');
    T(wr, 'Working tree is not version-controlled.', 'body-md', 'status/warning/text');
    T(wn, 'Automatic modes are paused until you confirm. Without version control there is no safety net for agent edits.', 'body-sm', 'status/warning/text');
    const wb = F(wn, { dir: 'HORIZONTAL', gap: 8 });
    const cf = F(wb, { px: 14, py: 9, radius: 4, fill: 'status/warning/text' });
    T(cf, 'Confirm & continue', 'body-md', 'action/on');
    const stay = F(wb, { px: 14, py: 9, radius: 4, fill: 'surface/1', bstroke: 'border/hairline' });
    T(stay, 'Stay in ask mode', 'body-md', 'text/default');
    return;
  }
  // numbered verbose option rows — no description lines; persistence is explicit
  const opts = F(card, { gap: 8, stretch: true, name: 'options' });
  function optRow(num, label, primary, danger) {
    const r = F(opts, { dir: 'HORIZONTAL', gap: 10, px: 14, py: 10, radius: 4, stretch: true, ai: 'CENTER', name: 'option' });
    if (primary) r.setBoundVariable('fills', VV['action/default']);
    else { r.setBoundVariable('fills', VV['surface/1']); r.strokes = [{ type: 'SOLID', color: hx('#000000') }]; r.setBoundVariable('strokes', VV['border/hairline']); r.strokeWeight = 1; r.strokeAlign = 'INSIDE'; }
    T(r, num, 'code', primary ? 'action/on' : 'text/muted');
    T(r, label, 'body-md', danger ? 'status/danger/text' : primary ? 'action/on' : 'text/default');
    return r;
  }
  optRow('1', 'Yes, approve for this turn', true, false);
  optRow('2', 'Yes, approve for this session', false, false);
  const r3 = optRow('3', "Yes, don't ask again", false, false);
  const rsp = F(r3, { nofill: true }); rsp.layoutSizingHorizontal = 'FILL';
  T(r3, rule, 'caption', 'text/muted');
  optRow('4', 'No, deny', false, true);
  const editp = F(card, { dir: 'HORIZONTAL', gap: 6, px: 14, py: 9, radius: 4, ai: 'CENTER', name: 'edit-patch' });
  editp.setBoundVariable('fills', VV['surface/1']);
  editp.strokes = [{ type: 'SOLID', color: hx('#000000') }];
  editp.setBoundVariable('strokes', VV['border/hairline']);
  editp.strokeWeight = 1; editp.strokeAlign = 'INSIDE';
  IC(editp, 'pencil', 14, 'text/default');
  T(editp, 'Edit patch', 'body-md', 'text/default');
  T(card, '1–4 select · e edit patch · Tab add note · Esc decline', 'caption', 'text/muted');
  T(card, 'Decision is recorded with your name and time.', 'caption', 'text/muted');
}

// ---------------- Workspace · Composer ----------------
// Code/Ask verbs split intent at the point of entry (mutation vs read-only);
// Agent/Plan mode switch beside it. Working state surfaces the queued message
// so steering never requires interrupting the agent.
function buildComposer(c, P) {
  const verb = P.variant, s = P.size, st = P.state;
  const dis = st === 'Disabled';
  const W = s === 'Compact' ? 440 : 560;
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 10;
  c.layoutSizingHorizontal = 'FIXED';
  c.resize(W, c.height);
  const top = F(c, { dir: 'HORIZONTAL', gap: 8, stretch: true, ai: 'CENTER' });
  function seg(items, activeLabel, name) {
    const g = F(top, { dir: 'HORIZONTAL', gap: 2, px: 4, py: 4, radius: 999, ai: 'CENTER', name: name });
    g.setBoundVariable('fills', VV[dis ? 'disabled/bg' : 'surface/1']);
    g.strokes = [{ type: 'SOLID', color: hx('#000000') }];
    g.setBoundVariable('strokes', VV['border/hairline']);
    g.strokeWeight = 1; g.strokeAlign = 'INSIDE';
    for (const k of items) {
      const on = k === activeLabel;
      const segm = F(g, { px: 12, py: 6, radius: 999, name: 'seg' });
      if (on) {
        segm.setBoundVariable('fills', VV['surface/3']);
        segm.strokes = [{ type: 'SOLID', color: hx('#000000') }];
        segm.setBoundVariable('strokes', VV['border/strong']);
        segm.strokeWeight = 1; segm.strokeAlign = 'INSIDE';
      } else segm.fills = [];
      T(segm, k, 'body-sm', dis ? 'disabled/fg' : on ? 'text/default' : 'text/muted');
    }
    return g;
  }
  seg(['Code', 'Ask'], verb, 'verb-switch');
  const sp = F(top, { nofill: true }); sp.layoutSizingHorizontal = 'FILL';
  seg(['Agent', 'Plan'], 'Agent', 'mode-switch');
  const shellf = F(c, { gap: 10, px: 16, py: 14, radius: 16, stretch: true, name: 'input-shell' });
  shellf.setBoundVariable('fills', VV[dis ? 'disabled/bg' : 'surface/1']);
  shellf.strokes = [{ type: 'SOLID', color: hx('#000000') }];
  shellf.setBoundVariable('strokes', VV['border/hairline']);
  shellf.strokeWeight = 1; shellf.strokeAlign = 'INSIDE';
  if (st === 'Focus') ring(shellf, 'focus/ring');
  T(shellf, verb === 'Code' ? 'Describe what to build…' : 'Ask about the codebase — nothing will change.', 'body-md', dis ? 'disabled/fg' : 'text/muted');
  const irow = F(shellf, { dir: 'HORIZONTAL', gap: 8, stretch: true, ai: 'CENTER' });
  const isp = F(irow, { nofill: true }); isp.layoutSizingHorizontal = 'FILL';
  const send = F(irow, { w: 36, h: 36, radius: 999, ai: 'CENTER', name: 'send' });
  send.setBoundVariable('fills', VV[dis ? 'disabled/bg' : 'action/default']);
  IC(send, 'send', 16, dis ? 'disabled/fg' : 'action/on');
  if (st === 'Working') {
    const q = F(c, { dir: 'HORIZONTAL', gap: 8, px: 12, py: 10, radius: 4, stretch: true, ai: 'CENTER', name: 'queued' });
    q.setBoundVariable('fills', VV['surface/1']);
    q.strokes = [{ type: 'SOLID', color: hx('#000000') }];
    q.setBoundVariable('strokes', VV['border/hairline']);
    q.strokeWeight = 1; q.strokeAlign = 'INSIDE';
    IC(q, 'clock', 14, 'text/muted');
    const qc = F(q, { gap: 2, nofill: true }); qc.layoutSizingHorizontal = 'FILL';
    T(qc, 'Queued · sends when the agent finishes', 'caption', 'text/muted');
    T(qc, 'Also pause ad_set_306 after the review.', 'body-sm', 'text/default');
  }
  T(c, 'Enter send · Ctrl+Enter sends queued now · Esc stops the agent', 'caption', dis ? 'disabled/fg' : 'text/muted');
}

// ---------------- Supervision · Execution timeline ----------------
// Steps render as rows, not cards: rows scale to long runs. Collapsed summary
// rows and effort headers keep the flow scannable; errors link to the trace.
function buildExecutionTimeline(c, P) {
  const kind = P.variant, st = P.state;
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 0;
  c.layoutSizingHorizontal = 'FIXED';
  c.resize(560, c.height);
  function dot(token, ringed) {
    const d = figma.createEllipse();
    d.resize(8, 8);
    d.fills = [{ type: 'SOLID', color: hx('#000000') }];
    d.setBoundVariable('fills', VV[token]);
    if (ringed) { d.strokes = [{ type: 'SOLID', color: hx('#000000') }]; d.setBoundVariable('strokes', VV['focus/ring']); d.strokeWeight = 2; d.strokeAlign = 'OUTSIDE'; }
    return d;
  }
  if (kind === 'Step') {
    const row = F(c, { dir: 'HORIZONTAL', gap: 10, px: 12, stretch: true, ai: 'CENTER', name: 'step-row' });
    row.paddingTop = 8; row.paddingBottom = 8;
    IC(row, st === 'Expanded' ? 'chevron-down' : 'chevron-right', 14, 'text/muted');
    if (st === 'Running') spinner(row, 14, 'action/default');
    else row.appendChild(dot(st === 'Expanded' ? 'action/default' : 'status/success/text', false));
    T(row, st === 'Running' ? 'Running tests…' : 'Ran unit tests', 'body-sm', 'text/default');
    const fsp = F(row, { nofill: true }); fsp.layoutSizingHorizontal = 'FILL';
    T(row, st === 'Running' ? 'live' : '12s', 'code', 'text/muted');
    if (st === 'Expanded') {
      const wrap = F(c, { dir: 'HORIZONTAL', stretch: true, nofill: true, name: 'detail-wrap' });
      const ind = F(wrap, { w: 30, nofill: true }); ind.layoutSizingHorizontal = 'FIXED';
      const det = F(wrap, { gap: 4, px: 12, py: 10, radius: 4, name: 'detail' });
      det.layoutSizingHorizontal = 'FILL';
      det.setBoundVariable('fills', VV['surface/1']);
      det.strokes = [{ type: 'SOLID', color: hx('#000000') }];
      det.setBoundVariable('strokes', VV['border/hairline']);
      det.strokeWeight = 1; det.strokeAlign = 'INSIDE';
      T(det, '$ npm test -- --coverage', 'code', 'text/muted');
      T(det, '42 passed · 0 failed · 12s', 'code', 'text/default');
    }
    return;
  }
  if (kind === 'Summary') {
    const row = F(c, { dir: 'HORIZONTAL', gap: 10, px: 12, stretch: true, ai: 'CENTER', name: 'summary-row' });
    row.paddingTop = 8; row.paddingBottom = 8;
    IC(row, 'chevron-right', 14, 'text/muted');
    T(row, 'Explored 12 files, 4 searches', 'body-sm', 'text/default');
    const fsp = F(row, { nofill: true }); fsp.layoutSizingHorizontal = 'FILL';
    T(row, '16 actions', 'caption', 'text/muted');
    return;
  }
  if (kind === 'Effort') {
    const row = F(c, { dir: 'HORIZONTAL', gap: 10, px: 12, stretch: true, ai: 'CENTER', name: 'effort-header' });
    row.paddingTop = 10; row.paddingBottom = 10;
    IC(row, 'clock', 14, 'text/muted');
    T(row, 'Worked for 4m 13s', 'body-md', 'text/default');
    const fsp = F(row, { nofill: true }); fsp.layoutSizingHorizontal = 'FILL';
    T(row, 'Step 3/8', 'caption', 'text/muted');
    return;
  }
  // Error
  const row = F(c, { dir: 'HORIZONTAL', gap: 10, px: 12, stretch: true, ai: 'CENTER', name: 'error-row' });
  row.paddingTop = 8; row.paddingBottom = 8;
  row.setBoundVariable('fills', VV['status/danger/bg']);
  IC(row, 'x', 14, 'status/danger/text');
  T(row, 'Tests failed · 3 errors', 'body-sm', 'status/danger/text');
  const fsp = F(row, { nofill: true }); fsp.layoutSizingHorizontal = 'FILL';
  T(row, 'View stack trace', 'caption', 'status/danger/text');
}

// ---------------- Supervision · Checkpoint marker ----------------
// A marker that lives ON the timeline gutter — never inside the message flow.
// Restores are navigated by turn, outside the chat.
const CP_TONE = { Saved: 'status/success/text', Selected: 'action/default', Restored: 'status/warning/text' };
const CP_LABEL = { Saved: 'Checkpoint saved', Selected: 'Previewing checkpoint', Restored: 'Restored 09:54' };
function buildCheckpointMarker(c, P) {
  const v = P.variant;
  const tone = CP_TONE[v];
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  const wrap = F(c, { dir: 'HORIZONTAL', gap: 8, ai: 'CENTER', name: 'marker' });
  const rail = F(wrap, { w: 2, h: 40, name: 'rail' });
  rail.layoutSizingHorizontal = 'FIXED';
  rail.setBoundVariable('fills', VV[tone]);
  const lamp = figma.createEllipse();
  lamp.resize(12, 12);
  lamp.fills = [{ type: 'SOLID', color: hx('#000000') }];
  lamp.setBoundVariable('fills', VV[tone]);
  if (v === 'Selected') {
    lamp.strokes = [{ type: 'SOLID', color: hx('#000000') }];
    lamp.setBoundVariable('strokes', VV['focus/ring']);
    lamp.strokeWeight = 2; lamp.strokeAlign = 'OUTSIDE';
  }
  wrap.appendChild(lamp);
  const cap = F(wrap, { gap: 2, nofill: true });
  T(cap, '09:52', 'code', 'text/muted');
  T(cap, CP_LABEL[v], 'caption', 'text/default');
}

// ---------------- Workspace · Status bar ----------------
// Always-visible run state: model · session cost · permission mode · context.
// Nothing here requires opening a panel.
function buildStatusBar(c, P) {
  const st = P.state;
  const paused = st === 'Paused';
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.layoutSizingHorizontal = 'FIXED';
  c.resize(560, c.height);
  const bar = F(c, { dir: 'HORIZONTAL', gap: 10, px: 12, stretch: true, ai: 'CENTER', name: 'status-bar' });
  bar.layoutSizingVertical = 'FIXED'; bar.resize(bar.width, 36);
  bar.setBoundVariable('fills', VV['surface/1']);
  bar.strokes = [{ type: 'SOLID', color: hx('#000000') }];
  bar.setBoundVariable('strokes', VV['border/hairline']);
  bar.strokeWeight = 1; bar.strokeAlign = 'INSIDE';
  bar.cornerRadius = 4;
  const segs = paused
    ? [['pause', 'Paused · agent is holding']]
    : [['cpu', 'Opus 4.6'], ['wallet', '$1.24 this session'], ['shield-check', 'Allowlist'], ['gauge', '62% context left']];
  segs.forEach((sg, i) => {
    if (i > 0) T(bar, '·', 'caption', 'text/muted');
    IC(bar, sg[0], 14, 'text/muted');
    T(bar, sg[1], 'caption', 'text/default');
  });
  const fsp = F(bar, { nofill: true }); fsp.layoutSizingHorizontal = 'FILL';
  T(bar, paused ? 'Resume' : '09:52', 'caption', 'text/muted');
}

// ---------------- Review · Review bar ----------------
// Sticky review bar — NOT an approval. Review is a separate interaction class
// from consent: it never mirrors approval actions to notifications.
function buildReviewBar(c, P) {
  const st = P.state;
  const dis = st === 'Disabled';
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.layoutSizingHorizontal = 'FIXED';
  c.resize(560, c.height);
  const bar = F(c, { dir: 'HORIZONTAL', gap: 12, px: 16, py: 12, radius: 8, stretch: true, ai: 'CENTER', name: 'review-bar' });
  bar.setBoundVariable('fills', VV[dis ? 'disabled/bg' : 'surface/3']);
  bar.strokes = [{ type: 'SOLID', color: hx('#000000') }];
  bar.setBoundVariable('strokes', VV['border/hairline']);
  bar.strokeWeight = 1; bar.strokeAlign = 'INSIDE';
  IC(bar, 'eye', 16, dis ? 'disabled/fg' : 'text/default');
  const tx = F(bar, { gap: 2, nofill: true }); tx.layoutSizingHorizontal = 'FILL';
  T(tx, '2 files need review', 'body-md', dis ? 'disabled/fg' : 'text/default');
  T(tx, 'Review is separate from approval.', 'caption', dis ? 'disabled/fg' : 'text/muted');
  const keep = F(bar, { px: 14, py: 9, radius: 4, name: 'keep-all' });
  keep.setBoundVariable('fills', VV[dis ? 'disabled/bg' : 'action/default']);
  T(keep, 'Keep all', 'body-md', dis ? 'disabled/fg' : 'action/on');
  const undo = F(bar, { px: 14, py: 9, radius: 4, name: 'undo-all' });
  undo.setBoundVariable('fills', VV[dis ? 'disabled/bg' : 'surface/1']);
  undo.strokes = [{ type: 'SOLID', color: hx('#000000') }];
  undo.setBoundVariable('strokes', VV['border/hairline']);
  undo.strokeWeight = 1; undo.strokeAlign = 'INSIDE';
  T(undo, 'Undo all', 'body-md', dis ? 'disabled/fg' : 'status/danger/text');
}

// ---------------- Review · Diff viewer ----------------
// Docked beside the conversation; the source switcher attributes changes to
// the turn that made them (Current / T1 / T2). Per-file Ask pins that file's
// diff to the next prompt; "asked ✓" confirms the pin.
const DIFF_FILES = [
  ['budget_rules.json', '+12', '-3'],
  ['ad_set_184.json', '+4', '-4'],
  ['report.md', '+28', '-0']
];
function buildDiffViewer(c, P) {
  const s = P.size, st = P.state;
  const W = s === 'Compact' ? 400 : 480;
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.layoutSizingHorizontal = 'FIXED';
  c.resize(W, c.height);
  const panel = F(c, { gap: 0, radius: 8, stretch: true, name: 'diff-panel' });
  panel.setBoundVariable('fills', VV['surface/1']);
  panel.strokes = [{ type: 'SOLID', color: hx('#000000') }];
  panel.setBoundVariable('strokes', VV['border/hairline']);
  panel.strokeWeight = 1; panel.strokeAlign = 'INSIDE';
  const hd = F(panel, { dir: 'HORIZONTAL', gap: 8, px: 12, stretch: true, ai: 'CENTER', name: 'header' });
  hd.paddingTop = 10; hd.paddingBottom = 10;
  IC(hd, 'x', 14, 'text/muted');
  T(hd, 'Diff', 'body-md', 'text/default');
  const sw = F(hd, { dir: 'HORIZONTAL', gap: 2, px: 3, py: 3, radius: 999, ai: 'CENTER', name: 'source-switcher' });
  sw.setBoundVariable('fills', VV['surface/2']);
  for (const k of ['Current', 'T1', 'T2']) {
    const on = k === 'Current';
    const sg = F(sw, { px: 10, py: 4, radius: 999 });
    if (on) {
      sg.setBoundVariable('fills', VV['surface/3']);
      sg.strokes = [{ type: 'SOLID', color: hx('#000000') }];
      sg.setBoundVariable('strokes', VV['border/strong']);
      sg.strokeWeight = 1; sg.strokeAlign = 'INSIDE';
    } else sg.fills = [];
    T(sg, k, 'caption', on ? 'text/default' : 'text/muted');
  }
  const fsp = F(hd, { nofill: true }); fsp.layoutSizingHorizontal = 'FILL';
  T(hd, 'Docked', 'caption', 'text/muted');
  DIFF_FILES.forEach((f, i) => {
    const row = F(panel, { dir: 'HORIZONTAL', gap: 8, px: 12, stretch: true, ai: 'CENTER', name: 'file-row' });
    row.paddingTop = 8; row.paddingBottom = 8;
    T(row, f[0], 'code', 'text/default');
    T(row, f[1], 'caption', 'status/success/text');
    T(row, f[2], 'caption', 'status/danger/text');
    const rsp = F(row, { nofill: true }); rsp.layoutSizingHorizontal = 'FILL';
    if (i === 0 && st === 'Asked') {
      const ak = F(row, { dir: 'HORIZONTAL', gap: 4, ai: 'CENTER' });
      IC(ak, 'check', 12, 'status/success/text');
      T(ak, 'asked ✓', 'caption', 'status/success/text');
    } else {
      const ab = F(row, { px: 10, py: 5, radius: 4, name: 'ask-file' });
      ab.setBoundVariable('fills', VV['surface/2']);
      T(ab, 'Ask', 'caption', 'text/default');
    }
    if (i < DIFF_FILES.length - 1) HR(panel, 'border/hairline');
  });
  const dl = F(panel, { gap: 0, stretch: true, name: 'diff-lines' });
  dl.paddingTop = 8; dl.paddingBottom = 8;
  const l1 = F(dl, { px: 12, stretch: true });
  l1.setBoundVariable('fills', VV['status/danger/bg']);
  T(l1, '-  "daily_cap": 610,', 'code', 'status/danger/text');
  const l2 = F(dl, { px: 12, stretch: true });
  l2.setBoundVariable('fills', VV['status/success/bg']);
  T(l2, '+  "daily_cap": 305,', 'code', 'status/success/text');
}

// ---------------- Workspace · Layout frames ----------------
// Three independent frames — conversation, terminal below it, side pane — with
// 4px resizable gaps. Schematic at reduced scale; the 4px gap is the spec.
function buildLayoutFrames(c, P) {
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 8;
  const sch = F(c, { dir: 'HORIZONTAL', gap: 4, name: 'schematic' });
  function frameLabel(parent, label, w, h) {
    const f = F(parent, { gap: 6, px: 12, py: 12, radius: 8, name: label });
    f.layoutSizingHorizontal = 'FIXED'; f.layoutSizingVertical = 'FIXED';
    f.resize(w, h);
    f.setBoundVariable('fills', VV['surface/1']);
    f.strokes = [{ type: 'SOLID', color: hx('#000000') }];
    f.setBoundVariable('strokes', VV['border/hairline']);
    f.strokeWeight = 1; f.strokeAlign = 'INSIDE';
    T(f, label, 'overline', 'text/muted');
    return f;
  }
  function vhandle(parent) {
    const h = F(parent, { w: 4, name: 'resize-handle' });
    h.layoutSizingHorizontal = 'FIXED'; h.layoutSizingVertical = 'FILL';
    const ln = F(h, { w: 2, name: 'handle-line' });
    ln.layoutSizingHorizontal = 'FIXED'; ln.layoutSizingVertical = 'FILL';
    ln.setBoundVariable('fills', VV['surface/3']);
    ln.cornerRadius = 1;
    return h;
  }
  const left = F(sch, { gap: 4, nofill: true, name: 'left-col' });
  frameLabel(left, 'Conversation', 300, 140);
  F(left, { h: 4, stretch: true, nofill: true, name: 'h-handle' });
  frameLabel(left, 'Terminal', 300, 56);
  vhandle(sch);
  frameLabel(sch, 'Side pane', 180, 204);
  T(c, '4px resizable gaps · handle = 4px hit area, 2px line on hover / focus / drag', 'caption', 'text/muted');
}

// ---------------- Workspace · Resize handle ----------------
// Transparent 4px hit area; the 2px tertiary line appears only on
// hover / focus / drag. The idle frame is intentionally empty.
function buildResizeHandle(c, P) {
  const v = P.variant;
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  const hit = F(c, { w: 4, h: 64, nofill: true, name: 'hit-area' });
  hit.layoutSizingHorizontal = 'FIXED';
  if (v === 'Hover') {
    const ln = F(hit, { w: 2, name: 'handle-line' });
    ln.layoutSizingHorizontal = 'FIXED'; ln.layoutSizingVertical = 'FILL';
    ln.setBoundVariable('fills', VV['surface/3']);
    ln.cornerRadius = 1;
  }
}

// ---------------- Overlays · Shortcut help ----------------
// Shortcut discoverability without a docs tab: full panel (? on empty input)
// and a compact bottom bar whose hints change with focus state.
const SC_ROWS = [
  ['?', 'Show this panel'],
  ['Esc', 'Decline / close dialog'],
  ['Ctrl+O', 'Transcript viewer'],
  ['Ctrl+T', 'Task checklist'],
  ['{  }', 'Jump between prompts'],
  ['Shift+Tab', 'Allow for this session'],
  ['Tab', 'Add a note to the focused option']
];
function buildShortcutHelp(c, P) {
  const v = P.variant;
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  if (v === 'Bar') {
    const bar = F(c, { dir: 'HORIZONTAL', gap: 12, px: 12, py: 8, radius: 4, ai: 'CENTER', name: 'shortcuts-bar' });
    bar.setBoundVariable('fills', VV['surface/1']);
    bar.strokes = [{ type: 'SOLID', color: hx('#000000') }];
    bar.setBoundVariable('strokes', VV['border/hairline']);
    bar.strokeWeight = 1; bar.strokeAlign = 'INSIDE';
    T(bar, '? shortcuts · Esc decline · Ctrl+O transcript · Ctrl+T checklist', 'caption', 'text/muted');
    return;
  }
  const W = 420;
  c.layoutSizingHorizontal = 'FIXED';
  c.resize(W, c.height);
  const panel = F(c, { gap: 4, px: 20, py: 20, radius: 8, stretch: true, name: 'panel' });
  panel.setBoundVariable('fills', VV['surface/3']);
  panel.strokes = [{ type: 'SOLID', color: hx('#000000') }];
  panel.setBoundVariable('strokes', VV['border/hairline']);
  panel.strokeWeight = 1; panel.strokeAlign = 'INSIDE';
  T(panel, 'Keyboard shortcuts', 'h4', 'text/default');
  const gap = F(panel, { h: 8, nofill: true }); gap.layoutSizingVertical = 'FIXED';
  SC_ROWS.forEach((r, i) => {
    const row = F(panel, { dir: 'HORIZONTAL', gap: 12, stretch: true, ai: 'CENTER', name: 'sc-row' });
    const kbd = F(row, { px: 8, py: 4, radius: 4, name: 'kbd' });
    kbd.setBoundVariable('fills', VV['surface/2']);
    kbd.strokes = [{ type: 'SOLID', color: hx('#000000') }];
    kbd.setBoundVariable('strokes', VV['border/hairline']);
    kbd.strokeWeight = 1; kbd.strokeAlign = 'INSIDE';
    T(kbd, r[0], 'code', 'text/default');
    T(row, r[1], 'body-sm', 'text/muted');
    if (i < SC_ROWS.length - 1) HR(panel, 'border/hairline');
  });
}

// ---------------- Core · roadmap placeholders ----------------
// Empty shells only — no detail. The spec for each lives in the V4 concept doc.
function coreShell(title, desc) {
  return function (c, P) {
    c.layoutMode = 'VERTICAL';
    c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
    c.layoutSizingHorizontal = 'FIXED';
    c.resize(320, c.height);
    const f = F(c, { gap: 8, px: 16, py: 16, radius: 8, stretch: true, name: 'roadmap-shell' });
    f.setBoundVariable('fills', VV['surface/1']);
    f.strokes = [{ type: 'SOLID', color: hx('#000000') }];
    f.setBoundVariable('strokes', VV['border/hairline']);
    f.strokeWeight = 1; f.strokeAlign = 'INSIDE';
    T(f, 'CORE · ROADMAP', 'overline', 'text/muted');
    T(f, title, 'h4', 'text/default');
    T(f, desc, 'body-sm', 'text/muted');
    T(f, 'Not built in Lite. Spec lives in the V4 concept doc.', 'caption', 'text/muted');
  };
}

// ---------------- C2 · Autonomy mode selector ----------------
// Named, predictable autonomy levels + ask-pin: specific actions that always
// prompt regardless of mode (the compliance backstop).
const AM_LABEL = {
  'Ask-every-time': 'Ask every time',
  'Allowlist': 'Allowlist',
  'Auto-for-session': 'Auto for session',
  'Full-auto': 'Full auto'
};
const AM_DESC = {
  'Ask-every-time': 'The agent asks before every tool call. Slowest, safest.',
  'Allowlist': 'Only allowlisted commands run on their own. Everything else asks.',
  'Auto-for-session': 'Runs without asking until this session ends. Delete protection stays on.',
  'Full-auto': 'No prompts at all. Use only in a sandbox you can throw away.'
};
const AM_MODES = ['Ask-every-time', 'Allowlist', 'Auto-for-session', 'Full-auto'];
// Second, orthogonal axis (Codex model): sandbox controls WHERE the agent may act,
// independent of the approval mode that controls WHAT it may do.
const SB_MODES = ['Read-only', 'Workspace-write', 'Full access'];
function buildAutonomySelector(c, P) {
  const mode = P.variant, s = P.size, st = P.state;
  const dis = st === 'Disabled';
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 10;
  const ctl = F(c, { dir: 'HORIZONTAL', gap: 2, px: 4, py: 4, radius: 999, fill: 'surface/1', bstroke: 'border/hairline', ai: 'CENTER', name: 'segmented' });
  ctl.primaryAxisAlignItems = 'CENTER';
  if (st === 'Focus') ring(ctl, 'focus/ring');
  for (const k of AM_MODES) {
    const active = k === mode;
    const seg = F(ctl, { px: s === 'Compact' ? 10 : 14, py: 8, radius: 999, name: 'seg' });
    if (active) {
      seg.setBoundVariable('fills', VV['surface/3']);
      seg.strokes = [{ type: 'SOLID', color: hx('#000000') }];
      seg.setBoundVariable('strokes', VV['border/strong']);
      seg.strokeWeight = 1; seg.strokeAlign = 'INSIDE';
    } else seg.fills = [];
    T(seg, AM_LABEL[k], 'body-md', dis ? 'disabled/fg' : active ? 'text/default' : 'text/muted');
  }
  T(c, AM_DESC[mode], 'body-sm', dis ? 'disabled/fg' : 'text/muted');
  T(c, 'Sandbox', 'overline', dis ? 'disabled/fg' : 'text/muted');
  const sb = F(c, { dir: 'HORIZONTAL', gap: 2, px: 4, py: 4, radius: 999, fill: dis ? 'disabled/bg' : 'surface/1', bstroke: 'border/hairline', ai: 'CENTER', name: 'sandbox' });
  sb.primaryAxisAlignItems = 'CENTER';
  for (const k of SB_MODES) {
    const on = k === 'Workspace-write';
    const seg = F(sb, { px: s === 'Compact' ? 10 : 12, py: 6, radius: 999, name: 'sb-seg' });
    if (on) {
      seg.setBoundVariable('fills', VV['surface/3']);
      seg.strokes = [{ type: 'SOLID', color: hx('#000000') }];
      seg.setBoundVariable('strokes', VV['border/strong']);
      seg.strokeWeight = 1; seg.strokeAlign = 'INSIDE';
    } else seg.fills = [];
    T(seg, k, 'body-sm', dis ? 'disabled/fg' : on ? 'text/default' : 'text/muted');
  }
  T(c, 'Approval mode controls what the agent may do. Sandbox controls where it may do it.', 'caption', dis ? 'disabled/fg' : 'text/muted');
  const pin = F(c, { dir: 'HORIZONTAL', gap: 8, stretch: true, ai: 'CENTER', name: 'ask-pin' });
  IC(pin, 'pin', 14, dis ? 'disabled/fg' : 'text/muted');
  T(pin, 'Always ask for:', 'caption', dis ? 'disabled/fg' : 'text/muted');
  for (const p of ['delete resources', 'send email', 'payments']) {
    const chip = F(pin, { px: 10, py: 4, radius: 999, fill: dis ? 'disabled/bg' : 'surface/2' });
    T(chip, p, 'caption', dis ? 'disabled/fg' : 'text/default');
  }
}

// ---------------- C3 · Plan approval card ----------------
// Editable step plan + single "Build the plan" commit + three watch-level options.
const PLAN_STEPS = [
  'Audit the 8 ad sets and lock the scope.',
  'Pause ad_set_184 and ad_set_219 first (lowest CPA).',
  'Re-check shared-budget groups before touching ad_set_306.',
  'Verify no external API calls in steps 1–3.',
  'Report results and propose next budgets.'
];
function buildPlanCard(c, P) {
  const act = P.variant, s = P.size, st = P.state;
  const W = s === 'Large' ? 640 : 560;
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 0;
  c.layoutSizingHorizontal = 'FIXED';
  c.resize(W, c.height);
  const card = F(c, { gap: 14, px: 24, py: 24, radius: 8, fill: 'surface/3', stretch: true, name: 'card' });
  card.strokes = [{ type: 'SOLID', color: hx('#000000') }];
  card.setBoundVariable('strokes', VV['border/hairline']);
  card.strokeWeight = 1; card.strokeAlign = 'INSIDE';
  T(card, 'PLAN MODE · run_2841', 'overline', 'text/muted');
  T(card, 'Implementation plan — 5 steps', 'h3', 'text/default');
  const steps = F(card, { gap: 0, stretch: true, fill: 'surface/1', radius: 4, bstroke: 'border/hairline', name: 'steps' });
  PLAN_STEPS.forEach((txt, i) => {
    const r = F(steps, { dir: 'HORIZONTAL', gap: 10, px: 12, stretch: true, ai: 'CENTER' });
    r.paddingTop = 9; r.paddingBottom = 9;
    if (act === 'Editing') IC(r, 'list', 14, 'text/muted');
    T(r, String(i + 1).padStart(2, '0'), 'code', 'text/muted');
    T(r, txt, 'body-md', 'text/default');
    if (i < PLAN_STEPS.length - 1) HR(steps, 'border/hairline');
  });
  T(card, 'Based on codebase research · 12 files read · edit the plan before building.', 'caption', 'text/muted');
  if (st === 'Approved') {
    const ok = F(card, { dir: 'HORIZONTAL', gap: 8, px: 12, py: 10, radius: 4, fill: 'status/success/bg', stretch: true, ai: 'CENTER' });
    IC(ok, 'check', 14, 'status/success/text');
    T(ok, 'Plan approved · building with review on.', 'body-sm', 'status/success/text');
    return;
  }
  const main = F(card, { dir: 'HORIZONTAL', gap: 8, px: 16, py: 12, radius: 4, fill: st === 'Planning' ? 'surface/2' : 'action/default', stretch: true, ai: 'CENTER', name: 'build' });
  main.primaryAxisAlignItems = 'CENTER';
  T(main, st === 'Planning' ? 'Waiting for your edits…' : 'Build the plan', 'body-md', st === 'Planning' ? 'text/muted' : 'action/on');
  if (st !== 'Planning') {
    const opts = F(card, { dir: 'HORIZONTAL', gap: 8, stretch: true, name: 'options' });
    for (const lbl of ['Approve', 'Approve, keep reviewing', 'Keep planning']) {
      const b = F(opts, { px: 14, py: 9, radius: 4, fill: 'surface/1', bstroke: 'border/hairline' });
      T(b, lbl, 'body-md', 'text/default');
    }
  }
}

// ---------------- C4 · Checkpoint timeline ----------------
// Auto-snapshots as markers on the execution timeline. Preview shows what changed;
// restore carries an explicit scope contract.
const CP_POINTS = [
  ['09:42', 'Plan locked'],
  ['09:47', '4 paused'],
  ['09:52', 'Checkpoint'],
  ['09:58', 'Budget hit'],
  ['10:04', 'Now']
];
function buildCheckpointTimeline(c, P) {
  const mode = P.variant, s = P.size, st = P.state;
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 12;
  c.layoutSizingHorizontal = 'FIXED';
  c.resize(560, c.height);
  const tl = F(c, { dir: 'HORIZONTAL', gap: 0, px: 8, stretch: true, ai: 'CENTER', name: 'timeline' });
  CP_POINTS.forEach((p, i) => {
    if (i > 0) {
      const ln = F(tl, { h: 2, fill: i <= 2 ? 'action/default' : 'surface/2' });
      ln.layoutSizingHorizontal = 'FILL';
    }
    const dot = F(tl, { gap: 4, nofill: true, ai: 'CENTER', name: 'cp' });
    const d = i === 2 ? 18 : 12;
    const mk = figma.createEllipse();
    mk.resize(d, d);
    mk.fills = [{ type: 'SOLID', color: hx('#000000') }];
    mk.setBoundVariable('fills', VV[i === 2 ? 'action/default' : i < 2 ? 'status/success/text' : 'surface/3']);
    if (i > 2) {
      mk.strokes = [{ type: 'SOLID', color: hx('#000000') }];
      mk.setBoundVariable('strokes', VV['border/strong']);
      mk.strokeWeight = 1;
    }
    if (i === 2 && st === 'Selected') {
      mk.strokes = [{ type: 'SOLID', color: hx('#000000') }];
      mk.setBoundVariable('strokes', VV['focus/ring']);
      mk.strokeWeight = 2; mk.strokeAlign = 'OUTSIDE';
    }
    dot.appendChild(mk);
    T(dot, p[0], 'code', 'text/muted');
    T(dot, p[1], 'caption', i === 2 ? 'text/default' : 'text/muted');
  });
  if (mode === 'Timeline') return;
  const pv = F(c, { gap: 10, px: 16, py: 16, radius: 4, fill: 'surface/1', bstroke: 'border/hairline', stretch: true, name: 'preview' });
  T(pv, mode === 'Preview' ? 'Preview — files at checkpoint 09:52' : 'Checkpoint 09:52 restored', 'body-md', 'text/default');
  T(pv, '4 files changed since · ad_set_184.json, budget_rules.json, +2 more', 'body-sm', 'text/muted');
  if (mode === 'Preview') {
    const rb = F(pv, { dir: 'HORIZONTAL', gap: 8, px: 14, py: 9, radius: 4, fill: 'action/default', ai: 'CENTER' });
    rb.primaryAxisAlignItems = 'CENTER';
    IC(rb, 'history', 14, 'action/on');
    T(rb, 'Restore checkpoint', 'body-md', 'action/on');
    T(pv, 'Restores files only. Conversation untouched.', 'caption', 'text/muted');
  } else {
    const ok = F(pv, { dir: 'HORIZONTAL', gap: 8, px: 12, py: 10, radius: 4, fill: 'status/success/bg', stretch: true, ai: 'CENTER' });
    IC(ok, 'check', 14, 'status/success/text');
    T(ok, 'Files restored at 09:54. Conversation kept.', 'body-sm', 'status/success/text');
  }
}

// ---------------- C5 · Guarded-apply task board ----------------
// Drafts → Active → Ready → Done. Background work runs isolated; Ready is a
// first-class state — nothing touches the main version until reviewed + applied.
function buildTaskBoard(c, P) {
  const col = P.variant, s = P.size, st = P.state;
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 0;
  c.layoutSizingHorizontal = 'FIXED';
  c.resize(300, c.height);
  const hd = F(c, { dir: 'HORIZONTAL', gap: 8, px: 12, stretch: true, ai: 'CENTER', name: 'col-head' });
  hd.layoutSizingVertical = 'FIXED'; hd.resize(hd.width, 44);
  if (col === 'Ready') hd.setBoundVariable('fills', VV['status/success/bg']);
  T(hd, col, 'body-md', col === 'Ready' ? 'status/success/text' : 'text/default');
  const n = F(hd, { nofill: true }); n.layoutSizingHorizontal = 'FILL';
  T(hd, col === 'Ready' ? '1' : '2', 'caption', 'text/muted');
  const body = F(c, { gap: 8, px: 8, py: 8, stretch: true, fill: 'surface/1', name: 'col-body' });
  function tcard(title, meta, withActions) {
    const t = F(body, { gap: 6, px: 12, py: 12, radius: 4, fill: 'surface/3', stretch: true });
    t.strokes = [{ type: 'SOLID', color: hx('#000000') }];
    t.setBoundVariable('strokes', VV['border/hairline']);
    t.strokeWeight = 1; t.strokeAlign = 'INSIDE';
    T(t, title, 'body-md', 'text/default');
    T(t, meta, 'caption', 'text/muted');
    if (withActions) {
      const r = F(t, { dir: 'HORIZONTAL', gap: 8, stretch: true });
      const ap = F(r, { px: 12, py: 7, radius: 4, fill: 'action/default' });
      T(ap, 'Apply', 'body-sm', 'action/on');
      const di = F(r, { px: 12, py: 7, radius: 4, fill: 'surface/1', bstroke: 'border/hairline' });
      T(di, 'Dismiss', 'body-sm', 'text/default');
    }
  }
  if (col === 'Ready') {
    tcard('Budget reallocation', 'Isolated copy · 2 files changed', true);
    const iso = F(body, { dir: 'HORIZONTAL', gap: 8, px: 12, py: 10, radius: 4, fill: 'status/info/bg', stretch: true, ai: 'CENTER' });
    IC(iso, 'info', 14, 'status/info/text');
    T(iso, 'Isolated — not applied to the main version until you review and apply.', 'caption', 'status/info/text');
  } else if (col === 'Drafts') {
    tcard('Draft ad copy v3', 'Not started');
    tcard('Draft rollback plan', 'Not started');
  } else if (col === 'Active') {
    tcard('Pause 4 ad sets', 'Step 5 of 8 · running');
    tcard('Verify shared budgets', 'Queued');
  } else {
    tcard('Scope lock', 'Approved at 09:42');
    tcard('Checkpoint 09:52', 'Restored once');
  }
  if (st === 'At-capacity') {
    const cap = F(c, { px: 12, stretch: true, name: 'cap' });
    cap.paddingTop = 8; cap.paddingBottom = 8;
    T(cap, 'At capacity (1/1) · the next task queues automatically.', 'caption', 'text/muted');
  }
}

// ---------------- C6 · Steer queue ----------------
// Redirect without interrupting: queued steers inject at the next tool call.
// "Send now" never kills in-flight work.
function buildSteerQueue(c, P) {
  const mode = P.variant, s = P.size, st = P.state;
  const dis = st === 'Disabled';
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 10;
  c.layoutSizingHorizontal = 'FIXED';
  c.resize(480, c.height);
  const bar = F(c, { dir: 'HORIZONTAL', gap: 8, stretch: true, ai: 'CENTER', name: 'input-bar' });
  const inp = F(bar, { dir: 'HORIZONTAL', gap: 8, px: 12, stretch: true, ai: 'CENTER', name: 'input' });
  inp.layoutSizingHorizontal = 'FILL';
  inp.layoutSizingVertical = 'FIXED'; inp.resize(inp.width, 40);
  inp.setBoundVariable('fills', VV['surface/1']);
  inp.strokes = [{ type: 'SOLID', color: hx('#000000') }];
  inp.setBoundVariable('strokes', VV[st === 'Focus' ? 'focus/ring' : 'border/hairline']);
  inp.strokeWeight = st === 'Focus' ? 2 : 1; inp.strokeAlign = 'INSIDE';
  inp.cornerRadius = 4;
  T(inp, mode === 'Empty' ? 'Steer the agent…' : 'Also check weekends', 'body-md', dis ? 'disabled/fg' : 'text/muted');
  const send = F(bar, { dir: 'HORIZONTAL', gap: 8, px: 14, py: 10, radius: 4, fill: dis ? 'disabled/bg' : 'action/default', ai: 'CENTER' });
  send.primaryAxisAlignItems = 'CENTER';
  if (mode === 'Sending') spinner(send, 14, 'action/on');
  T(send, mode === 'Sending' ? 'Sending…' : 'Send now', 'body-md', dis ? 'disabled/fg' : 'action/on');
  if (mode !== 'Empty') {
    const q = F(c, { gap: 0, stretch: true, fill: 'surface/1', radius: 4, bstroke: 'border/hairline', name: 'queue' });
    const items = mode === 'Sending'
      ? ['Skip ad_set_306 for now', 'Also check weekends · sending at next tool call…']
      : ['Skip ad_set_306 for now', 'Also check weekends'];
    items.forEach((txt, i) => {
      const r = F(q, { dir: 'HORIZONTAL', gap: 8, px: 12, stretch: true, ai: 'CENTER' });
      r.paddingTop = 9; r.paddingBottom = 9;
      IC(r, 'list', 14, 'text/muted');
      T(r, txt, 'body-md', 'text/default');
      const sp = F(r, { nofill: true }); sp.layoutSizingHorizontal = 'FILL';
      if (!(mode === 'Sending' && i === 1)) IC(r, 'x', 14, 'text/muted');
      if (i < items.length - 1) HR(q, 'border/hairline');
    });
  }
  T(c, 'Queued steers inject at the next tool call — in-flight work is not stopped.', 'caption', 'text/muted');
}

// ---------------- C7 · Escalation package card ----------------
// Handoff that always ships: best-effort draft + full context + the specific
// reason. The human never starts from zero.
const ESC = {
  'Low-confidence': ['Confidence 41% — knowledge-base coverage below the 60% threshold.', 'flag'],
  'Out-of-capability': ['Request needs a refund over $500 — outside agent authority.', 'shield-alert'],
  'User-requested': ['Customer asked for a human twice in this thread.', 'user'],
  'Policy-blocked': ['Contains payment details — policy blocks agent handling.', 'shield-check']
};
function buildEscalationCard(c, P) {
  const reason = P.variant, s = P.size, st = P.state;
  const W = s === 'Compact' ? 440 : 560;
  const [why, icon] = ESC[reason];
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 0;
  c.layoutSizingHorizontal = 'FIXED';
  c.resize(W, c.height);
  const card = F(c, { gap: 12, px: 20, py: 20, radius: 8, fill: 'surface/3', stretch: true, name: 'card' });
  card.strokes = [{ type: 'SOLID', color: hx('#000000') }];
  card.setBoundVariable('strokes', VV['border/hairline']);
  card.strokeWeight = 1; card.strokeAlign = 'INSIDE';
  T(card, 'ESCALATION · needs a human', 'overline', 'status/warning/text');
  const hd = F(card, { dir: 'HORIZONTAL', gap: 8, stretch: true, ai: 'CENTER' });
  IC(hd, icon, 16, 'status/warning/text');
  T(hd, 'Draft reply ready for review', 'h4', 'text/default');
  const rs = F(card, { dir: 'HORIZONTAL', gap: 8, px: 12, py: 10, radius: 4, fill: 'status/warning/bg', stretch: true, ai: 'CENTER' });
  T(rs, 'Why: ' + why, 'body-sm', 'status/warning/text');
  T(card, 'Full history attached · 14 messages · customer Acme Inc (Enterprise).', 'caption', 'text/muted');
  const draft = F(card, { px: 12, py: 10, radius: 4, fill: 'surface/1', bstroke: 'border/hairline', stretch: true });
  T(draft, '"Thanks for flagging this — I have paused the budget change and a specialist will confirm the reallocation within 2 hours."', 'body-md', 'text/default');
  if (st === 'Resolved') {
    const ok = F(card, { dir: 'HORIZONTAL', gap: 8, px: 12, py: 10, radius: 4, fill: 'status/success/bg', stretch: true, ai: 'CENTER' });
    IC(ok, 'check', 14, 'status/success/text');
    T(ok, 'Sent by Maya Chen at 10:12.', 'body-sm', 'status/success/text');
    return;
  }
  const acts = F(card, { dir: 'HORIZONTAL', gap: 8, stretch: true, ai: 'CENTER', name: 'actions' });
  const defs = [['Send as-is', true], ['Edit & send', false], ['Write fresh', false], ['Mark for training', false]];
  for (const [lbl, primary] of defs) {
    const b = F(acts, { dir: 'HORIZONTAL', gap: 8, px: 12, py: 9, radius: 4, ai: 'CENTER' });
    b.primaryAxisAlignItems = 'CENTER';
    if (st === 'Sending' && primary) spinner(b, 14, 'action/on');
    if (primary) b.setBoundVariable('fills', VV[st === 'Sending' ? 'action/active' : 'action/default']);
    else {
      b.setBoundVariable('fills', VV['surface/1']);
      b.strokes = [{ type: 'SOLID', color: hx('#000000') }];
      b.setBoundVariable('strokes', VV['border/hairline']);
      b.strokeWeight = 1; b.strokeAlign = 'INSIDE';
    }
    T(b, st === 'Sending' && primary ? 'Sending…' : lbl, 'body-md', primary ? 'action/on' : 'text/default');
  }
}

// ---------------- C8 · Cost meter ----------------
// Token / cost / outcome spend bar with a budget threshold tick.
// (Devin ships no first-party cost meter — this is the gap.)
const CM = {
  Token: ['Session tokens', '48,210 / 100,000 tokens', 0.48],
  Cost: ['Session spend', '$4.20 of $10.00', 0.42],
  Outcome: ['Outcomes', '12 of 40 resolutions', 0.30]
};
const CM_CAP = {
  'Normal': 'On track for this session.',
  'Near-limit': '80% of budget used — the next actions will ask first.',
  'Over-limit': 'Over budget — the agent is paused until you approve more.',
  'Paused': 'Paused — spend is frozen.'
};
function buildCostMeter(c, P) {
  const mode = P.variant, s = P.size, st = P.state;
  const [label, value, frac] = CM[mode];
  const W = s === 'Small' ? 240 : 320;
  const over = st === 'Over-limit', near = st === 'Near-limit';
  const tok = over ? 'status/danger/text' : near ? 'status/warning/text' : st === 'Paused' ? 'text/muted' : 'action/default';
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.itemSpacing = 8;
  c.layoutSizingHorizontal = 'FIXED';
  c.resize(W, c.height);
  const lr = F(c, { dir: 'HORIZONTAL', gap: 8, stretch: true, ai: 'CENTER' });
  IC(lr, 'wallet', 14, over ? 'status/danger/text' : 'text/muted');
  const lt = F(lr, { gap: 0, nofill: true }); lt.layoutSizingHorizontal = 'FILL';
  T(lt, label, 'caption', 'text/muted');
  T(lr, value, 'body-sm', over ? 'status/danger/text' : 'text/default');
  const track = F(c, { h: 6, stretch: true, fill: 'surface/2', radius: 999, name: 'track' });
  const fl = F(track, { w: Math.max(8, Math.round(W * Math.min(frac, 1))), h: 6, fill: tok, radius: 999 });
  fl.layoutPositioning = 'ABSOLUTE'; fl.x = 0; fl.y = 0;
  const tick = F(track, { w: 2, h: 10, fill: 'text/muted' });
  tick.layoutPositioning = 'ABSOLUTE'; tick.x = Math.round(W * 0.8); tick.y = -2;
  T(c, CM_CAP[st], 'caption', over ? 'status/danger/text' : near ? 'status/warning/text' : 'text/muted');
}

// ---------------- component catalogue ----------------
const DEFS = [
  { name: 'Controls / Button', vname: 'Intent', section: 'Controls', variants: ['Primary', 'Secondary', 'Tertiary', 'Danger'], sizes: ['Small', 'Medium', 'Large'], states: ['Default', 'Hover', 'Active', 'Focus', 'Disabled', 'Loading'], build: buildButton },
  { name: 'Controls / Icon button', vname: 'Intent', section: 'Controls', variants: ['Secondary', 'Tertiary', 'Danger'], sizes: ['Small', 'Medium', 'Large'], states: ['Default', 'Hover', 'Active', 'Focus', 'Disabled', 'Loading'], build: buildIconButton },
  { name: 'Controls / Text input', vname: 'Type', section: 'Controls', variants: ['Text', 'Email', 'Number', 'Password'], sizes: ['Small', 'Medium', 'Large'], states: ['Empty', 'Filled', 'Hover', 'Focus', 'Error', 'Disabled', 'Read-only'], build: buildTextInput },
  { name: 'Controls / Textarea', vname: 'Behavior', section: 'Controls', variants: ['Fixed', 'Auto-grow'], sizes: ['Medium', 'Large'], states: ['Empty', 'Filled', 'Focus', 'Error', 'Disabled', 'Read-only'], build: buildTextarea },
  { name: 'Controls / Toggle', vname: 'Label', section: 'Controls', variants: ['Label-left', 'Label-right'], sizes: ['Small', 'Medium'], states: ['Off', 'On', 'Hover', 'Focus', 'Disabled'], build: buildToggle },
  { name: 'Controls / Checkbox', vname: 'Style', section: 'Controls', variants: ['Plain', 'Description'], sizes: ['Small', 'Medium'], states: ['Unchecked', 'Checked', 'Mixed', 'Hover', 'Focus', 'Disabled', 'Error'], build: buildCheckbox },
  { name: 'Controls / Radio', vname: 'Style', section: 'Controls', variants: ['Plain', 'Description'], sizes: ['Small', 'Medium'], states: ['Unchecked', 'Checked', 'Hover', 'Focus', 'Disabled', 'Error'], build: buildRadio },
  { name: 'Controls / Select', vname: 'Mode', section: 'Controls', variants: ['Single', 'Multi'], sizes: ['Small', 'Medium', 'Large'], states: ['Empty', 'Filled', 'Open', 'Focus', 'Error', 'Disabled', 'Loading'], build: buildSelect },
  { name: 'Controls / Search', vname: 'Context', section: 'Controls', variants: ['Standalone', 'Command', 'Table'], sizes: ['Small', 'Medium', 'Large'], states: ['Empty', 'Typing', 'Results', 'No-results', 'Loading', 'Disabled'], build: buildSearch },
  { name: 'Signals / Status label', vname: 'Condition', section: 'Signals', variants: ['Neutral', 'Info', 'Success', 'Warning', 'Danger'], sizes: ['Small', 'Medium'], states: ['Default', 'Strong', 'Disabled'], build: buildStatusLabel },
  { name: 'Signals / Confidence', vname: 'Level', section: 'Signals', variants: ['Low', 'Medium', 'High', 'Unknown'], sizes: ['Small', 'Medium'], states: ['Default', 'Loading', 'Unavailable'], build: buildConfidence },
  { name: 'Data rows / Actor row', vname: 'Actor', section: 'Data rows', variants: ['Agent', 'User', 'System', 'Team'], sizes: ['Compact', 'Default'], states: ['Default', 'Selected', 'Disabled'], build: buildActorRow },
  { name: 'Data rows / Key-value row', vname: 'Format', section: 'Data rows', variants: ['Text', 'Number', 'Currency', 'Date', 'Link'], sizes: ['Compact', 'Default'], states: ['Default', 'Changed', 'Warning', 'Disabled'], build: buildKeyValueRow },
  { name: 'Data rows / Event row', vname: 'Kind', section: 'Data rows', variants: ['Info', 'Success', 'Warning', 'Error', 'System', 'Narration', 'Subagent'], sizes: ['Compact', 'Default'], states: ['Default', 'Hover', 'Selected', 'Expanded'], build: buildEventRow },
  { name: 'Data rows / Table', vname: 'Behavior', section: 'Data rows', variants: ['Plain', 'Selectable', 'Sortable', 'Expandable'], sizes: ['Compact', 'Default'], states: ['Loading', 'Populated', 'Empty', 'Error', 'Offline'], build: buildTable },
  { name: 'Feedback / Alert strip', vname: 'Tone', section: 'Feedback', variants: ['Info', 'Success', 'Warning', 'Danger'], sizes: ['Compact', 'Default'], states: ['Static', 'Dismissible', 'With-action'], build: buildAlertStrip },
  { name: 'Feedback / Toast', vname: 'Tone', section: 'Feedback', variants: ['Info', 'Success', 'Warning', 'Danger'], sizes: ['Default'], states: ['Timed', 'Persistent', 'With-action', 'Dismissing'], build: buildToast },
  { name: 'Feedback / Tooltip', vname: 'Placement', section: 'Feedback', variants: ['Top', 'Right', 'Bottom', 'Left'], sizes: ['Small', 'Medium'], states: ['Hidden', 'Visible'], build: buildTooltip },
  { name: 'Feedback / Progress', vname: 'Mode', section: 'Feedback', variants: ['Determinate', 'Indeterminate', 'Segmented'], sizes: ['Small', 'Medium'], states: ['Running', 'Paused', 'Success', 'Error'], build: buildProgress },
  { name: 'Feedback / Skeleton', vname: 'Shape', section: 'Feedback', variants: ['Text', 'Row', 'Panel', 'Table'], sizes: ['Small', 'Medium', 'Large'], states: ['Loading', 'Reduced-motion'], build: buildSkeleton },
  { name: 'Feedback / Spinner', vname: 'Context', section: 'Feedback', variants: ['Inline', 'Control', 'Page'], sizes: ['Small', 'Medium', 'Large'], states: ['Active', 'Reduced-motion'], build: buildSpinner },
  { name: 'Navigation / Tabs', vname: 'Style', section: 'Navigation', variants: ['Underline', 'Contained'], sizes: ['Small', 'Medium'], states: ['Default', 'Hover', 'Selected', 'Focus', 'Disabled'], build: buildTabs },
  { name: 'Navigation / Breadcrumb', vname: 'Style', section: 'Navigation', variants: ['Text', 'Overflow'], sizes: ['Small', 'Medium'], states: ['Default', 'Hover', 'Focus', 'Current'], build: buildBreadcrumb },
  { name: 'Navigation / Pagination', vname: 'Style', section: 'Navigation', variants: ['Pages', 'Simple', 'Cursor'], sizes: ['Small', 'Medium'], states: ['Default', 'Hover', 'Focus', 'Disabled', 'Loading'], build: buildPagination },
  { name: 'Identity / Avatar', vname: 'Kind', section: 'Identity', variants: ['Initial', 'Image', 'Agent', 'Team'], sizes: ['XS', 'SM', 'MD', 'LG'], states: ['Default', 'Online', 'Offline', 'Unavailable'], build: buildAvatar },
  { name: 'Overlays / Popover', vname: 'Content', section: 'Overlays', variants: ['Menu', 'Form', 'Detail'], sizes: ['Small', 'Medium', 'Large'], states: ['Closed', 'Open', 'Focus-within', 'Error'], build: buildPopover },
  { name: 'Overlays / Dialog', vname: 'Purpose', section: 'Overlays', variants: ['Confirm', 'Danger', 'Form'], sizes: ['Small', 'Medium', 'Large'], states: ['Closed', 'Open', 'Submitting', 'Error'], build: buildDialog },
  { name: 'Overlays / Drawer', vname: 'Purpose', section: 'Overlays', variants: ['Detail', 'Review', 'Takeover'], sizes: ['Small', 'Medium', 'Large'], states: ['Closed', 'Open', 'Loading', 'Error', 'Read-only'], build: buildDrawer },
  { name: 'Overlays / Shortcut help', vname: 'Format', section: 'Overlays', variants: ['Panel', 'Bar'], sizes: ['Default'], states: ['Default'], build: buildShortcutHelp },
  { name: 'Approvals / Approval request', vname: 'Action', section: 'Approvals', variants: ['Command', 'Budget', 'External'], sizes: ['Default', 'Compact'], states: ['Default', 'Editing', 'Unprotected', 'Approved', 'Denied', 'Resolved', 'Error'], build: buildApprovalRequest },
  { name: 'Approvals / Autonomy mode selector', vname: 'Mode', section: 'Approvals', variants: ['Ask-every-time', 'Allowlist', 'Auto-for-session', 'Full-auto'], sizes: ['Default', 'Compact'], states: ['Default', 'Focus', 'Disabled'], build: buildAutonomySelector },
  { name: 'Workspace / Composer', vname: 'Verb', section: 'Workspace', variants: ['Code', 'Ask'], sizes: ['Default', 'Compact'], states: ['Default', 'Working', 'Focus', 'Disabled'], build: buildComposer },
  { name: 'Workspace / Status bar', vname: 'Content', section: 'Workspace', variants: ['Run'], sizes: ['Default'], states: ['Default', 'Paused'], build: buildStatusBar },
  { name: 'Workspace / Layout frames', vname: 'Layout', section: 'Workspace', variants: ['Three-frame'], sizes: ['Desktop'], states: ['Default'], build: buildLayoutFrames },
  { name: 'Workspace / Resize handle', vname: 'State', section: 'Workspace', variants: ['Idle', 'Hover'], sizes: ['Default'], states: ['Default'], build: buildResizeHandle },
  { name: 'Approvals / Plan approval card', vname: 'Action', section: 'Approvals', variants: ['Review', 'Editing'], sizes: ['Default', 'Large'], states: ['Default', 'Approved', 'Planning'], build: buildPlanCard },
  { name: 'Supervision / Checkpoint timeline', vname: 'State', section: 'Supervision', variants: ['Timeline', 'Preview', 'Restored'], sizes: ['Default'], states: ['Default', 'Hover', 'Selected'], build: buildCheckpointTimeline },
  { name: 'Supervision / Execution timeline', vname: 'Row', section: 'Supervision', variants: ['Step', 'Summary', 'Effort', 'Error'], sizes: ['Default'], states: ['Default', 'Expanded', 'Running'], build: buildExecutionTimeline },
  { name: 'Supervision / Checkpoint marker', vname: 'Kind', section: 'Supervision', variants: ['Saved', 'Selected', 'Restored'], sizes: ['Default'], states: ['Default'], build: buildCheckpointMarker },
  { name: 'Supervision / Guarded-apply task board', vname: 'Column', section: 'Supervision', variants: ['Drafts', 'Active', 'Ready', 'Done'], sizes: ['Default'], states: ['Default', 'At-capacity'], build: buildTaskBoard },
  { name: 'Supervision / Steer queue', vname: 'State', section: 'Supervision', variants: ['Empty', 'Queued', 'Sending'], sizes: ['Default'], states: ['Default', 'Focus', 'Disabled'], build: buildSteerQueue },
  { name: 'Handoff / Escalation package card', vname: 'Reason', section: 'Handoff', variants: ['Low-confidence', 'Out-of-capability', 'User-requested', 'Policy-blocked'], sizes: ['Default', 'Compact'], states: ['Default', 'Sending', 'Resolved'], build: buildEscalationCard },
  { name: 'Review / Review bar', vname: 'State', section: 'Review', variants: ['Default'], sizes: ['Default'], states: ['Default', 'Disabled'], build: buildReviewBar },
  { name: 'Review / Diff viewer', vname: 'Placement', section: 'Review', variants: ['Docked'], sizes: ['Default', 'Compact'], states: ['Default', 'Asked'], build: buildDiffViewer },
  { name: 'Signals / Cost meter', vname: 'Mode', section: 'Signals', variants: ['Token', 'Cost', 'Outcome'], sizes: ['Small', 'Medium'], states: ['Normal', 'Near-limit', 'Over-limit', 'Paused'], build: buildCostMeter },
  { name: 'Core / Task board (kanban)', vname: 'Scope', section: 'Core', variants: ['Roadmap'], sizes: ['Default'], states: ['Planned'], build: coreShell('Task board (kanban)', 'Draft → Active → Ready → Done. Columns are approval gates; background work never touches the main version until reviewed.') },
  { name: 'Core / Session list', vname: 'Scope', section: 'Core', variants: ['Roadmap'], sizes: ['Default'], states: ['Planned'], build: coreShell('Session list', 'Child sessions indent under parents; sessions group by status, then by time.') },
  { name: 'Core / Inspector panel', vname: 'Scope', section: 'Core', variants: ['Roadmap'], sizes: ['Default'], states: ['Planned'], build: coreShell('Inspector panel', 'Right inspector: attention items, success criteria, artifacts, agent summary.') },
  { name: 'Core / Artifact tabs', vname: 'Scope', section: 'Core', variants: ['Roadmap'], sizes: ['Default'], states: ['Planned'], build: coreShell('Artifact tabs', 'Terminal / Editor / Browser as one region\u2019s live evidence surfaces.') },
  { name: 'Core / Background tasks', vname: 'Scope', section: 'Core', variants: ['Roadmap'], sizes: ['Default'], states: ['Planned'], build: coreShell('Background tasks', 'Rows below the composer; long commands never block input.') },
  { name: 'Core / Schedules page', vname: 'Scope', section: 'Core', variants: ['Roadmap'], sizes: ['Default'], states: ['Planned'], build: coreShell('Schedules page', 'Clock-icon recurrence on messages; every recurring task in one place.') },
  { name: 'Core / Span inspector', vname: 'Scope', section: 'Core', variants: ['Roadmap'], sizes: ['Default'], states: ['Planned'], build: coreShell('Span inspector', 'Run tree + waterfall + span panel: inputs, outputs, latency, tokens, cost, errors.') },
  { name: 'Core / Browser takeover', vname: 'Scope', section: 'Core', variants: ['Roadmap'], sizes: ['Default'], states: ['Planned'], build: coreShell('Browser takeover', 'Credential entry visibly out of the agent\u2019s sight; capture pauses.') }
];

function buildComponents(page) {
  const cursor = { y: 0 };
  const order = ['Controls', 'Workspace', 'Approvals', 'Signals', 'Data rows', 'Supervision', 'Review', 'Handoff', 'Feedback', 'Navigation', 'Identity', 'Overlays', 'Core'];
  for (const secName of order) {
    const secFrame = compSection(page, secName, cursor);
    for (const def of DEFS.filter(d => d.section === secName)) {
      const label = F(secFrame, { gap: 6, nofill: true, name: 'label / ' + def.name });
      T(label, def.name, 'h4', 'text/default');
      T(label, def.variants.length + ' × ' + def.sizes.length + ' × ' + def.states.length + ' variants · ' + def.vname + ' / Size / State', 'caption', 'text/muted');
      buildSet(secFrame, def);
    }
    cursor.y = secFrame.y + secFrame.height + 120;
  }
}

// ---------------- templates ----------------
function inst(setName, props, parent) {
  const set = SETS[setName];
  const i = set.defaultVariant.createInstance();
  i.setProperties(props);
  parent.appendChild(i);
  return i;
}
// override the first text node of an instance (safe no-op if unsupported)
function setLabel(instance, text) {
  try {
    const t = instance.findOne(n => n.type === 'TEXT');
    if (t) t.characters = text;
  } catch (e) { /* keep default label */ }
}

function shell(page, name) {
  const f = figma.createFrame();
  f.name = name;
  f.layoutMode = 'HORIZONTAL';
  f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'FIXED';
  f.resize(1440, 960);
  f.setBoundVariable('fills', VV['surface/0']);
  f.itemSpacing = 0;
  f.clipsContent = true;
  page.appendChild(f);
  // sidebar 232
  const sb = F(f, { gap: 4, fill: 'surface/1', bstroke: 'border/hairline', name: 'sidebar' });
  sb.layoutSizingHorizontal = 'FIXED'; sb.layoutSizingVertical = 'FIXED';
  sb.resize(232, 960);
  sb.paddingTop = 20; sb.paddingBottom = 20; sb.paddingLeft = 16; sb.paddingRight = 16;
  const brand = F(sb, { dir: 'HORIZONTAL', gap: 8, nofill: true, ai: 'CENTER' });
  const mark = F(brand, { w: 24, h: 24, fill: 'action/default', radius: 6 });
  mark.layoutSizingHorizontal = 'FIXED'; mark.layoutSizingVertical = 'FIXED';
  T(brand, 'Agentic UX Lite', 'body-md', 'text/default');
  const nav = F(sb, { gap: 2, nofill: true }); nav.paddingTop = 16;
  for (const [n, active, ic] of [['Runs', true, 'list'], ['Approvals', false, 'shield-check'], ['Activity', false, 'activity']]) {
    const it = F(nav, { dir: 'HORIZONTAL', gap: 8, px: 12, py: 8, radius: 4, stretch: true, ai: 'CENTER' });
    if (active) it.setBoundVariable('fills', VV['surface/2']);
    IC(it, ic, 14, active ? 'text/default' : 'text/muted');
    T(it, n, 'body-md', active ? 'text/default' : 'text/muted');
  }
  const spacer = F(sb, { nofill: true }); spacer.layoutSizingVertical = 'FILL';
  T(sb, 'v0.1 · Lite', 'caption', 'text/muted');
  // content 1120 inside 1208
  const ct = F(f, { gap: 24, nofill: true, name: 'content' });
  ct.layoutSizingHorizontal = 'FIXED'; ct.layoutSizingVertical = 'FIXED';
  ct.resize(1208, 960);
  ct.paddingTop = 32; ct.paddingBottom = 32; ct.paddingLeft = 44; ct.paddingRight = 44;
  const inner = F(ct, { gap: 20, nofill: true, name: 'inner' });
  inner.layoutSizingHorizontal = 'FIXED';
  inner.resize(1120, inner.height);
  return { frame: f, inner: inner };
}

function tpl01(page) {
  const sh = shell(page, '01 / Scenario queue / Default');
  const inner = sh.inner;
  const tr = F(inner, { dir: 'HORIZONTAL', gap: 12, nofill: true, ai: 'CENTER', stretch: true });
  const tt = F(tr, { gap: 4, nofill: true }); tt.layoutSizingHorizontal = 'FILL';
  T(tt, 'Runs', 'h1', 'text/default');
  T(tt, '12 runs · production', 'body-md', 'text/muted');
  const nb = inst('Controls / Button', { Intent: 'Primary', Size: 'Medium', State: 'Default' }, tr);
  setLabel(nb, 'New run');
  const fb = F(inner, { dir: 'HORIZONTAL', gap: 12, nofill: true, ai: 'CENTER', stretch: true });
  inst('Controls / Search', { Context: 'Table', Size: 'Medium', State: 'Empty' }, fb);
  inst('Controls / Select', { Mode: 'Single', Size: 'Medium', State: 'Filled' }, fb);
  const ow = inst('Controls / Select', { Mode: 'Single', Size: 'Medium', State: 'Empty' }, fb);
  const cb = inst('Controls / Button', { Intent: 'Tertiary', Size: 'Medium', State: 'Default' }, fb);
  setLabel(cb, 'Clear 2');
  inst('Data rows / Table', { Behavior: 'Selectable', Size: 'Default', State: 'Populated' }, inner);
  const ft = F(inner, { dir: 'HORIZONTAL', gap: 12, nofill: true, ai: 'CENTER', stretch: true });
  const fl = F(ft, { nofill: true }); fl.layoutSizingHorizontal = 'FILL';
  T(fl, '1 selected across this page', 'caption', 'text/muted');
  inst('Navigation / Pagination', { Style: 'Simple', Size: 'Medium', State: 'Default' }, ft);
}

function tpl02(page) {
  const sh = shell(page, '02 / Approval request / High impact');
  const inner = sh.inner;
  const tr = F(inner, { dir: 'HORIZONTAL', gap: 12, nofill: true, ai: 'CENTER', stretch: true });
  const tt = F(tr, { gap: 4, nofill: true }); tt.layoutSizingHorizontal = 'FILL';
  T(tt, 'Approval required', 'h1', 'text/default');
  T(tt, 'Pause 8 underperforming ad sets', 'h3', 'text/default');
  T(tt, 'Optimization agent · requested today at 09:42', 'body-md', 'text/muted');
  inst('Signals / Status label', { Condition: 'Warning', Size: 'Medium', State: 'Default' }, tr);
  HR(inner, 'border/hairline');
  const rows = [['Objects', '8 active ad sets'], ['Budget affected', '$4,820 per day'], ['Starts', 'Immediately after approval'], ['Recovery', 'Restore paused ads within 24 hours']];
  for (const [k, v] of rows) {
    const r = F(inner, { dir: 'HORIZONTAL', gap: 16, nofill: true, stretch: true });
    const kl = F(r, { w: 160, nofill: true }); kl.layoutSizingHorizontal = 'FIXED';
    T(kl, k, 'body-md', 'text/muted');
    T(r, v, 'body-md', 'text/default');
  }
  HR(inner, 'border/hairline');
  T(inner, 'Evidence and limitations', 'overline', 'text/muted');
  T(inner, 'CPA has remained 36% above the $42 target for 48 hours.', 'body-md', 'text/default');
  T(inner, 'Conversion reporting is delayed by up to 3 hours, so the newest 17 conversions are not included.', 'body-md', 'text/muted');
  inst('Signals / Confidence', { Level: 'Medium', Size: 'Medium', State: 'Default' }, inner);
  T(inner, 'Alternative: reduce budgets by 20% and review in 6 hours.', 'body-md', 'text/muted');
  T(inner, 'Decision will be recorded with your name and time.', 'caption', 'text/muted');
  const ft = F(inner, { dir: 'HORIZONTAL', gap: 12, nofill: true, stretch: true });
  ft.primaryAxisAlignItems = 'END';
  const rj = inst('Controls / Button', { Intent: 'Secondary', Size: 'Medium', State: 'Default' }, ft);
  setLabel(rj, 'Reject');
  inst('Controls / Button', { Intent: 'Primary', Size: 'Medium', State: 'Default' }, ft);
}

function tpl03(page) {
  const sh = shell(page, '03 / Approval blocked / No permission');
  const inner = sh.inner;
  const tr = F(inner, { dir: 'HORIZONTAL', gap: 12, nofill: true, ai: 'CENTER', stretch: true });
  const tt = F(tr, { gap: 4, nofill: true }); tt.layoutSizingHorizontal = 'FILL';
  T(tt, 'Approval required', 'h1', 'text/default');
  T(tt, 'Pause 8 underperforming ad sets', 'h3', 'text/default');
  T(tt, 'Optimization agent · requested today at 09:42', 'body-md', 'text/muted');
  const sl = inst('Signals / Status label', { Condition: 'Neutral', Size: 'Medium', State: 'Default' }, tr);
  setLabel(sl, 'No permission');
  HR(inner, 'border/hairline');
  inst('Feedback / Alert strip', { Tone: 'Danger', Size: 'Default', State: 'With-action' }, inner);
  T(inner, 'You can only view this request. Ask the workspace owner for the Campaign admin role to approve or reject it.', 'body-md', 'text/default');
  const ft = F(inner, { dir: 'HORIZONTAL', gap: 12, nofill: true, stretch: true });
  ft.primaryAxisAlignItems = 'END';
  const ask = inst('Controls / Button', { Intent: 'Secondary', Size: 'Medium', State: 'Default' }, ft);
  setLabel(ask, 'Ask workspace owner');
  inst('Controls / Button', { Intent: 'Primary', Size: 'Medium', State: 'Disabled' }, ft);
}

const EV_ROWS = [
  ['09:47:03', '01/08', 'Loaded', '8 active ad sets · scope locked', 'OK', 'status/info/text'],
  ['09:47:08', '02/08', 'Paused', 'ad_set_184 · spend $610/day', 'REVERSIBLE', 'status/success/text'],
  ['09:47:12', '03/08', 'Paused', 'ad_set_219 · spend $540/day', 'REVERSIBLE', 'status/success/text'],
  ['09:47:18', '04/08', 'Paused', 'ad_set_306 · spend $720/day', 'REVERSIBLE', 'status/success/text'],
  ['09:47:25', '05/08', 'Paused', 'ad_set_411 · spend $490/day', 'REVERSIBLE', 'status/success/text'],
  ['09:47:31', '06/08', 'Shared budget detected', '4 campaigns affected', 'REVIEW', 'status/warning/text'],
  ['09:47:32', 'SYSTEM', 'Run paused', 'before changing shared-budget group', 'PAUSED', 'text/muted'],
  ['—', '07/08', 'ad_set_507', 'no change made', 'NOT STARTED', 'text/muted'],
  ['—', '08/08', 'ad_set_618', 'no change made', 'NOT STARTED', 'text/muted']
];
function tpl04(page) {
  const sh = shell(page, '04 / Execution log / Paused');
  const inner = sh.inner;
  T(inner, 'RUN 2841 · campaign_optimization · production', 'overline', 'text/muted');
  const tr = F(inner, { dir: 'HORIZONTAL', gap: 12, nofill: true, ai: 'CENTER', stretch: true });
  const tt = F(tr, { gap: 4, nofill: true }); tt.layoutSizingHorizontal = 'FILL';
  T(tt, 'Execution log', 'h1', 'text/default');
  inst('Signals / Status label', { Condition: 'Warning', Size: 'Medium', State: 'Default' }, tr);
  const log = F(inner, { gap: 0, stretch: true, fill: 'surface/1', radius: 4, bstroke: 'border/hairline', name: 'log' });
  EV_ROWS.forEach((r, i) => {
    const row = F(log, { dir: 'HORIZONTAL', gap: 12, px: 12, stretch: true, ai: 'CENTER' });
    row.paddingTop = 7; row.paddingBottom = 7;
    T(row, r[0], 'code', 'text/muted');
    T(row, r[1], 'code', 'text/muted');
    T(row, r[2], 'body-sm', 'text/default');
    T(row, r[3], 'body-sm', 'text/muted');
    const sp = F(row, { nofill: true }); sp.layoutSizingHorizontal = 'FILL';
    T(row, r[4], 'caption', r[5]);
    if (i < EV_ROWS.length - 1) HR(log, 'border/hairline');
  });
  const ps = inst('Feedback / Alert strip', { Tone: 'Warning', Size: 'Default', State: 'Static' }, inner);
  setLabel(ps, 'Paused at 06/08 — 4 completed · 2 blocked · 2 not started.');
  const ft = F(inner, { dir: 'HORIZONTAL', gap: 12, nofill: true, stretch: true });
  ft.primaryAxisAlignItems = 'END';
  const u = inst('Controls / Button', { Intent: 'Secondary', Size: 'Medium', State: 'Default' }, ft);
  setLabel(u, 'Undo 4 changes');
  const t = inst('Controls / Button', { Intent: 'Primary', Size: 'Medium', State: 'Default' }, ft);
  setLabel(t, 'Take over');
}

function tpl05(page) {
  const sh = shell(page, '05 / Undo failed / Partial');
  const inner = sh.inner;
  const tr = F(inner, { dir: 'HORIZONTAL', gap: 12, nofill: true, ai: 'CENTER', stretch: true });
  const tt = F(tr, { gap: 4, nofill: true }); tt.layoutSizingHorizontal = 'FILL';
  T(tt, 'Undo run 2841', 'h1', 'text/default');
  T(tt, '3 of 4 items restored.', 'h3', 'text/default');
  const sl = inst('Signals / Status label', { Condition: 'Warning', Size: 'Medium', State: 'Default' }, tr);
  setLabel(sl, 'Partial');
  HR(inner, 'border/hairline');
  T(inner, 'Failed item', 'overline', 'text/muted');
  const fr = F(inner, { dir: 'HORIZONTAL', gap: 12, px: 12, py: 12, radius: 4, fill: 'status/danger/bg', stretch: true, ai: 'CENTER' });
  IC(fr, 'x', 16, 'status/danger/text');
  const ft2 = F(fr, { gap: 4, nofill: true }); ft2.layoutSizingHorizontal = 'FILL';
  T(ft2, 'ad_set_507 — restore failed: budget was already reallocated during the pause.', 'body-md', 'status/danger/text');
  T(ft2, 'Remediation: reassign the budget manually in Ads Manager, then mark resolved.', 'body-sm', 'status/danger/text');
  const ft = F(inner, { dir: 'HORIZONTAL', gap: 12, nofill: true, stretch: true });
  ft.primaryAxisAlignItems = 'END';
  const d = inst('Controls / Button', { Intent: 'Tertiary', Size: 'Medium', State: 'Default' }, ft);
  setLabel(d, 'Dismiss');
  const t = inst('Controls / Button', { Intent: 'Primary', Size: 'Medium', State: 'Default' }, ft);
  setLabel(t, 'Take over remaining item');
}

function tpl06(page) {
  const sh = shell(page, '06 / Takeover drawer / Requested');
  const inner = sh.inner;
  const wrap = F(inner, { dir: 'HORIZONTAL', gap: 24, nofill: true, stretch: true });
  const ctx = F(wrap, { gap: 12, nofill: true });
  ctx.layoutSizingHorizontal = 'FILL';
  T(ctx, 'RUN 2841 · campaign_optimization', 'overline', 'text/muted');
  T(ctx, 'Waiting for control decision', 'h2', 'text/default');
  T(ctx, 'Run context stays visible while you decide. The agent is paused and read-only.', 'body-md', 'text/muted');
  const mini = F(ctx, { gap: 0, stretch: true, fill: 'surface/1', radius: 4, bstroke: 'border/hairline' });
  const mrows = [
    ['09:47:25', 'Paused ad_set_411 · $490/day', 'REVERSIBLE'],
    ['09:47:31', 'Shared budget detected · 4 campaigns', 'REVIEW'],
    ['09:47:32', 'Run paused · waiting for owner', 'PAUSED']
  ];
  mrows.forEach((r, i) => {
    const row = F(mini, { dir: 'HORIZONTAL', gap: 12, px: 12, stretch: true, ai: 'CENTER' });
    row.paddingTop = 8; row.paddingBottom = 8;
    T(row, r[0], 'code', 'text/muted');
    T(row, r[1], 'body-sm', 'text/default');
    const sp = F(row, { nofill: true }); sp.layoutSizingHorizontal = 'FILL';
    T(row, r[2], 'caption', 'text/muted');
    if (i < 2) HR(mini, 'border/hairline');
  });
  inst('Overlays / Drawer', { Purpose: 'Takeover', Size: 'Medium', State: 'Open' }, wrap);
}

function tpl07(page) {
  const sh = shell(page, '07 / Empty state / No matches');
  const inner = sh.inner;
  const c = F(inner, { gap: 12, nofill: true, ai: 'CENTER', stretch: true });
  c.paddingTop = 120;
  T(c, '0', 'display', 'text/muted');
  T(c, 'No runs match these filters', 'h3', 'text/default');
  T(c, 'Clear 2 filters to view 12 other runs, or wait for the next scheduled run.', 'body-md', 'text/muted');
  const b = inst('Controls / Button', { Intent: 'Secondary', Size: 'Medium', State: 'Default' }, c);
  setLabel(b, 'Clear 2 filters');
}

function tpl08(page) {
  const sh = shell(page, '08 / Offline error / Recovery');
  const inner = sh.inner;
  T(inner, 'Runs', 'h1', 'text/default');
  const a = inst('Feedback / Alert strip', { Tone: 'Warning', Size: 'Default', State: 'Static' }, inner);
  setLabel(a, 'Updates stopped at 09:48. The 12 rows below are cached — no run actions were sent.');
  inst('Data rows / Table', { Behavior: 'Plain', Size: 'Default', State: 'Offline' }, inner);
  const ft = F(inner, { dir: 'HORIZONTAL', gap: 12, nofill: true, ai: 'CENTER', stretch: true });
  const r = inst('Controls / Button', { Intent: 'Primary', Size: 'Medium', State: 'Default' }, ft);
  setLabel(r, 'Retry connection');
  const cd = inst('Controls / Button', { Intent: 'Secondary', Size: 'Medium', State: 'Default' }, ft);
  setLabel(cd, 'Copy diagnostics');
  const fl = F(ft, { nofill: true }); fl.layoutSizingHorizontal = 'FILL';
  T(inner, 'Last refreshed 09:52 · Do not approve, cancel, or undo until live status returns.', 'caption', 'status/warning/text');
}

function buildTemplates(page) {
  let y = 0;
  for (const fn of [tpl01, tpl02, tpl03, tpl04, tpl05, tpl06, tpl07, tpl08]) {
    const before = page.children.length;
    fn(page);
    const fr = page.children[page.children.length - 1];
    fr.x = 0; fr.y = y;
    y += 960 + 120;
  }
}

// ---------------- main ----------------
async function main() {
  try {
    figma.notify('Agentic UX Lite: starting build…');
    await loadFonts();
    const pages = makePages();
    figma.notify('Building variables (Primitives + Semantic)…');
    buildVariables();
    buildTextStyles();
    figma.notify('Building foundations + ' + ICONS.length + ' icons…');
    buildIconTemplates();
    buildFoundations(pages[0]);
    figma.notify('Building ' + DEFS.length + ' component sets…');
    buildComponents(pages[1]);
    figma.notify('Building 8 templates…');
    buildTemplates(pages[2]);
    figma.currentPage = pages[0];
    figma.notify('Done — ' + DEFS.length + ' component sets · ' + ICONS.length + ' icons · 8 templates · 2 variable collections.', { timeout: 6000 });
  } catch (e) {
    figma.notify('Build failed: ' + (e && e.message ? e.message : String(e)), { timeout: 8000 });
  } finally {
    figma.closePlugin();
  }
}

main();
