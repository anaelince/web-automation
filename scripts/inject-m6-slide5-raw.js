/**
 * Restores M6 backup, then injects a REST API Quick Refresh slide at position 5
 * using raw XML that exactly matches M6's format (Aptos, 335B74/1CADE4/66737A palette).
 */
const fs    = require('fs');
const path  = require('path');
const JSZip = require('jszip');

// EMU helpers
const em = (inches) => Math.round(inches * 914400);

// Design tokens — M6 palette
const C = {
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

// ID counter (nvGrpSpPr uses id=1, shapes start at 2)
let _id = 1;
const nid = () => ++_id;

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&apos;');
}

// ── Run builders ─────────────────────────────────────────────────────────
function runAptos(text, sz, color, bold = false, italic = false) {
  const b = bold   ? ' b="1"' : '';
  const i = italic ? ' i="1"' : '';
  return `<a:r><a:rPr lang="en-US" sz="${sz}"${b}${i} dirty="0"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:latin typeface="Aptos" pitchFamily="34" charset="0"/><a:ea typeface="Aptos" pitchFamily="34" charset="-122"/><a:cs typeface="Aptos" pitchFamily="34" charset="-120"/></a:rPr><a:t>${esc(text)}</a:t></a:r>`;
}

function runCourier(text, sz, color, bold = false) {
  const b = bold ? ' b="1"' : '';
  return `<a:r><a:rPr lang="en-US" sz="${sz}"${b} dirty="0"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:latin typeface="Courier New" pitchFamily="49" charset="0"/></a:rPr><a:t>${esc(text)}</a:t></a:r>`;
}

// ── Shape builders ────────────────────────────────────────────────────────
function textBox(x, y, cx, cy, runs, align = 'l', anchor = 'ctr') {
  const id = nid();
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Text ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln/></p:spPr><p:txBody><a:bodyPr wrap="square" lIns="762" tIns="762" rIns="762" bIns="762" rtlCol="0" anchor="${anchor}"><a:normAutofit/></a:bodyPr><a:lstStyle/><a:p><a:pPr marL="0" indent="0" algn="${align}"><a:buNone/></a:pPr>${runs}</a:p></p:txBody></p:sp>`;
}

function solidRect(x, y, cx, cy, fill, border) {
  const id = nid();
  const ln = border
    ? `<a:ln w="12700"><a:solidFill><a:srgbClr val="${border}"/></a:solidFill><a:prstDash val="solid"/></a:ln>`
    : `<a:ln><a:noFill/></a:ln>`;
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Shape ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${fill}"/></a:solidFill>${ln}</p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="en-US"/></a:p></p:txBody></p:sp>`;
}

function roundedRect(x, y, cx, cy, fill, border) {
  const id = nid();
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Shape ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 6579"/></a:avLst></a:prstGeom><a:solidFill><a:srgbClr val="${fill}"/></a:solidFill><a:ln w="12700"><a:solidFill><a:srgbClr val="${border}"/></a:solidFill><a:prstDash val="solid"/></a:ln></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="en-US"/></a:p></p:txBody></p:sp>`;
}

// ── Layout constants ──────────────────────────────────────────────────────
const CW    = em(3.81);
const CH    = em(2.825);
const PAD   = em(0.12);
const BDY   = em(0.50);    // content start from card top
const BW    = CW - 2*PAD;  // content width
const LH    = em(0.22);    // line height

const COLS  = [em(0.50), em(4.76), em(9.02)];
const ROWS  = [em(1.25), em(4.375)];

const colX  = (c) => COLS[c];
const rowY  = (r) => ROWS[r];
const lineY = (r, i) => rowY(r) + BDY + Math.round(i * LH);

// ── Card builder ──────────────────────────────────────────────────────────
function card(col, row, bg = C.cardBg) {
  const x = colX(col), y = rowY(row);
  const titleX = x + PAD, titleY = y + PAD;
  const barY   = y + PAD + em(0.25) + em(0.03);
  return {
    bg:  () => roundedRect(x, y, CW, CH, bg, C.border),
    hdr: (title) =>
      textBox(titleX, titleY, BW, em(0.25), runAptos(title, 1300, C.title, true)) +
      solidRect(titleX, barY, Math.round(BW * 0.3), em(0.045), C.accent, C.accent),
  };
}

