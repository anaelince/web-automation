/**
 * Generates a standalone PPTX with the REST API Quick Refresh slide
 * matching the M6 visual style (white bg, Aptos, 335B74/1CADE4/66737A palette).
 *
 * Usage: node scripts/generate-m6-slide5.js
 * Output: docs/course/M6-Slide5-RestAPI-Refresh.pptx
 *
 * To add it to M6:
 *   1. Open M6-Test-Lifecycle-Control.pptx in PowerPoint
 *   2. Open M6-Slide5-RestAPI-Refresh.pptx
 *   3. Right-click the slide thumbnail → Copy
 *   4. In M6, right-click between slide 4 and 5 → Paste (Keep Source Formatting)
 */

const pptxgen = require('pptxgenjs');

const prs = new pptxgen();
prs.layout = 'LAYOUT_WIDE'; // 13.33" x 7.5"

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
  purple:   '7030A0',
};

// ── Layout constants ──────────────────────────────────────────────────────────
const CW   = 3.81;    // card width (inches)
const CH   = 2.825;   // card height
const GAP  = 0.45;    // horizontal gap between cards
const GAPV = 0.30;    // vertical gap
const LEFT = 0.50;    // left margin
const TOP  = 1.25;    // content top
const PAD  = 0.12;    // card internal padding
const LH   = 0.22;    // content line height

const colX = [LEFT, LEFT + CW + GAP, LEFT + 2 * (CW + GAP)];
const rowY = [TOP,  TOP + CH + GAPV];

// ── Slide ─────────────────────────────────────────────────────────────────────
const slide = prs.addSlide();
slide.background = { color: C.bg };

// ── Header ─────────────────────────────────────────────────────────────────────
slide.addText('REST API \u2014 Quick Refresh', {
  x: 0.55, y: 0.25, w: 12.0, h: 0.45,
  fontSize: 25, bold: true, color: C.title, fontFace: F,
});
slide.addShape(prs.ShapeType.rect, {
  x: 0.55, y: 0.82, w: 1.1, h: 0.07,
  fill: { color: C.accent }, line: { color: C.accent },
});
slide.addText('Quick refresh before we automate the first API test', {
  x: 1.80, y: 0.73, w: 10.8, h: 0.25,
  fontSize: 11, color: C.body, fontFace: F,
});

// ── Helpers ────────────────────────────────────────────────────────────────────
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

// Content line: simple text
function addLine(col, row, li, text, color, opts) {
  slide.addText(text, {
    x: colX[col] + PAD,
    y: rowY[row] + 0.50 + li * LH,
    w: CW - 2 * PAD,
    h: LH,
    fontSize: 10, color: color || C.body, fontFace: F,
    ...opts,
  });
}

// Content line: array of colored runs
function addRuns(col, row, li, runs) {
  slide.addText(runs, {
    x: colX[col] + PAD,
    y: rowY[row] + 0.50 + li * LH,
    w: CW - 2 * PAD,
    h: LH,
    fontSize: 10,
  });
}

// Two-column split within a card: verb box + description box
function addTwoCols(col, row, li, leftText, leftColor, rightText, leftW) {
  const y = rowY[row] + 0.50 + li * LH;
  const lw = leftW || 0.70;
  slide.addText(leftText, {
    x: colX[col] + PAD, y, w: lw, h: LH,
    fontSize: 10, bold: true, color: leftColor, fontFace: 'Courier New',
  });
  slide.addText(rightText, {
    x: colX[col] + PAD + lw, y, w: CW - 2 * PAD - lw, h: LH,
    fontSize: 10, color: C.body, fontFace: F,
  });
}

// ── CARD 1: API URL Structure ─────────────────────────────────────────────────
addCard(0, 0);
addCardTitle(0, 0, 'API URL Structure');

addRuns(0, 0, 0, [
  { text: 'https://',      options: { color: C.body,   fontFace: 'Courier New', fontSize: 10 } },
  { text: 'api.site.com',  options: { color: C.blue,   fontFace: 'Courier New', fontSize: 10, bold: true } },
  { text: '/books',        options: { color: C.green,  fontFace: 'Courier New', fontSize: 10, bold: true } },
  { text: '/42',           options: { color: C.amber,  fontFace: 'Courier New', fontSize: 10, bold: true } },
  { text: '?page=1',       options: { color: C.purple, fontFace: 'Courier New', fontSize: 10, bold: true } },
]);

[
  ['\u25aa base  ', C.accent, 'protocol + host'],
  ['\u25aa path  ', C.green,  'resource + id'],
  ['\u25aa query ', C.purple, '?key=value'],
].forEach(([lbl, lc, desc], i) => {
  addRuns(0, 0, 1.6 + i, [
    { text: lbl,  options: { color: lc,     fontFace: F, fontSize: 9, bold: true } },
    { text: desc, options: { color: C.body, fontFace: F, fontSize: 9 } },
  ]);
});

// ── CARD 2: HTTP Methods ──────────────────────────────────────────────────────
addCard(1, 0);
addCardTitle(1, 0, 'HTTP Methods');

[
  { verb: 'GET',    color: C.green,  desc: 'Read a resource'    },
  { verb: 'POST',   color: C.blue,   desc: 'Create a resource'  },
  { verb: 'PUT',    color: C.amber,  desc: 'Replace a resource' },
  { verb: 'PATCH',  color: C.purple, desc: 'Partial update'     },
  { verb: 'DELETE', color: C.red,    desc: 'Remove a resource'  },
].forEach((m, i) => addTwoCols(1, 0, i, m.verb, m.color, m.desc, 0.72));

// ── CARD 3: Status Codes ──────────────────────────────────────────────────────
addCard(2, 0);
addCardTitle(2, 0, 'Status Codes');

