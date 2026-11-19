---
paths:
  - "docs/course/**"
  - "docs/scripts/**"
---


# PPTX Workflow for This Environment

## Environment facts (verified)

| Tool | Status |
|------|--------|
| Python | ❌ Not installed — do NOT attempt `python`, `py`, or `pip` |
| Node.js | ✅ v24+ available |
| pptxgenjs | ✅ v4.0.1 installed **globally** (`npm list -g pptxgenjs`) |

## How to create or extend a PPTX file

Use **pptxgenjs** via a temporary Node.js script. Steps:

1. Write a `.js` script (ESM or CJS) that imports `pptxgenjs` from the global install.
2. Run it with `node --input-type=commonjs` or save as a `.cjs` file.
3. Call `pres.writeFile({ fileName: 'path/to/file.pptx' })` — this **overwrites** the target file.

### Resolve global pptxgenjs path

```js
const { createRequire } = require('module');
const globalRequire = createRequire(
  require('child_process')
    .execSync('npm root -g')
    .toString()
    .trim() + '/pptxgenjs/package.json'
);
const PptxGenJS = require(
  require('path').join(
    require('child_process').execSync('npm root -g').toString().trim(),
    'pptxgenjs'
  )
);
```

Simpler pattern (works when global node_modules is on NODE_PATH):

```powershell
$env:NODE_PATH = (npm root -g); node script.cjs
```

## Limitations

- **pptxgenjs creates slides from scratch** — it does not parse existing `.pptx` XML.
- To add slides to an existing deck without recreating all slides, you must either:
  - Recreate the entire file (safe when you have full slide content), or
  - Use the **Open XML SDK** approach via a PowerShell script (advanced).
- For course material where slides are authored here: always keep a JS script next to each PPTX so it can be regenerated.

## Course slide style tokens (extracted from M6 deck, 2026-11-18)

Slide size 16:9 (13.33" × 7.5"). Fonts are set explicitly on every text run — the theme
default (Calibri) is NOT used.

```js
const FONT = 'Aptos';

// Text
const TITLE    = '335B74';   // slide titles, card headings (28 pt title)
const TEXT     = '26343B';   // body text
const MUTED    = '66737A';   // subtitles, secondary text
const LINK     = '2683C6';   // labels such as "Key principle:"

// Accent and surfaces
const ACCENT   = '1CADE4';   // underline bar under title, highlight borders
const CARD     = 'EFF4F6';   // neutral cards
const CARD_BD  = 'D5DEE2';   // neutral card border
const INFO     = 'E8F7FA';   // key-principle bar, bottom banner (border ACCENT)
const WARM     = 'FFF4E8';   // highlighted column
const WARN     = 'B26B02';   // warning / safeguard text
```

Typical sizes: title 28 · subtitle 11–12 · card heading 18–20 · body 14–15 · notes 11–12.

## Slide content rules

- Every slide tells **problem → how it is solved → evidence** (evidence only when it exists).
- Composition is free (cards, columns, diagrams, code, console boxes) as long as the visual
  tokens above are used. Do not copy one layout for every slide.
- Evidence is real skill or test output, read from `docs/course/evidence/<module>/*.txt` by the
  generator script — never retyped by hand.
- Content lives in a separate content file next to the generator script.

## Reference scripts

| Script | Purpose |
|--------|---------|
| `docs/scripts/create-m6-part2.cjs` | Generates `docs/course/M6-Part2-TC-Lifecycle-Data.pptx` (14 slides). Content in `m6-part2.content.cjs`; numbers read from `docs/course/evidence/m6/`; built-in overflow estimator (no renderer here) |

No PowerPoint or LibreOffice is installed in this environment, so slides cannot be rendered
to images for visual QA — rely on the generator's overflow warnings and review in PowerPoint.