// ── Build the slide ───────────────────────────────────────────────────────
function buildSlide() {
  _id = 1;
  const S = [];   // shapes array

  // Header
  S.push(textBox(em(0.55), em(0.25), em(12.0), em(0.45), runAptos('REST API \u2014 Quick Refresh', 2500, C.title, true)));
  S.push(solidRect(em(0.55), em(0.82), em(1.1), em(0.07), C.accent, C.accent));
  S.push(textBox(em(1.80), em(0.73), em(10.8), em(0.25), runAptos('Quick refresh before we automate the first API test', 1100, C.body)));

  // ── Card 1: API URL ───────────────────────────────────────────────────
  const c1 = card(0, 0);
  S.push(c1.bg(), c1.hdr('API URL Structure'));

  // URL with colored parts
  S.push(textBox(colX(0)+PAD, lineY(0,0), BW, LH,
    runCourier('https://',     1000, C.body) +
    runCourier('api.site.com', 1000, C.blue,   true) +
    runCourier('/books',       1000, C.green,  true) +
    runCourier('/42',          1000, C.amber,  true) +
    runCourier('?page=1',      1000, C.purple, true)
  ));
  // Legend
  [['\u25a0  base ', C.accent, 'protocol + host'],
   ['\u25a0  path ', C.green,  'resource + id'],
   ['\u25a0  query', C.purple, '?key=value'],
  ].forEach(([lbl, lc, desc], i) => {
    S.push(textBox(colX(0)+PAD, lineY(0, 1.6+i), BW, LH,
      runAptos(lbl+' ', 900, lc, true) + runAptos(desc, 900, C.body)
    ));
  });

  // ── Card 2: HTTP Methods ──────────────────────────────────────────────
  const c2 = card(1, 0);
  S.push(c2.bg(), c2.hdr('HTTP Methods'));

  const VERB_W = em(0.70);
  [['GET',    C.green,  'Read a resource'],
   ['POST',   C.blue,   'Create a resource'],
   ['PUT',    C.amber,  'Replace a resource'],
   ['PATCH',  C.purple, 'Partial update'],
   ['DELETE', C.red,    'Remove a resource'],
  ].forEach(([v, vc, desc], i) => {
    S.push(textBox(colX(1)+PAD,          lineY(0,i), VERB_W, LH, runCourier(v, 1000, vc, true)));
    S.push(textBox(colX(1)+PAD+VERB_W,   lineY(0,i), BW-VERB_W, LH, runAptos(desc, 1000, C.body)));
  });

  // ── Card 3: Status Codes ──────────────────────────────────────────────
  const c3 = card(2, 0);
  S.push(c3.bg(), c3.hdr('Status Codes'));

  const CODE_W = em(0.52);
  [['2xx', C.green, 'Success'],
   ['3xx', C.blue,  'Redirect'],
   ['4xx', C.amber, 'Client error'],
   ['5xx', C.red,   'Server error'],
  ].forEach(([code, cc, label], i) => {
    S.push(textBox(colX(2)+PAD,          lineY(0,i), CODE_W, LH, runCourier(code, 1000, cc, true)));
    S.push(textBox(colX(2)+PAD+CODE_W,   lineY(0,i), BW-CODE_W, LH, runAptos(label, 1000, C.body)));
  });
  S.push(textBox(colX(2)+PAD, lineY(0,4.5), BW, LH, runAptos('Common:', 900, C.accent, true)));
  S.push(textBox(colX(2)+PAD, lineY(0,5.3), BW, LH,
    [['200',C.green],['201',C.green],['400',C.amber],['401',C.red],['404',C.amber],['500',C.red]]
      .map(([c,col]) => runCourier(c+'  ', 900, col, true)).join('')
  ));

  // ── Card 4: How It Works ──────────────────────────────────────────────
  const c4 = card(0, 1);
  S.push(c4.bg(), c4.hdr('How It Works'));

  ['Client sends an HTTP Request',
   'Server processes the request',
   'Server returns an HTTP Response',
   'Stateless \u2014 no shared session',
   'Resources are identified by URL',
  ].forEach((s, i) => {
    S.push(textBox(colX(0)+PAD, lineY(1,i), BW, LH,
      runAptos('\u2192 ', 1000, C.accent, true) + runAptos(s, 1000, C.body)
    ));
  });

  // ── Card 5: Response / JSON ───────────────────────────────────────────
  const c5 = card(1, 1);
  S.push(c5.bg(), c5.hdr('Response / JSON'));

  [[runCourier('{', 950, C.body)],
   [runCourier('  "isbn"',  950, C.blue, true), runCourier(':  ', 950, C.body), runCourier('"9781491904244"', 950, C.green)],
   [runCourier('  "title"', 950, C.blue, true), runCourier(': ',  950, C.body), runCourier('"You Don\u0027t Know JS"', 950, C.green)],
   [runCourier('  "pages"', 950, C.blue, true), runCourier(': ',  950, C.body), runCourier('278', 950, C.amber)],
   [runCourier('}', 950, C.body)],
  ].forEach((parts, i) => {
    S.push(textBox(colX(1)+PAD, lineY(1,i), BW, LH, parts.join('')));
  });
  S.push(textBox(colX(1)+PAD, lineY(1, 5.4), BW, LH,
    runAptos('Key-value  \u00b7  Strings  \u00b7  Numbers  \u00b7  Arrays', 850, C.accent, false, true)
  ));

  // ── Card 6: AuthN vs AuthZ ────────────────────────────────────────────
  const c6 = card(2, 1, C.hiCardBg);
  S.push(c6.bg(), c6.hdr('AuthN vs AuthZ'));

  const HW = Math.floor((BW - em(0.08)) / 2);
  const AY = rowY(1) + BDY;
  const BX = colX(2) + PAD + HW + em(0.06);

  // Thin divider
  S.push(solidRect(colX(2)+PAD+HW+em(0.025), AY, em(0.015), CH - BDY - PAD, C.border, C.border));

  [['Authentication',    C.accent, true,  false],
   ['Who are you?',      C.body,   false, true],
   ['Verifies identity', C.title,  false, false],
   ['e.g. login, JWT',   C.body,   false, true],
  ].forEach(([t,c,b,it], i) => {
    S.push(textBox(colX(2)+PAD, AY + i*LH, HW, LH, runAptos(t, 1000, c, b, it), 'ctr'));
  });

  [['Authorization',         C.blue,  true,  false],
   ['What can you do?',      C.body,  false, true],
   ['Verifies permissions',  C.title, false, false],
   ['e.g. roles, scopes',    C.body,  false, true],
  ].forEach(([t,c,b,it], i) => {
    S.push(textBox(BX, AY + i*LH, BW - HW - em(0.06), LH, runAptos(t, 1000, c, b, it), 'ctr'));
  });

  // ── Assemble ──────────────────────────────────────────────────────────
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">',
    '<p:cSld name="REST API - Quick Refresh">',
    '<p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>',
    '<p:spTree>',
    '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>',
    '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>',
    S.join(''),
    '</p:spTree></p:cSld>',
    '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>',
    '</p:sld>',
  ].join('');
}

