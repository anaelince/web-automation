// scripts/generate-m5-slides.js
// Generates the M5 slides that were updated/created in the M5 session.
// Run: node scripts/generate-m5-slides.js
// Output: docs/M5-updated-slides.pptx

const PptxGenJS = require('pptxgenjs');
const pptx = new PptxGenJS();

// ─── Color palette ────────────────────────────────────────────────
const C = {
  blue:        '1a56db',
  blueDark:    '1e3a8a',
  blueLight:   'dbeafe',
  blueMid:     'bfdbfe',
  green:       '166534',
  greenLight:  'dcfce7',
  greenBorder: '86efac',
  gray:        '6b7280',
  grayLight:   'f3f4f6',
  red:         'dc2626',
  redLight:    'fee2e2',
  amber:       'd97706',
  amberLight:  'fef3c7',
  dark:        '111827',
  white:       'FFFFFF',
};

pptx.layout = 'LAYOUT_WIDE'; // 13.33 × 7.5 in

// ══════════════════════════════════════════════════════════════════
// SLIDE 1 — Module 5 | Session Summary (rewritten)
// ══════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();

  // Blue top bar
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: C.blue } });

  // Title
  slide.addText('Module 5 | Session Summary', {
    x: 0.4, y: 0.15, w: 12, h: 0.55,
    fontSize: 28, bold: true, color: C.dark, fontFace: 'Segoe UI',
  });

  // Progress bar (partial blue)
  slide.addShape(pptx.ShapeType.rect, { x: 0.4, y: 0.78, w: 1.8, h: 0.06, fill: { color: C.blue } });
  slide.addShape(pptx.ShapeType.rect, { x: 2.2, y: 0.78, w: 10.7, h: 0.06, fill: { color: 'e5e7eb' } });

  // Subtitle
  slide.addText('Module outcome, Wrap-Up, Key Takeaways', {
    x: 0.4, y: 0.88, w: 10, h: 0.3,
    fontSize: 11, italic: true, color: C.gray, fontFace: 'Segoe UI',
  });

  // 5 numbered items
  const items = [
    {
      n: '1', bold: false,
      text: 'The AI-assisted development lifecycle structures work into: ',
      sub: 'write prompt → refine → apply → validate → refactor — one cycle per skill.',
    },
    {
      n: '2', bold: true,
      text: 'spec-standards (NEW): ',
      sub: 'defines TC organisation — folder hierarchy tests/ui/{suite}/{feature}/, file naming TC{N}-{name}.spec.ts, and test.step() for step visibility in the HTML report.',
    },
    {
      n: '3', bold: true,
      text: 'git-standards (NEW): ',
      sub: 'two capabilities — Validate (branch name, commit format, substantive commit, README sync) and Execute (create branch, commit, push, open PR) following team conventions.',
    },
    {
      n: '4', bold: true,
      text: 'automation-architect (UPDATED): ',
      sub: 'Sub-Skill Registry, Framework Growth Considerations, Mode 4 (git-standards), Mode 5 (README Sync — auto-detects out-of-date sections).',
    },
    {
      n: '5', bold: false,
      text: 'Checkpoint 1 baseline: ',
      sub: 'implement all 4 skills + migrate existing specs to TC folder structure + README rewrite.',
    },
  ];

  items.forEach((item, i) => {
    const y = 1.3 + i * 1.05;
    // Box
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.4, y, w: 12.5, h: 0.9,
      fill: { color: C.white },
      line: { color: 'e5e7eb', width: 1 },
    });
    // Number circle
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 0.55, y: y + 0.2, w: 0.45, h: 0.45,
      fill: { color: C.blueLight },
      line: { color: C.blue, width: 1 },
    });
    slide.addText(item.n, {
      x: 0.55, y: y + 0.2, w: 0.45, h: 0.45,
      fontSize: 12, bold: true, color: C.blue,
      align: 'center', valign: 'middle', fontFace: 'Segoe UI',
    });
    // Text
    slide.addText([
      { text: item.text, options: { bold: item.bold, color: C.dark } },
      { text: item.sub,  options: { bold: false, color: C.gray } },
    ], {
      x: 1.1, y: y + 0.1, w: 11.6, h: 0.7,
      fontSize: 11, fontFace: 'Segoe UI', valign: 'middle',
    });
  });

  // Green bottom box
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 6.68, w: 12.5, h: 0.55,
    fill: { color: C.greenLight },
    line: { color: C.greenBorder, width: 1.5 },
  });
  slide.addText('All engineering agreements are enforced by skills before code reaches review — from POM structure to TC organisation and git conventions.', {
    x: 0.6, y: 6.7, w: 12.1, h: 0.5,
    fontSize: 10, color: C.green, fontFace: 'Segoe UI', italic: false,
  });
}

