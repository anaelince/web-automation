const fs    = require('fs');
const path  = require('path');
const JSZip = require('jszip');

async function inspect() {
  const data = fs.readFileSync(path.resolve('docs/course/M6-Test-Lifecycle-Control.pptx'));
  const zip  = await JSZip.loadAsync(data);

  for (const n of [3, 4, 5, 6]) {
    const f = zip.file(`ppt/slides/slide${n}.xml`);
    if (!f) continue;
    const xml = await f.async('string');
    console.log(`\n${'='.repeat(60)}`);
    console.log(`SLIDE ${n} (full XML)`);
    console.log('='.repeat(60));
    console.log(xml);
  }
}

inspect().catch(console.error);