// ── Inject into M6 ────────────────────────────────────────────────────────
async function main() {
  const M6     = path.resolve('docs/course/M6-Test-Lifecycle-Control.pptx');
  const BACKUP = path.resolve('docs/course/M6-Test-Lifecycle-Control.backup.pptx');

  if (!fs.existsSync(BACKUP)) throw new Error('Backup not found — run original inject script first');

  // Restore clean original
  fs.copyFileSync(BACKUP, M6);
  console.log('  Restored original M6 from backup');

  const slideXml = buildSlide();
  console.log(`  Slide XML built (${slideXml.length} chars, ${_id-1} shapes)`);

  // Validate it's well-formed XML (basic check)
  if (!slideXml.includes('</p:sld>')) throw new Error('Generated XML looks incomplete');

  const slideRel =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n' +
    '  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>\n' +
    '</Relationships>';

  const m6Zip = await JSZip.loadAsync(fs.readFileSync(M6));

  m6Zip.file('ppt/slides/slide13.xml', slideXml);
  m6Zip.file('ppt/slides/_rels/slide13.xml.rels', slideRel);

  // [Content_Types].xml
  let ct = await m6Zip.file('[Content_Types].xml').async('string');
  ct = ct.replace('</Types>',
    '<Override PartName="/ppt/slides/slide13.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>');
  m6Zip.file('[Content_Types].xml', ct);

  // presentation.xml — insert new sldId after the 4th entry
  let pres = await m6Zip.file('ppt/presentation.xml').async('string');
  let n = 0;
  pres = pres.replace(/<p:sldId id="[^"]*" r:id="[^"]*"\/>/g, (m) => {
    n++;
    return n === 4 ? m + '<p:sldId id="280" r:id="rId15"/>' : m;
  });
  if (n < 4) throw new Error(`Only ${n} slides found in presentation.xml`);
  m6Zip.file('ppt/presentation.xml', pres);

  // ppt/_rels/presentation.xml.rels
  let rels = await m6Zip.file('ppt/_rels/presentation.xml.rels').async('string');
  rels = rels.replace('</Relationships>',
    '<Relationship Id="rId15" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide13.xml"/></Relationships>');
  m6Zip.file('ppt/_rels/presentation.xml.rels', rels);

  const buf = await m6Zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  fs.writeFileSync(M6, buf);

  console.log(`\n✅  M6 updated — slide injected at position 5 (total: 13 slides)`);
  console.log(`    ${M6}`);
}

main().catch(err => { console.error('\n❌', err.message || err); process.exit(1); });