// ══════════════════════════════════════════════════════════════════
// SLIDE 2 — Git Conventions Check (subtitle updated)
// ══════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();

  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: C.blue } });

  slide.addText('Git Conventions Check', {
    x: 0.4, y: 0.15, w: 12, h: 0.55,
    fontSize: 28, bold: true, color: C.dark, fontFace: 'Segoe UI',
  });

  // Progress bar
  slide.addShape(pptx.ShapeType.rect, { x: 0.4, y: 0.78, w: 1.8, h: 0.06, fill: { color: C.blue } });
  slide.addShape(pptx.ShapeType.rect, { x: 2.2, y: 0.78, w: 10.7, h: 0.06, fill: { color: 'e5e7eb' } });

  // ✅ Updated subtitle
  slide.addText('New skill git-standards · standalone + hub Mode 4 · NEW in M5', {
    x: 0.4, y: 0.88, w: 10, h: 0.3,
    fontSize: 11, italic: true, color: C.gray, fontFace: 'Segoe UI',
  });

  // Triggers row
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 1.3, w: 12.5, h: 0.55,
    fill: { color: C.blueLight }, line: { color: C.blueMid, width: 1 },
  });
  slide.addText([
    { text: 'Triggers:   ', options: { bold: true, color: C.blueDark } },
    { text: '"check git"  ·  "verify commits"  ·  "git conventions"  ·  "pre-PR check"', options: { bold: false, color: C.dark } },
  ], { x: 0.6, y: 1.35, w: 12, h: 0.45, fontSize: 11, fontFace: 'Segoe UI' });

  // What it checks
  slide.addText('Capability 1 — Validate:', {
    x: 0.4, y: 2.05, w: 6, h: 0.35,
    fontSize: 12, bold: true, color: C.dark, fontFace: 'Segoe UI',
  });

  const checks = [
    { n: '1', title: 'Commit format',      desc: 'Every message follows type(scope): description' },
    { n: '2', title: 'Commit types',       desc: 'Only feat · fix · refactor · chore · docs allowed' },
    { n: '3', title: 'Branch name',        desc: 'Must match test/<scope> or fix/<scope> kebab-case' },
    { n: '4', title: 'Substantive commit', desc: 'Branch has at least one feat or fix (not only chore)' },
    { n: '5', title: 'README sync',        desc: 'Warns if architectural files changed but README was not updated (WARNING)' },
  ];

  checks.forEach((c, i) => {
    const y = 2.5 + i * 0.82;
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.4, y, w: 6, h: 0.72,
      fill: { color: C.white }, line: { color: 'e5e7eb', width: 1 },
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 0.55, y: y + 0.15, w: 0.38, h: 0.38,
      fill: { color: C.blueLight }, line: { color: C.blue, width: 1 },
    });
    slide.addText(c.n, {
      x: 0.55, y: y + 0.15, w: 0.38, h: 0.38,
      fontSize: 11, bold: true, color: C.blue,
      align: 'center', valign: 'middle', fontFace: 'Segoe UI',
    });
    slide.addText(c.title, {
      x: 1.05, y: y + 0.08, w: 5.2, h: 0.28,
      fontSize: 11, bold: true, color: C.dark, fontFace: 'Segoe UI',
    });
    slide.addText(c.desc, {
      x: 1.05, y: y + 0.36, w: 5.2, h: 0.28,
      fontSize: 10, color: C.gray, fontFace: 'Segoe UI',
    });
  });

  // Capability 2 label
  slide.addText('Capability 2 — Execute:', {
    x: 6.8, y: 2.05, w: 6, h: 0.35,
    fontSize: 12, bold: true, color: C.dark, fontFace: 'Segoe UI',
  });

  const execSteps = [
    { n: 'E1', label: 'Create branch',  desc: 'test/<scope> or fix/<scope>' },
    { n: 'E2', label: 'Commit',         desc: 'Stage files + validate + commit message' },
    { n: 'E3', label: 'Push',           desc: 'Auto -u flag for new branches' },
    { n: 'E4', label: 'Create PR',      desc: 'gh pr create with structured body + TC list' },
    { n: 'E5', label: 'Full workflow',  desc: 'validate → commit → push → PR in one shot' },
  ];

  execSteps.forEach((e, i) => {
    const y = 2.5 + i * 0.82;
    slide.addShape(pptx.ShapeType.rect, {
      x: 6.8, y, w: 6.1, h: 0.72,
      fill: { color: C.white }, line: { color: 'e5e7eb', width: 1 },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: 6.95, y: y + 0.17, w: 0.55, h: 0.32,
      fill: { color: C.blueLight }, line: { color: C.blue, width: 1 },
    });
    slide.addText(e.n, {
      x: 6.95, y: y + 0.17, w: 0.55, h: 0.32,
      fontSize: 9, bold: true, color: C.blue,
      align: 'center', valign: 'middle', fontFace: 'Segoe UI',
    });
    slide.addText(e.label, {
      x: 7.6, y: y + 0.08, w: 5.1, h: 0.28,
      fontSize: 11, bold: true, color: C.dark, fontFace: 'Segoe UI',
    });
    slide.addText(e.desc, {
      x: 7.6, y: y + 0.36, w: 5.1, h: 0.28,
      fontSize: 10, color: C.gray, fontFace: 'Segoe UI',
    });
  });

  // Green bottom box
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 6.68, w: 12.5, h: 0.55,
    fill: { color: C.greenLight }, line: { color: C.greenBorder, width: 1.5 },
  });
  slide.addText('Integration point: Merge phase — resolve every violation before opening PR', {
    x: 0.6, y: 6.7, w: 12.1, h: 0.5,
    fontSize: 10, color: C.green, fontFace: 'Segoe UI',
  });
}

