/**
 * Generates a standalone PPTX slide: "API Layer Architecture"
 * Based on docs/wiki/api/demoqa-api-layer.md but agnostic (no demoqa references).
 * Matches M6 visual style: white bg, Aptos, 335B74/1CADE4/66737A.
 *
 * Usage:  node scripts/generate-m6-api-layer-slide.js
 * Output: docs/course/M6-Slide-ApiLayer.pptx
 */

const pptxgen = require('pptxgenjs');

const prs = new pptxgen();
prs.layout = 'LAYOUT_WIDE';

// ── M6 Palette ────────────────────────────────────────────────────────────────
const F = 'Aptos';
const C = {
  bg:       'FFFFFF',
  title:    '335B74',
  accent:   '1CADE4',
  body:     '66737A',
  cardBg:   'EFF4F6',
  hiCardBg: 'E8F7FA',
  border:   'D5DEE2',
  blue:     '2683C6',
  green:    '3E8853',
  amber:    'C07A00',
  red:      'C00000',
};

// ── Layout ────────────────────────────────────────────────────────────────────
const CW   = 3.81;
const CH   = 2.825;
const LEFT = 0.50;
const TOP  = 1.25;
const GAP  = 0.45;
const GAPV = 0.30;
const PAD  = 0.12;
const LH   = 0.20;   // slightly tighter than REST slide for more content

const colX = [LEFT, LEFT + CW + GAP, LEFT + 2 * (CW + GAP)];
const rowY  = [TOP,  TOP + CH + GAPV];

// ── Slide ─────────────────────────────────────────────────────────────────────
const slide = prs.addSlide();
slide.background = { color: C.bg };

// Header
slide.addText('API Layer Architecture', {
  x: 0.55, y: 0.25, w: 12.0, h: 0.45,
  fontSize: 25, bold: true, color: C.title, fontFace: F,
});
slide.addShape(prs.ShapeType.rect, {
  x: 0.55, y: 0.82, w: 1.1, h: 0.07,
  fill: { color: C.accent }, line: { color: C.accent },
});
slide.addText('Decouple HTTP calls from test logic with a layered, typed API client', {
  x: 1.80, y: 0.73, w: 10.8, h: 0.25,
  fontSize: 11, color: C.body, fontFace: F,
});

// ── Helpers (identical to REST slide pattern) ─────────────────────────────────
function addCard(col, row, bg) {
  slide.addShape(prs.ShapeType.roundRect, {
    x: colX[col], y: rowY[row], w: CW, h: CH,
    fill: { color: bg || C.cardBg },
    line: { color: C.border, width: 1.0 },
    rectRadius: 0.07,
  });
}

function addCardTitle(col, row, title) {
  const x = colX[col], y = rowY[row];
  slide.addText(title, {
    x: x + PAD, y: y + PAD, w: CW - 2 * PAD, h: 0.25,
    fontSize: 13, bold: true, color: C.title, fontFace: F,
  });
  slide.addShape(prs.ShapeType.rect, {
    x: x + PAD, y: y + PAD + 0.27, w: (CW - 2 * PAD) * 0.3, h: 0.045,
    fill: { color: C.accent }, line: { color: C.accent },
  });
}

// Plain text line
function L(col, row, li, text, color, opts) {
  slide.addText(text, {
    x: colX[col] + PAD,
    y: rowY[row] + 0.48 + li * LH,
    w: CW - 2 * PAD,
    h: LH,
    fontSize: 9.5, color: color || C.body, fontFace: F,
    ...opts,
  });
}

// Multi-run line (array of { text, options })
function R(col, row, li, runs) {
  slide.addText(runs, {
    x: colX[col] + PAD,
    y: rowY[row] + 0.48 + li * LH,
    w: CW - 2 * PAD,
    h: LH,
    fontSize: 9.5,
  });
}

// Two-column split within a card
function T(col, row, li, left, lc, right, lw) {
  const y = rowY[row] + 0.48 + li * LH;
  const lWidth = lw || 0.80;
  slide.addText(left, {
    x: colX[col] + PAD, y, w: lWidth, h: LH,
    fontSize: 9.5, bold: true, color: lc, fontFace: 'Courier New',
  });
  slide.addText(right, {
    x: colX[col] + PAD + lWidth, y, w: CW - 2 * PAD - lWidth, h: LH,
    fontSize: 9.5, color: C.body, fontFace: F,
  });
}

