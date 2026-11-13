/**
 * "Flaky Tests — The Lifecycle as Your Defense"
 * Maps each of the 6 lifecycle phases to the flaky-test cause it prevents.
 * Based on the "Understanding flaky tests" framework + course content.
 *
 * Usage:  node scripts/generate-m6-slide-flaky.js
 * Output: docs/course/M6-Slide-FlakyTests.pptx
 */

const pptxgen = require('pptxgenjs');

const prs = new pptxgen();
prs.layout = 'LAYOUT_WIDE';

const F  = 'Aptos';
const MN = 'Courier New';
const C  = {
  bg:    'FFFFFF', title: '335B74', accent: '1CADE4',
  body:  '66737A', cardBg: 'EFF4F6', hiBg: 'E8F7FA', border: 'D5DEE2',
  blue:  '2683C6', green:  '3E8853', amber: 'C07A00', red:   'C00000',
};

// ── Layout — slightly shorter cards to leave room for the bottom callout ──────
const CW = 3.81, CH = 2.68;
const LEFT = 0.50, TOP = 1.25, GAP = 0.45, GAPV = 0.28;
const PAD = 0.12, LH = 0.195;

const colX = [LEFT, LEFT + CW + GAP, LEFT + 2 * (CW + GAP)];
const rowY  = [TOP, TOP + CH + GAPV];

// ── Slide ─────────────────────────────────────────────────────────────────────
const slide = prs.addSlide();
slide.background = { color: C.bg };