// ══════════════════════════════════════════════════════════════════
// SLIDE 3 — Prompt Construction — New TCs (updated)
// ══════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();

  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: C.blue } });

  slide.addText('Prompt Construction – New TCs', {
    x: 0.4, y: 0.15, w: 12, h: 0.55,
    fontSize: 28, bold: true, color: C.dark, fontFace: 'Segoe UI',
  });

  slide.addShape(pptx.ShapeType.rect, { x: 0.4, y: 0.78, w: 1.8, h: 0.06, fill: { color: C.blue } });
  slide.addShape(pptx.ShapeType.rect, { x: 2.2, y: 0.78, w: 10.7, h: 0.06, fill: { color: 'e5e7eb' } });

  slide.addText('Scaffold new files', {
    x: 0.4, y: 0.88, w: 10, h: 0.3,
    fontSize: 11, italic: true, color: C.gray, fontFace: 'Segoe UI',
  });

  // Skills row
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 1.3, w: 12.5, h: 0.5,
    fill: { color: C.blueLight }, line: { color: C.blueMid, width: 1 },
  });
  slide.addText([
    { text: 'Skills:   ', options: { bold: true, color: C.blueDark } },
    { text: '"automation-architect"  ·  "pom-architect"  ·  "test-standards"  ·  "spec-standards"', options: { color: C.dark } },
  ], { x: 0.6, y: 1.33, w: 12, h: 0.42, fontSize: 11, fontFace: 'Segoe UI' });

  slide.addText('Consider:', {
    x: 0.4, y: 1.95, w: 3, h: 0.3,
    fontSize: 12, bold: true, color: C.dark, fontFace: 'Segoe UI',
  });

  const items = [
    {
      n: '1', col: 0, row: 0,
      title: 'Project Context',
      desc: 'What already exists: POs, fixtures, data, config. Goes into the prompt so the AI does not regenerate what already exists.',
    },
    {
      n: '2', col: 0, row: 1,
      title: 'Page Object Pattern',
      desc: 'Which POs are needed, URL path, auth required.\nHomePage → /  ·  ProductsPage → /products  ·  No auth',
    },
    {
      n: '3', col: 0, row: 2,
      title: 'Locators',
      desc: 'Generated with: npx playwright codegen <url>\nNever invented — always from real inspection.',
    },
    {
      n: '4', col: 1, row: 0,
      title: 'TC Specification',
      desc: 'TC number, name, and steps from the test management source. Defines what the test must verify.',
    },
    {
      n: '5', col: 1, row: 1,
      title: 'Target File Paths',
      desc: 'Where each file goes per spec-standards:\ntests/ui/{suite}/{feature}/TC{N}-{name}.spec.ts',
    },
    {
      n: '6', col: 1, row: 2,
      title: 'Validation Skills',
      desc: 'Which skills to run after to verify output:\npom-architect · test-standards · spec-standards → 0 violations',
    },
  ];

  items.forEach((item) => {
    const x = item.col === 0 ? 0.4 : 6.85;
    const y = 2.35 + item.row * 1.4;
    slide.addShape(pptx.ShapeType.rect, {
      x, y, w: 6.3, h: 1.28,
      fill: { color: C.white }, line: { color: 'e5e7eb', width: 1 },
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.15, y: y + 0.38, w: 0.42, h: 0.42,
      fill: { color: C.blueLight }, line: { color: C.blue, width: 1 },
    });
    slide.addText(item.n, {
      x: x + 0.15, y: y + 0.38, w: 0.42, h: 0.42,
      fontSize: 12, bold: true, color: C.blue,
      align: 'center', valign: 'middle', fontFace: 'Segoe UI',
    });
    slide.addText(item.title, {
      x: x + 0.7, y: y + 0.1, w: 5.4, h: 0.32,
      fontSize: 12, bold: true, color: C.dark, fontFace: 'Segoe UI',
    });
    slide.addText(item.desc, {
      x: x + 0.7, y: y + 0.44, w: 5.4, h: 0.76,
      fontSize: 10, color: C.gray, fontFace: 'Segoe UI',
    });
  });
}

