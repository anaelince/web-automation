/**
 * Extracts theme colors, fonts, and layout info from M6-Test-Lifecycle-Control.pptx
 */
const fs   = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function inspect() {
  const filePath = path.resolve('docs/course/M6-Test-Lifecycle-Control.pptx');
  const data     = fs.readFileSync(filePath);
  const zip      = await JSZip.loadAsync(data);

  const files = Object.keys(zip.files).sort();
  console.log('\n=== FILES IN PPTX ===');
  files.forEach(f => console.log(' ', f));

  // --- Theme colors ---
  const themeFile = zip.file('ppt/theme/theme1.xml');
  if (themeFile) {
    const xml = await themeFile.async('string');
    console.log('\n=== THEME XML ===\n', xml);
  }

  // --- Slide master ---
  const masterFile = zip.file('ppt/slideMasters/slideMaster1.xml');
  if (masterFile) {
    const xml = await masterFile.async('string');
    console.log('\n=== SLIDE MASTER (first 4000 chars) ===\n', xml.slice(0, 4000));
  }

  // --- First slide ---
  const slide1 = zip.file('ppt/slides/slide1.xml');
  if (slide1) {
    const xml = await slide1.async('string');
    console.log('\n=== SLIDE 1 (first 6000 chars) ===\n', xml.slice(0, 6000));
  }

  // --- Slide 2 (if exists) ---
  const slide2 = zip.file('ppt/slides/slide2.xml');
  if (slide2) {
    const xml = await slide2.async('string');
    console.log('\n=== SLIDE 2 (first 4000 chars) ===\n', xml.slice(0, 4000));
  }

  // --- Presentation file (slide size etc.) ---
  const prsFile = zip.file('ppt/presentation.xml');
  if (prsFile) {
    const xml = await prsFile.async('string');
    console.log('\n=== PRESENTATION.XML (first 2000 chars) ===\n', xml.slice(0, 2000));
  }
}

inspect().catch(console.error);