// Absolute-position text (for custom-layout cards)
function A(x, y, w, h, text, color, opts) {
  slide.addText(text, { x, y, w, h, fontSize: 9.5, color: color || C.body, fontFace: F, ...opts });
}

// ── CARD 1 (0,0): Why an API Layer? ──────────────────────────────────────────
addCard(0, 0);
addCardTitle(0, 0, 'Why an API Layer?');

[
  'Separates HTTP calls from test logic',
  'Central token and auth management',
  'Typed requests and responses (TypeScript)',
  'Reusable operations across test files',
  'Predictable setup and teardown state',
  'No hardcoded URLs in tests',
].forEach((s, i) => {
  R(0, 0, i, [
    { text: '\u2192 ', options: { color: C.accent, fontFace: F, fontSize: 9.5, bold: true } },
    { text: s,         options: { color: C.body,   fontFace: F, fontSize: 9.5 } },
  ]);
});

// ── CARD 2 (1,0): Layer Structure ────────────────────────────────────────────
addCard(1, 0);
addCardTitle(1, 0, 'Layer Structure');

// Folder/file + role — Courier New for paths, Aptos for descriptions
[
  { path: 'client/',       file: 'ApiClient',           desc: 'sole HTTP entry point', color: C.green  },
  { path: 'endpoints/',    file: 'resource.endpoints',  desc: 'URL constants only',    color: C.blue   },
  { path: 'models/',       file: 'resource.model',      desc: 'TS interfaces only',    color: C.amber  },
  { path: 'controllers/',  file: 'ResourceController',  desc: 'business operations',   color: '#7030A0'},
].forEach(({ path, file, desc, color }, i) => {
  R(1, 0, i * 1.6, [
    { text: path, options: { color: C.body,   fontFace: 'Courier New', fontSize: 9, bold: false } },
    { text: file, options: { color,            fontFace: 'Courier New', fontSize: 9, bold: true  } },
  ]);
  L(1, 0, i * 1.6 + 0.65, '\u2514 ' + desc, C.body, { fontSize: 8.5, italic: true });
});

// ── CARD 3 (2,0): ApiClient ───────────────────────────────────────────────────
addCard(2, 0);
addCardTitle(2, 0, 'ApiClient');

L(2, 0, 0, 'The ONLY class that calls request.*', C.red, { bold: true, fontSize: 9 });
L(2, 0, 0.9, 'Wraps APIRequestContext from Playwright', C.body);
L(2, 0, 1.75, 'Methods:', C.accent, { bold: true, fontSize: 9 });

[
  ['get<T>(url)',           'Returns parsed JSON as T'],
  ['post<T>(url, data)',    'POST with JSON body'],
  ['delete(url, opts?)',    'Supports body + query params'],
  ['setAuthToken(token)',   'Injects Bearer on every request'],
].forEach(([sig, desc], i) => {
  T(2, 0, 2.5 + i, sig, C.blue, desc, 1.35);
});

L(2, 0, 7.0, 'Throws on non-2xx \u2014 no silent failures', C.red, { italic: true, fontSize: 8.5 });

// ── CARD 4 (0,1): Endpoints & Models ─────────────────────────────────────────
addCard(0, 1);
addCardTitle(0, 1, 'Endpoints & Models');

// Endpoints section
L(0, 1, 0,   'ENDPOINTS', C.blue, { bold: true, fontSize: 8.5 });
L(0, 1, 0.8, 'URL string constants — one file per resource', C.body);
L(0, 1, 1.5, 'No HTTP calls · No imports from client/', C.body);
L(0, 1, 2.3, 'Prevents hardcoded strings across the codebase', C.body);

// Thin divider between sections
slide.addShape(prs.ShapeType.rect, {
  x: colX[0] + PAD, y: rowY[1] + 0.48 + 3.2 * LH, w: CW - 2 * PAD, h: 0.01,
  fill: { color: C.border }, line: { color: C.border },
});