// ══════════════════════════════════════════════════════════════════
// SLIDE 4 — What Makes a Good Prompt (NEW)
// ══════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();

  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: C.blue } });

  slide.addText('What Makes a Good Prompt', {
    x: 0.4, y: 0.15, w: 12, h: 0.55,
    fontSize: 28, bold: true, color: C.dark, fontFace: 'Segoe UI',
  });

  slide.addShape(pptx.ShapeType.rect, { x: 0.4, y: 0.78, w: 1.8, h: 0.06, fill: { color: C.blue } });
  slide.addShape(pptx.ShapeType.rect, { x: 2.2, y: 0.78, w: 10.7, h: 0.06, fill: { color: 'e5e7eb' } });

  slide.addText('General rules for prompt construction — applicable to any skill', {
    x: 0.4, y: 0.88, w: 10, h: 0.3,
    fontSize: 11, italic: true, color: C.gray, fontFace: 'Segoe UI',
  });

  // Left column header
  slide.addText('✅  7 Rules', {
    x: 0.4, y: 1.3, w: 6, h: 0.35,
    fontSize: 13, bold: true, color: C.green, fontFace: 'Segoe UI',
  });

  // Right column header
  slide.addText('❌  Anti-patterns', {
    x: 6.9, y: 1.3, w: 6, h: 0.35,
    fontSize: 13, bold: true, color: C.red, fontFace: 'Segoe UI',
  });

  const rules = [
    { n: '1', title: 'Clear task',           desc: 'One action verb, one scope — never mix create + review + fix in one prompt' },
    { n: '2', title: 'Existing context',     desc: 'Always include what already exists before asking to create anything' },
    { n: '3', title: 'Concrete inputs',      desc: 'Real locators, real TC IDs, real URLs — never "example" or "TBD"' },
    { n: '4', title: 'Pattern constraints',  desc: 'Reference the skill rules the output must satisfy (POM, spec-standards…)' },
    { n: '5', title: 'Exact output paths',   desc: 'Specify where each file goes — not just "create a file"' },
    { n: '6', title: 'Before/after examples','desc': 'Show the expected pattern, not just describe it' },
    { n: '7', title: 'Validation criteria',  desc: 'State which skill/command proves the output is correct' },
  ];

  const antiPatterns = [
    { title: 'Vague task',           desc: '"make it work" · "create a test"' },
    { title: 'No existing context',  desc: 'AI regenerates files that already exist' },
    { title: 'Hardcoded app values', desc: 'Prompt only works for one project/site' },
    { title: 'No constraints',       desc: 'Output violates POM rules or import conventions' },
    { title: 'No examples',          desc: 'Output style differs from the rest of the project' },
    { title: 'Missing validation',   desc: 'No way to know if the output is correct' },
    { title: 'Mixed scope',          desc: 'One prompt tries to create + review + migrate at once' },
  ];

  rules.forEach((r, i) => {
    const y = 1.75 + i * 0.7;
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.4, y, w: 6.3, h: 0.62,
      fill: { color: 'f0fdf4' }, line: { color: C.greenBorder, width: 0.75 },
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 0.52, y: y + 0.1, w: 0.38, h: 0.38,
      fill: { color: C.greenLight }, line: { color: C.green, width: 1 },
    });
    slide.addText(r.n, {
      x: 0.52, y: y + 0.1, w: 0.38, h: 0.38,
      fontSize: 10, bold: true, color: C.green,
      align: 'center', valign: 'middle', fontFace: 'Segoe UI',
    });
    slide.addText(r.title, {
      x: 1.02, y: y + 0.05, w: 5.5, h: 0.26,
      fontSize: 10, bold: true, color: C.dark, fontFace: 'Segoe UI',
    });
    slide.addText(r.desc, {
      x: 1.02, y: y + 0.31, w: 5.5, h: 0.24,
      fontSize: 9.5, color: C.gray, fontFace: 'Segoe UI',
    });
  });

  antiPatterns.forEach((a, i) => {
    const y = 1.75 + i * 0.7;
    slide.addShape(pptx.ShapeType.rect, {
      x: 6.9, y, w: 6.0, h: 0.62,
      fill: { color: 'fff1f2' }, line: { color: 'fca5a5', width: 0.75 },
    });
    slide.addText('✕', {
      x: 7.0, y: y + 0.14, w: 0.32, h: 0.32,
      fontSize: 11, bold: true, color: C.red,
      align: 'center', valign: 'middle', fontFace: 'Segoe UI',
    });
    slide.addText(a.title, {
      x: 7.38, y: y + 0.05, w: 5.3, h: 0.26,
      fontSize: 10, bold: true, color: C.dark, fontFace: 'Segoe UI',
    });
    slide.addText(a.desc, {
      x: 7.38, y: y + 0.31, w: 5.3, h: 0.24,
      fontSize: 9.5, color: C.gray, fontFace: 'Segoe UI',
    });
  });

  // Bottom formula
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 6.68, w: 12.5, h: 0.55,
    fill: { color: C.blueLight }, line: { color: C.blueMid, width: 1.5 },
  });
  slide.addText('Formula:  context + constraints + examples + validation criteria  =  prompt that produces correct output on first run', {
    x: 0.6, y: 6.7, w: 12.1, h: 0.5,
    fontSize: 10.5, color: C.blueDark, fontFace: 'Segoe UI', bold: false,
  });
}

// ─── Save ─────────────────────────────────────────────────────────
pptx.writeFile({ fileName: 'docs/M5-updated-slides.pptx' })
  .then(() => console.log('✅  docs/M5-updated-slides.pptx created — 4 slides'))
  .catch(err => { console.error('❌  Error:', err); process.exit(1); });
