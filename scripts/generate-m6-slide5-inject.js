/**
 * Injects a REST API Quick Refresh slide into M6 at position 5,
 * matching M6's visual design: white bg, Aptos font, 335B74/1CADE4/66737A palette.
 *
 * Usage: node scripts/generate-m6-slide5-inject.js
 */
const fs      = require('fs');
const path    = require('path');
const JSZip   = require('jszip');
const pptxgen = require('pptxgenjs');

// ── M6 Design Tokens ─────────────────────────────────────────────────────
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

// ── Grid (inches, 13.33 × 7.5 widescreen) ────────────────────────────────
const CW   = 3.81;
const CH   = 2.825;
const COLS = [0.50, 4.76, 9.02];
const ROWS = [1.25, 4.375];
const PAD  = 0.12;
const BODY_Y = 0.50;
const BODY_W = CW - 2 * PAD;
const LH   = 0.22;

const cx = (col) => COLS[col];
const cy = (row) => ROWS[row];

// ── Slide builder ─────────────────────────────────────────────────────────
async function buildSlide(prs) {
  const slide = prs.addSlide();
  slide.background = { color: C.bg };

  // Header
  slide.addText('REST API — Quick Refresh', {
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

  // Helpers
  const addCard = (col, row, bg = C.cardBg) =>
    slide.addShape(prs.ShapeType.roundRect, {
      x: cx(col), y: cy(row), w: CW, h: CH,
      fill: { color: bg }, line: { color: C.border, width: 1.0 }, rectRadius: 0.08,
    });

  const addCardTitle = (col, row, title) => {
    slide.addText(title, {
      x: cx(col) + PAD, y: cy(row) + PAD, w: BODY_W, h: 0.25,
      fontSize: 13, bold: true, color: C.title, fontFace: F,
    });
    slide.addShape(prs.ShapeType.rect, {
      x: cx(col) + PAD, y: cy(row) + PAD + 0.27, w: BODY_W * 0.3, h: 0.045,
      fill: { color: C.accent }, line: { color: C.accent },
    });
  };

  const addLine = (col, row, lineIdx, runs, opts = {}) => {
    const y = cy(row) + BODY_Y + lineIdx * LH;
    const defaults = { x: cx(col) + PAD, y, w: BODY_W, h: LH, fontFace: F, fontSize: 10 };
    if (Array.isArray(runs)) {
      slide.addText(runs, { ...defaults, ...opts });
    } else {
      slide.addText(runs, { ...defaults, color: C.body, ...opts });
    }
  };

  // ── Card 1: API URL ───────────────────────────────────────────────────────
  addCard(0, 0);
  addCardTitle(0, 0, 'API URL Structure');

  addLine(0, 0, 0, [
    { text: 'https://',      options: { color: C.body,   fontFace: 'Courier New', fontSize: 10 } },
    { text: 'api.site.com',  options: { color: C.blue,   fontFace: 'Courier New', fontSize: 10, bold: true } },
    { text: '/books',        options: { color: C.green,  fontFace: 'Courier New', fontSize: 10, bold: true } },
    { text: '/42',           options: { color: C.amber,  fontFace: 'Courier New', fontSize: 10, bold: true } },
    { text: '?page=1',       options: { color: C.purple, fontFace: 'Courier New', fontSize: 10, bold: true } },
  ]);

  [
    ['base  ', C.accent, 'protocol + host'],
    ['path  ', C.green,  'resource + id'],
    ['query ', C.purple, '?key=value'],
  ].forEach(([lbl, lc, desc], i) => {
    addLine(0, 0, 1.6 + i, [
      { text: lbl,  options: { color: lc,     fontFace: 'Courier New', fontSize: 9, bold: true } },
      { text: desc, options: { color: C.body, fontFace: F, fontSize: 9 } },
    ]);
  });

  // ── Card 2: HTTP Methods ──────────────────────────────────────────────────
  addCard(1, 0);
  addCardTitle(1, 0, 'HTTP Methods');

  [
    { verb: 'GET',    color: C.green,  desc: 'Read a resource'    },
    { verb: 'POST',   color: C.blue,   desc: 'Create a resource'  },
    { verb: 'PUT',    color: C.amber,  desc: 'Replace a resource' },
    { verb: 'PATCH',  color: C.purple, desc: 'Partial update'     },
    { verb: 'DELETE', color: C.red,    desc: 'Remove a resource'  },
  ].forEach((m, i) => {
    slide.addText(m.verb, {
      x: cx(1) + PAD, y: cy(0) + BODY_Y + i * LH, w: 0.68, h: LH,
      fontSize: 10, bold: true, color: m.color, fontFace: 'Courier New',
    });
    slide.addText(m.desc, {
      x: cx(1) + PAD + 0.70, y: cy(0) + BODY_Y + i * LH, w: BODY_W - 0.70, h: LH,
      fontSize: 10, color: C.body, fontFace: F,
    });
  });

  // ── Card 3: Status Codes ──────────────────────────────────────────────────
  addCard(2, 0);
  addCardTitle(2, 0, 'Status Codes');

  [
    { code: '2xx', color: C.green, label: 'Success'      },
    { code: '3xx', color: C.blue,  label: 'Redirect'     },
    { code: '4xx', color: C.amber, label: 'Client error' },
    { code: '5xx', color: C.red,   label: 'Server error' },
  ].forEach((f, i) => {
    slide.addText(f.code, {
      x: cx(2) + PAD, y: cy(0) + BODY_Y + i * LH, w: 0.50, h: LH,
      fontSize: 10, bold: true, color: f.color, fontFace: 'Courier New',
    });
    slide.addText(f.label, {
      x: cx(2) + PAD + 0.52, y: cy(0) + BODY_Y + i * LH, w: BODY_W - 0.52, h: LH,
      fontSize: 10, color: C.body, fontFace: F,
    });
  });

  slide.addText('Common:', {
    x: cx(2) + PAD, y: cy(0) + BODY_Y + 4.4 * LH, w: BODY_W, h: LH,
    fontSize: 9, bold: true, color: C.accent, fontFace: F,
  });
  slide.addText(
    [['200', C.green], ['201', C.green], ['400', C.amber], ['401', C.red], ['404', C.amber], ['500', C.red]]
      .flatMap(([code, color]) => [
        { text: code, options: { color, fontFace: 'Courier New', fontSize: 9, bold: true } },
        { text: '  ', options: { color: C.body, fontFace: F, fontSize: 9 } },
      ]),
    { x: cx(2) + PAD, y: cy(0) + BODY_Y + 5.3 * LH, w: BODY_W, h: LH },
  );

  // ── Card 4: How It Works ──────────────────────────────────────────────────
  addCard(0, 1);
  addCardTitle(0, 1, 'How It Works');

  [
    'Client sends an HTTP Request',
    'Server processes the request',
    'Server returns an HTTP Response',
    'Stateless — no shared session',
    'Resources are identified by URL',
  ].forEach((s, i) => {
    addLine(0, 1, i, [
      { text: '→ ', options: { color: C.accent, bold: true, fontFace: F, fontSize: 10 } },
      { text: s,   options: { color: C.body,   fontFace: F, fontSize: 10 } },
    ]);
  });

  // ── Card 5: Response / JSON ───────────────────────────────────────────────
  addCard(1, 1);
  addCardTitle(1, 1, 'Response / JSON');

  [
    [{ text: '{', c: C.body }],
    [{ text: '  "isbn"',  c: C.blue }, { text: ':  ', c: C.body }, { text: '"9781491904244"',      c: C.green }],
    [{ text: '  "title"', c: C.blue }, { text: ': ',  c: C.body }, { text: '"You Don\'t Know JS"', c: C.green }],
    [{ text: '  "pages"', c: C.blue }, { text: ': ',  c: C.body }, { text: '278',                 c: C.amber }],
    [{ text: '}', c: C.body }],
  ].forEach((parts, i) => {
    addLine(1, 1, i,
      parts.map(p => ({ text: p.text, options: { color: p.c, fontFace: 'Courier New', fontSize: 9.5 } }))
    );
  });

  slide.addText('Key-value  ·  Strings  ·  Numbers  ·  Arrays', {
    x: cx(1) + PAD, y: cy(1) + BODY_Y + 5.4 * LH, w: BODY_W, h: LH,
    fontSize: 8.5, italic: true, color: C.accent, fontFace: F,
  });

  // ── Card 6: AuthN vs AuthZ ────────────────────────────────────────────────
  addCard(2, 1, C.hiCardBg);
  addCardTitle(2, 1, 'AuthN vs AuthZ');

  const HW = (BODY_W - 0.08) / 2;
  const authY = cy(1) + BODY_Y;

  [
    ['Authentication',   { bold: true, color: C.accent },   cx(2) + PAD],
    ['Who are you?',     { italic: true, color: C.body },   cx(2) + PAD],
    ['Verifies identity',{ color: C.title },                cx(2) + PAD],
    ['e.g. login, JWT',  { italic: true, color: C.body },   cx(2) + PAD],
  ].forEach(([text, style, x], i) => {
    slide.addText(text, { x, y: authY + i * LH, w: HW, h: LH, fontSize: 10, fontFace: F, align: 'center', ...style });
  });

  // Thin divider
  slide.addShape(prs.ShapeType.rect, {
    x: cx(2) + PAD + HW + 0.03, y: cy(1) + BODY_Y - 0.05, w: 0.015, h: CH - BODY_Y,
    fill: { color: C.border }, line: { color: C.border },
  });

  const bx = cx(2) + PAD + HW + 0.065;
  [
    ['Authorization',      { bold: true, color: C.blue },   bx],
    ['What can you do?',   { italic: true, color: C.body }, bx],
    ['Verifies permissions',{ color: C.title },              bx],
    ['e.g. roles, scopes', { italic: true, color: C.body }, bx],
  ].forEach(([text, style, x], i) => {
    slide.addText(text, { x, y: authY + i * LH, w: HW, h: LH, fontSize: 10, fontFace: F, align: 'center', ...style });
  });
}

// ── Inject into M6 PPTX ───────────────────────────────────────────────────
async function injectSlide(tempPath, m6Path) {
  const tempZip = await JSZip.loadAsync(fs.readFileSync(tempPath));
  const m6Zip   = await JSZip.loadAsync(fs.readFileSync(m6Path));

  const slideXml = await tempZip.file('ppt/slides/slide1.xml').async('string');
  const slideRel = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>',
    '</Relationships>',
  ].join('\n');

  m6Zip.file('ppt/slides/slide13.xml', slideXml);
  m6Zip.file('ppt/slides/_rels/slide13.xml.rels', slideRel);

  // Content types
  let ct = await m6Zip.file('[Content_Types].xml').async('string');
  ct = ct.replace('</Types>',
    '<Override PartName="/ppt/slides/slide13.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>');
  m6Zip.file('[Content_Types].xml', ct);

  // Insert sldId after slide 4 (the 4th <p:sldId .../>)
  let presXml = await m6Zip.file('ppt/presentation.xml').async('string');
  let count = 0;
  presXml = presXml.replace(/<p:sldId id="[^"]*" r:id="[^"]*"\/>/g, (match) => {
    count++;
    return count === 4 ? match + '<p:sldId id="280" r:id="rId15"/>' : match;
  });
  m6Zip.file('ppt/presentation.xml', presXml);

  // Add relationship
  let relXml = await m6Zip.file('ppt/_rels/presentation.xml.rels').async('string');
  relXml = relXml.replace('</Relationships>',
    '<Relationship Id="rId15" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide13.xml"/></Relationships>');
  m6Zip.file('ppt/_rels/presentation.xml.rels', relXml);

  const buf = await m6Zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  fs.writeFileSync(m6Path, buf);
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const M6     = path.resolve('docs/course/M6-Test-Lifecycle-Control.pptx');
  const BACKUP = path.resolve('docs/course/M6-Test-Lifecycle-Control.backup.pptx');
  const TEMP   = path.resolve('scripts/temp-slide.pptx');

  const prs = new pptxgen();
  prs.layout = 'LAYOUT_WIDE';
  await buildSlide(prs);
  await prs.writeFile({ fileName: TEMP });
  console.log('  Slide generated');

  fs.copyFileSync(M6, BACKUP);
  console.log('  Backup saved');

  await injectSlide(TEMP, M6);
  console.log('  Slide injected at position 5');

  fs.unlinkSync(TEMP);
  console.log('\n✅  docs/course/M6-Test-Lifecycle-Control.pptx updated (13 slides)');
  console.log('    Backup → docs/course/M6-Test-Lifecycle-Control.backup.pptx');
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