slide.addText('Flaky Tests \u2014 The Lifecycle as Your Defense', {
  x: 0.55, y: 0.25, w: 12.0, h: 0.45,
  fontSize: 25, bold: true, color: C.title, fontFace: F,
});
slide.addShape(prs.ShapeType.rect, {
  x: 0.55, y: 0.82, w: 1.1, h: 0.07,
  fill: { color: C.accent }, line: { color: C.accent },
});
slide.addText('Diagnose instability instead of hiding it \u2014 each lifecycle phase prevents a specific class of flakiness', {
  x: 1.80, y: 0.73, w: 10.8, h: 0.25,
  fontSize: 11, color: C.body, fontFace: F,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function addCard(col, row, bg) {
  slide.addShape(prs.ShapeType.roundRect, {
    x: colX[col], y: rowY[row], w: CW, h: CH,
    fill: { color: bg || C.cardBg }, line: { color: C.border, width: 1.0 }, rectRadius: 0.07,
  });
}

// Header: number + stage name + amber "prevents:" line + divider bar
function addCardHeader(col, row, num, stageName, preventsText) {
  const x = colX[col], y = rowY[row];

  // Phase number badge
  slide.addText(String(num), {
    x: x + PAD, y: y + PAD, w: 0.22, h: 0.21,
    fontSize: 13, bold: true, color: C.accent, fontFace: F,
  });
  // Stage name
  slide.addText(stageName, {
    x: x + PAD + 0.24, y: y + PAD, w: CW - 2*PAD - 0.24, h: 0.21,
    fontSize: 11.5, bold: true, color: C.title, fontFace: F,
  });
  // "prevents:" tag in amber
  slide.addText([
    { text: 'prevents: ', options: { color: C.amber, fontFace: F, fontSize: 8.5, bold: true } },
    { text: preventsText, options: { color: C.body,  fontFace: F, fontSize: 8.5, italic: true } },
  ], {
    x: x + PAD, y: y + PAD + 0.22, w: CW - 2*PAD, h: 0.17,
  });
  // Divider bar
  slide.addShape(prs.ShapeType.rect, {
    x: x + PAD, y: y + PAD + 0.41, w: CW - 2*PAD, h: 0.025,
    fill: { color: C.border }, line: { color: C.border },
  });
}

const BODY_Y = 0.48;

function bullet(col, row, li, labelText, labelColor, bodyText) {
  const y = rowY[row] + BODY_Y + li * LH;
  slide.addText([
    { text: labelText + ' ', options: { color: labelColor || C.accent, fontFace: F, fontSize: 9.5, bold: true } },
    { text: bodyText,        options: { color: C.body,                fontFace: F, fontSize: 9.5 } },
  ], { x: colX[col] + PAD, y, w: CW - 2*PAD, h: LH });
}

function plain(col, row, li, text, color, opts) {
  slide.addText(text, {
    x: colX[col] + PAD, y: rowY[row] + BODY_Y + li * LH,
    w: CW - 2*PAD, h: LH,
    fontSize: 9.5, color: color || C.body, fontFace: F, ...opts,
  });
}

function codeline(col, row, li, text, color) {
  slide.addText(text, {
    x: colX[col] + PAD, y: rowY[row] + BODY_Y + li * LH,
    w: CW - 2*PAD, h: LH,
    fontSize: 8.5, color: color || C.title, fontFace: MN,
  });
}

// ── CARD 1 (0,0) — Suite initialization ──────────────────────────────────────
addCard(0, 0);
addCardHeader(0, 0, 1, 'Suite initialization', 'shared browser / page state');

bullet(0, 0, 0, '\u2192', C.accent, 'BrowserContext is isolated per test');
bullet(0, 0, 1, '\u2192', C.accent, 'Fixtures own setup — no global state');
bullet(0, 0, 2, '\u2192', C.accent, 'Never share a page across test cases');
bullet(0, 0, 3, '\u2192', C.accent, 'Parallelism is safe with isolated contexts');
plain(0, 0, 4.5, 'No shared state = no order dependency', C.green, { bold: true, fontSize: 9 });

// ── CARD 2 (1,0) — Setup / Preconditions ─────────────────────────────────────
addCard(1, 0);
addCardHeader(1, 0, 2, 'Setup / preconditions', 'dirty state from a previous run');

bullet(1, 0, 0, '\u2192', C.accent, 'Always start from a known clean state');
bullet(1, 0, 1, '\u2192', C.accent, 'API sets up data deterministically');
bullet(1, 0, 2, '\u2192', C.accent, 'Pre-existing data → delete, then create');
bullet(1, 0, 3, '\u2192', C.accent, 'No dependency on test execution order');
plain(1, 0, 4.5, 'Clean precondition = reproducible start', C.green, { bold: true, fontSize: 9 });

// ── CARD 3 (2,0) — Test actions ───────────────────────────────────────────────
addCard(2, 0);
addCardHeader(2, 0, 3, 'Test actions', 'race conditions & brittle selectors');

bullet(2, 0, 0, '\u2192', C.accent, 'Playwright auto-wait \u2014 never sleep()');
bullet(2, 0, 1, '\u2192', C.accent, 'Wait for elements, not for time');
bullet(2, 0, 2, '\u2192', C.accent, 'Locators: role / text / data-testid');
bullet(2, 0, 3, '\u2192', C.accent, 'Avoid positional XPath or nth-child');
plain(2, 0, 4.5, 'Semantic locators survive UI refactors', C.green, { bold: true, fontSize: 9 });

// ── CARD 4 (0,1) — Assertions ─────────────────────────────────────────────────
addCard(0, 1);
addCardHeader(0, 1, 4, 'Assertions', 'timing-dependent & non-deterministic checks');

bullet(0, 1, 0, '\u2192', C.accent, 'expect() retries automatically until timeout');
bullet(0, 1, 1, '\u2192', C.accent, 'Assert behavior, not timing');
bullet(0, 1, 2, '\u2192', C.accent, 'Polling matchers for async state changes');
bullet(0, 1, 3, '\u2192', C.accent, 'One assertion per observable outcome');
plain(0, 1, 4.5, 'Retryable assertions absorb latency spikes', C.green, { bold: true, fontSize: 9 });

// ── CARD 5 (1,1) — Evidence / Reporting ──────────────────────────────────────
addCard(1, 1, C.hiBg);
addCardHeader(1, 1, 5, 'Evidence / reporting', 'undiagnosable \u2014 hiding failures with retry');

bullet(1, 1, 0, '\u2192', C.accent, 'test.step() scopes failure to one action');
bullet(1, 1, 1, '\u2192', C.accent, 'Trace shows exact timing + network calls');
bullet(1, 1, 2, '\u2192', C.accent, 'Screenshot captures UI at the failure point');
plain(1, 1, 3.3, 'Classify as: product / test / data / env', C.blue, { bold: true, fontSize: 9 });
slide.addText([
  { text: '\u26a0 ', options: { color: C.red, fontFace: F, fontSize: 9, bold: true } },
  { text: 'A retry provides evidence \u2014 it is not a fix', options: { color: C.red, fontFace: F, fontSize: 9, bold: true } },
], {
  x: colX[1] + PAD, y: rowY[1] + BODY_Y + 4.5 * LH,
  w: CW - 2*PAD, h: LH,
});

// ── CARD 6 (2,1) — Teardown / Postconditions ──────────────────────────────────
addCard(2, 1);
addCardHeader(2, 1, 6, 'Teardown / postconditions', 'state bleeding to the next test');

bullet(2, 1, 0, '\u2192', C.accent, 'Runs even when the test fails');
bullet(2, 1, 1, '\u2192', C.accent, 'Cleans all data created during the test');
bullet(2, 1, 2, '\u2192', C.accent, 'Regenerate token after a UI login step');
bullet(2, 1, 3, '\u2192', C.accent, 'Leave environment exactly as found');
plain(2, 1, 4.5, 'No leak = next test starts clean too', C.green, { bold: true, fontSize: 9 });

// ── Bottom callout bar ────────────────────────────────────────────────────────
const barY = rowY[1] + CH + 0.08;
slide.addShape(prs.ShapeType.roundRect, {
  x: LEFT, y: barY, w: colX[2] + CW - LEFT, h: 0.33,
  fill: { color: C.hiBg }, line: { color: C.accent, width: 1.5 }, rectRadius: 0.05,
});
slide.addText([
  { text: 'Common causes: ', options: { color: C.amber, fontFace: F, fontSize: 10, bold: true } },
  { text: 'Race conditions  \u00b7  Weak locators  \u00b7  Fixed waits  \u00b7  Shared state  \u00b7  Unstable dependencies  \u00b7  Non-deterministic data', options: { color: C.title, fontFace: F, fontSize: 10 } },
], {
  x: LEFT + 0.15, y: barY + 0.03, w: colX[2] + CW - LEFT - 0.3, h: 0.27,
  align: 'center',
});

// ── Save ──────────────────────────────────────────────────────────────────────
prs.writeFile({ fileName: 'docs/course/M6-Slide-FlakyTests.pptx' })
  .then(() => {
    console.log('\u2705  Saved: docs/course/M6-Slide-FlakyTests.pptx');
    console.log('   Paste in M6 after the lifecycle slides (Keep Source Formatting)');
  })
  .catch(err => { console.error('\u274c', err); process.exit(1); });