// Models section
L(0, 1, 3.4, 'MODELS', C.amber, { bold: true, fontSize: 8.5 });
L(0, 1, 4.2, 'TypeScript interfaces only — no classes', C.body);
L(0, 1, 5.0, 'Request payloads · Response shapes', C.body);
L(0, 1, 5.8, 'No business logic · No side effects', C.body);

// ── CARD 5 (1,1): Controllers ─────────────────────────────────────────────────
addCard(1, 1);
addCardTitle(1, 1, 'Controllers');

[
  ['\u25aa Receive ApiClient — not APIRequestContext', C.body],
  ['\u25aa One controller per resource / domain',       C.body],
  ['\u25aa Methods = named business operations',        C.body],
  ['\u25aa Return typed model objects',                 C.body],
].forEach(([s, c], i) => L(1, 1, i, s, c));

L(1, 1, 4.3, 'Typical operations:', C.accent, { bold: true, fontSize: 9 });

[
  ['generateToken(user, pass)', 'POST → returns token string'],
  ['getAll()',                  'GET  → returns typed array'],
  ['create(payload)',           'POST → returns created object'],
  ['delete(id, userId)',        'DEL  → void, throws on error'],
].forEach(([sig, desc], i) => {
  T(1, 1, 5.1 + i, sig, C.blue, desc, 1.5);
});

// ── CARD 6 (2,1): Fixture Integration ────────────────────────────────────────
addCard(2, 1, C.hiCardBg);
addCardTitle(2, 1, 'Fixture Integration');

// SETUP block
L(2, 1, 0,   'SETUP', C.green, { bold: true, fontSize: 9 });
R(2, 1, 0.8, [
  { text: '  generateToken()',    options: { color: C.green, fontFace: 'Courier New', fontSize: 9 } },
]);
R(2, 1, 1.5, [
  { text: '  cleanState()',       options: { color: C.green, fontFace: 'Courier New', fontSize: 9 } },
  { text: '  if needed',         options: { color: C.body,  fontFace: F, fontSize: 8.5, italic: true } },
]);

// Test body separator
slide.addShape(prs.ShapeType.rect, {
  x: colX[2] + PAD, y: rowY[1] + 0.48 + 2.4 * LH, w: CW - 2 * PAD, h: 0.01,
  fill: { color: C.border }, line: { color: C.border },
});
L(2, 1, 2.6, '\u2500\u2500 test body executes \u2500\u2500', C.body, { align: 'center', italic: true, fontSize: 8.5 });
slide.addShape(prs.ShapeType.rect, {
  x: colX[2] + PAD, y: rowY[1] + 0.48 + 3.5 * LH, w: CW - 2 * PAD, h: 0.01,
  fill: { color: C.border }, line: { color: C.border },
});

// TEARDOWN block
L(2, 1, 3.7, 'TEARDOWN', C.amber, { bold: true, fontSize: 9 });
R(2, 1, 4.5, [
  { text: '  regenerateToken()',  options: { color: C.amber, fontFace: 'Courier New', fontSize: 9 } },
  { text: '  \u2190 mandatory',  options: { color: C.red,   fontFace: F, fontSize: 8.5, bold: true } },
]);
R(2, 1, 5.2, [
  { text: '  cleanState()',       options: { color: C.amber, fontFace: 'Courier New', fontSize: 9 } },
]);
L(2, 1, 6.2, 'UI login invalidates the setup token', C.body, { italic: true, fontSize: 8 });

// ── Save ──────────────────────────────────────────────────────────────────────
prs.writeFile({ fileName: 'docs/course/M6-Slide-ApiLayer.pptx' })
  .then(() => {
    console.log('\u2705  Saved: docs/course/M6-Slide-ApiLayer.pptx');
    console.log('');
    console.log('   Open M6-Test-Lifecycle-Control.pptx + M6-Slide-ApiLayer.pptx');
    console.log('   Right-click thumbnail \u2192 Copy \u2192 Paste in M6 (Keep Source Formatting)');
  })
  .catch(err => { console.error('\u274c', err); process.exit(1); });