[
  { code: '2xx', color: C.green, label: 'Success'      },
  { code: '3xx', color: C.blue,  label: 'Redirect'     },
  { code: '4xx', color: C.amber, label: 'Client error' },
  { code: '5xx', color: C.red,   label: 'Server error' },
].forEach((f, i) => addTwoCols(2, 0, i, f.code, f.color, f.label, 0.52));

addLine(2, 0, 4.5, 'Common:', C.accent, { bold: true, fontSize: 9 });
addRuns(2, 0, 5.3,
  [['200', C.green], ['201', C.green], ['400', C.amber], ['401', C.red], ['404', C.amber], ['500', C.red]]
    .flatMap(([code, color]) => [
      { text: code, options: { color, fontFace: 'Courier New', fontSize: 9, bold: true } },
      { text: '  ', options: { color: C.body, fontFace: F, fontSize: 9 } },
    ])
);

// ── CARD 4: How It Works ──────────────────────────────────────────────────────
addCard(0, 1);
addCardTitle(0, 1, 'How It Works');

[
  'Client sends an HTTP Request',
  'Server processes the request',
  'Server returns an HTTP Response',
  'Stateless \u2014 no shared session',
  'Resources are identified by URL',
].forEach((s, i) => {
  addRuns(0, 1, i, [
    { text: '\u2192 ', options: { color: C.accent, fontFace: F, fontSize: 10, bold: true } },
    { text: s,         options: { color: C.body,   fontFace: F, fontSize: 10 } },
  ]);
});

// ── CARD 5: Response / JSON ───────────────────────────────────────────────────
addCard(1, 1);
addCardTitle(1, 1, 'Response / JSON');

[
  [{ text: '{', options: { color: C.body, fontFace: 'Courier New', fontSize: 9.5 } }],
  [
    { text: '  "isbn"',  options: { color: C.blue,  fontFace: 'Courier New', fontSize: 9.5, bold: true } },
    { text: ':  ',       options: { color: C.body,  fontFace: 'Courier New', fontSize: 9.5 } },
    { text: '"9781491904244"', options: { color: C.green, fontFace: 'Courier New', fontSize: 9.5 } },
  ],
  [
    { text: '  "title"', options: { color: C.blue,  fontFace: 'Courier New', fontSize: 9.5, bold: true } },
    { text: ': ',        options: { color: C.body,  fontFace: 'Courier New', fontSize: 9.5 } },
    { text: '"You Don\u0027t Know JS"', options: { color: C.green, fontFace: 'Courier New', fontSize: 9.5 } },
  ],
  [
    { text: '  "pages"', options: { color: C.blue,  fontFace: 'Courier New', fontSize: 9.5, bold: true } },
    { text: ': ',        options: { color: C.body,  fontFace: 'Courier New', fontSize: 9.5 } },
    { text: '278',       options: { color: C.amber, fontFace: 'Courier New', fontSize: 9.5 } },
  ],
  [{ text: '}', options: { color: C.body, fontFace: 'Courier New', fontSize: 9.5 } }],
].forEach((runs, i) => addRuns(1, 1, i, runs));

addLine(1, 1, 5.5, 'Key-value  \u00b7  Strings  \u00b7  Numbers  \u00b7  Arrays', C.accent, { italic: true, fontSize: 8.5 });

// ── CARD 6: AuthN vs AuthZ ────────────────────────────────────────────────────
addCard(2, 1, C.hiCardBg);
addCardTitle(2, 1, 'AuthN vs AuthZ');

const HW = (CW - 2 * PAD - 0.06) / 2;
const ax = colX[2] + PAD;
const bx = ax + HW + 0.06;
const authBase = rowY[1] + 0.50;

// Thin vertical divider
slide.addShape(prs.ShapeType.rect, {
  x: ax + HW + 0.02, y: authBase, w: 0.015, h: CH - 0.55,
  fill: { color: C.border }, line: { color: C.border },
});

[
  ['Authentication',    C.accent, true,  false],
  ['Who are you?',      C.body,   false, true],
  ['Verifies identity', C.title,  false, false],
  ['e.g. login, JWT',   C.body,   false, true],
].forEach(([text, color, bold, italic], i) => {
  slide.addText(text, {
    x: ax, y: authBase + i * LH, w: HW, h: LH,
    fontSize: 10, color, fontFace: F, bold, italic, align: 'center',
  });
});

[
  ['Authorization',         C.blue,  true,  false],
  ['What can you do?',      C.body,  false, true],
  ['Verifies permissions',  C.title, false, false],
  ['e.g. roles, scopes',    C.body,  false, true],
].forEach(([text, color, bold, italic], i) => {
  slide.addText(text, {
    x: bx, y: authBase + i * LH, w: HW, h: LH,
    fontSize: 10, color, fontFace: F, bold, italic, align: 'center',
  });
});

// ── Save ──────────────────────────────────────────────────────────────────────
prs.writeFile({ fileName: 'docs/course/M6-Slide5-RestAPI-Refresh.pptx' })
  .then(() => {
    console.log('');
    console.log('\u2705  Saved: docs/course/M6-Slide5-RestAPI-Refresh.pptx');
    console.log('');
    console.log('   To insert into M6:');
    console.log('   1. Open M6-Test-Lifecycle-Control.pptx');
    console.log('   2. Open M6-Slide5-RestAPI-Refresh.pptx');
    console.log('   3. Right-click slide thumbnail \u2192 Copy');
    console.log('   4. In M6, right-click between slide 4 and 5 \u2192 Paste (Keep Source Formatting)');
  })
  .catch(err => { console.error('\u274c', err); process.exit(1); });
