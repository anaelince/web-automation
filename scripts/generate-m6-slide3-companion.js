/**
 * Companion to M6 Slide 3 — "Test Case Anatomy" (agnostic version)
 * Shows the same 6 lifecycle phases with generic Playwright code patterns.
 *
 * Usage:  node scripts/generate-m6-slide3-companion.js
 * Output: docs/course/M6-Slide3-Companion.pptx
 */

const pptxgen = require('pptxgenjs');

const prs = new pptxgen();
prs.layout = 'LAYOUT_WIDE';

const F  = 'Aptos';
const MN = 'Courier New';
const C  = {
  bg:    'FFFFFF', title: '335B74', accent: '1CADE4',
  body:  '66737A', cardBg: 'EFF4F6', border: 'D5DEE2',
  blue:  '2683C6', green: '3E8853', amber: 'C07A00', red: 'C00000',
};

const CW = 3.81, CH = 2.825, LEFT = 0.50, TOP = 1.25, GAP = 0.45, GAPV = 0.30;
const PAD = 0.12, LH = 0.185;

const colX = [LEFT, LEFT + CW + GAP, LEFT + 2 * (CW + GAP)];
const rowY  = [TOP, TOP + CH + GAPV];

const slide = prs.addSlide();
slide.background = { color: C.bg };

slide.addText('Test Case Anatomy \u2014 In Practice', {
  x: 0.55, y: 0.25, w: 12.0, h: 0.45,
  fontSize: 25, bold: true, color: C.title, fontFace: F,
});
slide.addShape(prs.ShapeType.rect, {
  x: 0.55, y: 0.82, w: 1.1, h: 0.07,
  fill: { color: C.accent }, line: { color: C.accent },
});
slide.addText('The same 6 phases from slide 3, mapped to code \u2014 where each phase lives in a Playwright test', {
  x: 1.80, y: 0.73, w: 10.8, h: 0.25,
  fontSize: 11, color: C.body, fontFace: F,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function addCard(col, row) {
  slide.addShape(prs.ShapeType.roundRect, {
    x: colX[col], y: rowY[row], w: CW, h: CH,
    fill: { color: C.cardBg }, line: { color: C.border, width: 1.0 }, rectRadius: 0.07,
  });
}

function addCardHeader(col, row, num, stageName, fileRef) {
  const x = colX[col], y = rowY[row];
  slide.addText(String(num), {
    x: x + PAD, y: y + PAD, w: 0.22, h: 0.22,
    fontSize: 13, bold: true, color: C.accent, fontFace: F,
  });
  slide.addText(stageName, {
    x: x + PAD + 0.24, y: y + PAD, w: CW - 2*PAD - 0.24, h: 0.22,
    fontSize: 12, bold: true, color: C.title, fontFace: F,
  });
  slide.addText(fileRef, {
    x: x + PAD, y: y + PAD + 0.23, w: CW - 2*PAD, h: 0.17,
    fontSize: 8.5, italic: true, color: C.body, fontFace: F,
  });
  slide.addShape(prs.ShapeType.rect, {
    x: x + PAD, y: y + PAD + 0.42, w: CW - 2*PAD, h: 0.025,
    fill: { color: C.border }, line: { color: C.border },
  });
}

const CODE_Y = 0.50;

function cLine(col, row, li, text, color, bold) {
  slide.addText(text, {
    x: colX[col] + PAD, y: rowY[row] + CODE_Y + li * LH,
    w: CW - 2*PAD, h: LH,
    fontSize: 9, color: color || C.title, fontFace: MN, bold: !!bold,
  });
}

function comment(col, row, li, text) {
  slide.addText(text, {
    x: colX[col] + PAD, y: rowY[row] + CODE_Y + li * LH,
    w: CW - 2*PAD, h: LH,
    fontSize: 8.5, color: C.body, fontFace: MN, italic: true,
  });
}

function codeLine(col, row, li, parts) {
  slide.addText(
    parts.map(([text, color, bold]) => ({
      text,
      options: { color: color || C.title, fontFace: MN, fontSize: 9, bold: !!bold },
    })),
    { x: colX[col] + PAD, y: rowY[row] + CODE_Y + li * LH, w: CW - 2*PAD, h: LH },
  );
}

// ── 1 — Suite initialization ──────────────────────────────────────────────────
addCard(0, 0);
addCardHeader(0, 0, 1, 'Suite initialization',
  'spec file header + fixtures/index.ts');

comment(0, 0, 0,   '// suite + fixtures declared here');
cLine(0, 0, 1,     'test.describe(\'Feature\', () => {');
cLine(0, 0, 2,     '  test(\'TC01: ...\',');
cLine(0, 0, 3,     '    async ({', C.body);
codeLine(0, 0, 4,  [['      listPage,',  C.blue, true], ['   // PO, pre-navigated', C.body]]);
codeLine(0, 0, 5,  [['      cleanState,', C.amber, true], [' // setup+teardown', C.body]]);
cLine(0, 0, 6,     '    }) => {', C.body);
comment(0, 0, 7.5, '// fixtures resolve before');
comment(0, 0, 8.3, '// the test body starts');

// ── 2 — Setup / preconditions ─────────────────────────────────────────────────
addCard(1, 0);
addCardHeader(1, 0, 2, 'Setup / preconditions',
  'fixtures/index.ts — cleanState fixture (before use())');

comment(1, 0, 0,   '// runs BEFORE test body');
codeLine(1, 0, 1,  [['const token', C.title], [' = await apiCtrl', C.blue]]);
cLine(1, 0, 2,     '  .generateToken(user, pass)', C.blue);
codeLine(1, 0, 3,  [['const items', C.title], ['  = await apiCtrl', C.blue]]);
cLine(1, 0, 4,     '  .getItems(userId)', C.blue);
cLine(1, 0, 5,     'if (items.length > 0) {', C.title);
cLine(1, 0, 6,     '  await apiCtrl', C.blue, true);
cLine(1, 0, 7,     '    .deleteAll(userId)', C.blue, true);
cLine(1, 0, 8,     '}', C.title);
comment(1, 0, 9.2, '// clean residual state');

// ── 3 — Test actions ──────────────────────────────────────────────────────────
addCard(2, 0);
addCardHeader(2, 0, 3, 'Test actions',
  'spec file body — test.step() calls');

comment(2, 0, 0,   '// each step = one user action');
cLine(2, 0, 1,     'await test.step(');
cLine(2, 0, 2,     '  \'Login with credentials\',', C.green);
cLine(2, 0, 3,     '  async () => {', C.body);
cLine(2, 0, 4,     '    await loginPage.login(user, pass)', C.blue);
cLine(2, 0, 5,     '  })');
cLine(2, 0, 6,     'await test.step(');
cLine(2, 0, 7,     '  \'Add item to collection\',', C.green);
cLine(2, 0, 8,     '  async () => {', C.body);
cLine(2, 0, 9,     '    await itemPage.addToCollection()', C.blue);
cLine(2, 0, 10,    '  })');

// ── 4 — Assertions ────────────────────────────────────────────────────────────
addCard(0, 1);
addCardHeader(0, 1, 4, 'Assertions',
  'spec file — expect() inside each test.step()');

comment(0, 1, 0,   '// inside test.step() blocks');
codeLine(0, 1, 1,  [['await ', C.title], ['expect', C.amber, true], ['(heading)', C.blue]]);
cLine(0, 1, 2,     '  .toBeVisible()', C.amber);
codeLine(0, 1, 3,  [['await ', C.title], ['expect', C.amber, true], ['(addButton)', C.blue]]);
cLine(0, 1, 4,     '  .toBeEnabled()', C.amber);
codeLine(0, 1, 5,  [['expect', C.amber, true], ['(confirmMessage)', C.blue]]);
cLine(0, 1, 6,     '  .toBe(\'Item added.\')', C.amber);
codeLine(0, 1, 7,  [['await ', C.title], ['expect', C.amber, true], ['(collectionPage', C.blue]]);
cLine(0, 1, 8,     '  .rowByTitle(itemTitle))', C.blue);
cLine(0, 1, 9,     '  .toBeVisible()', C.amber);

// ── 5 — Evidence / reporting ──────────────────────────────────────────────────
addCard(1, 1);
addCardHeader(1, 1, 5, 'Evidence / reporting',
  'test.step() = execution unit + trace + report entry');

comment(1, 1, 0,   '// test.step() auto-generates:');
codeLine(1, 1, 1,  [['\u2714 ', C.green, true], ['Step label in HTML report', C.title]]);
codeLine(1, 1, 2,  [['\u2714 ', C.green, true], ['Entry in Playwright trace', C.title]]);
codeLine(1, 1, 3,  [['\u2714 ', C.green, true], ['Screenshot on step failure', C.title]]);
codeLine(1, 1, 4,  [['\u2714 ', C.green, true], ['Nested hierarchy in report', C.title]]);
comment(1, 1, 5.4, '// no extra config needed');
cLine(1, 1, 6.2,   'await test.step(\'Verify state\',');
cLine(1, 1, 7.2,   '  async () => {', C.body);
comment(1, 1, 8.2, '  // scoped trace entry');
cLine(1, 1, 9.2,   '  })', C.body);

// ── 6 — Teardown / postconditions ─────────────────────────────────────────────
addCard(2, 1);
addCardHeader(2, 1, 6, 'Teardown / postconditions',
  'fixtures/index.ts — cleanState fixture (after use())');

comment(2, 1, 0,   '// runs AFTER test body (always)');
comment(2, 1, 1,   '// UI login may invalidate setup token');
cLine(2, 1, 2,     'const token = await apiCtrl', C.blue, true);
cLine(2, 1, 3,     '  .generateToken(user, pass)', C.blue, true);
codeLine(2, 1, 4,  [['// ', C.red], ['\u2190 fresh token \u2014 mandatory', C.red, true]]);
cLine(2, 1, 5,     'client.setAuthToken(token)');
cLine(2, 1, 6,     'await apiCtrl', C.blue, true);
cLine(2, 1, 7,     '  .deleteAll(userId)', C.blue, true);
comment(2, 1, 8.4, '// restore clean state');
comment(2, 1, 9.2, '// for the next test run');

// ── Save ──────────────────────────────────────────────────────────────────────
prs.writeFile({ fileName: 'docs/course/M6-Slide3-Companion.pptx' })
  .then(() => {
    console.log('\u2705  Saved: docs/course/M6-Slide3-Companion.pptx');
    console.log('');
    console.log('   Paste in M6 after slide 3 (Keep Source Formatting)');
  })
  .catch(err => { console.error('\u274c', err); process.exit(1); });
