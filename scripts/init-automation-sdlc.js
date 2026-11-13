#!/usr/bin/env node

/**
 * automation-sdlc --init
 *
 * Bootstraps the AI Automation SDLC configuration into a target project.
 * Copies .kiro/skills/, .kiro/steering/, .kiro/hooks/ and the docs/skills/
 * governance documents from this repo template into the target directory.
 *
 * Usage:
 *   node scripts/init-automation-sdlc.js [target-dir]
 *   node scripts/init-automation-sdlc.js ../my-new-project
 *   node scripts/init-automation-sdlc.js  (defaults to current directory)
 *
 * Future:
 *   npx automation-sdlc init [target-dir]
 */

const fs   = require('fs');
const path = require('path');

// ── Paths ─────────────────────────────────────────────────────────────────────

const REPO_ROOT  = path.resolve(__dirname, '..');
const TARGET_DIR = process.argv[2]
  ? path.resolve(process.argv[2])
  : process.cwd();

// ── Helpers ───────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest, { exclude = [] } = {}) {
  if (!fs.existsSync(src)) return [];
  const entries = fs.readdirSync(src, { withFileTypes: true });
  const copied = [];
  for (const entry of entries) {
    if (exclude.includes(entry.name)) continue;
    const srcPath  = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copied.push(...copyDir(srcPath, destPath, { exclude }));
    } else {
      copyFile(srcPath, destPath);
      copied.push(destPath.replace(TARGET_DIR + path.sep, ''));
    }
  }
  return copied;
}

function log(icon, msg) {
  console.log(`  ${icon}  ${msg}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║   AI Automation SDLC — Initialiser                  ║');
console.log('╚══════════════════════════════════════════════════════╝\n');
console.log(`  Target: ${TARGET_DIR}\n`);

if (!fs.existsSync(TARGET_DIR)) {
  console.error(`  ✖  Target directory does not exist: ${TARGET_DIR}`);
  process.exit(1);
}

const results = { created: [], skipped: [] };

// ── 1. .kiro/skills/ ─────────────────────────────────────────────────────────

console.log('  [1/4] Skills...');
const skillsSrc  = path.join(REPO_ROOT, '.kiro', 'skills');
const skillsDest = path.join(TARGET_DIR, '.kiro', 'skills');

if (!fs.existsSync(skillsSrc)) {
  log('⚠', 'No .kiro/skills/ found in source repo — skipping');
} else {
  const copied = copyDir(skillsSrc, skillsDest);
  copied.forEach(f => log('✓', f));
  results.created.push(...copied);
}

// ── 2. .kiro/steering/ ───────────────────────────────────────────────────────

console.log('\n  [2/4] Steering files...');
const steeringSrc  = path.join(REPO_ROOT, '.kiro', 'steering');
const steeringDest = path.join(TARGET_DIR, '.kiro', 'steering');

if (!fs.existsSync(steeringSrc)) {
  log('⚠', 'No .kiro/steering/ found in source repo — skipping');
} else {
  const copied = copyDir(steeringSrc, steeringDest);
  copied.forEach(f => log('✓', f));
  results.created.push(...copied);
}

// ── 3. .kiro/hooks/ ──────────────────────────────────────────────────────────

console.log('\n  [3/4] Hooks...');
const hooksSrc  = path.join(REPO_ROOT, '.kiro', 'hooks');
const hooksDest = path.join(TARGET_DIR, '.kiro', 'hooks');

if (!fs.existsSync(hooksSrc)) {
  log('⚠', 'No .kiro/hooks/ found in source repo — skipping');
} else {
  const copied = copyDir(hooksSrc, hooksDest);
  copied.forEach(f => log('✓', f));
  results.created.push(...copied);
}

// ── 4. docs/ governance ──────────────────────────────────────────────────────

console.log('\n  [4/5] Docs (skills prompts + governance)...');

const docTargets = [
  // AI governance wiki
  { src: path.join(REPO_ROOT, 'docs', 'wiki', 'ai-governance.md'),
    dest: path.join(TARGET_DIR, 'docs', 'wiki', 'ai-governance.md') },
  // Init script reference
  { src: path.join(REPO_ROOT, 'docs', 'wiki', 'init-script.md'),
    dest: path.join(TARGET_DIR, 'docs', 'wiki', 'init-script.md') },
  // ADR-001 naming convention
  { src: path.join(REPO_ROOT, 'docs', 'decisions', 'ADR-001-skill-naming-convention.md'),
    dest: path.join(TARGET_DIR, 'docs', 'decisions', 'ADR-001-skill-naming-convention.md') },
  // All skill prompts
  ...fs.readdirSync(path.join(REPO_ROOT, 'docs', 'skills'))
      .filter(f => f.endsWith('.md'))
      .map(f => ({
        src:  path.join(REPO_ROOT, 'docs', 'skills', f),
        dest: path.join(TARGET_DIR, 'docs', 'skills', f),
      })),
];

for (const { src, dest } of docTargets) {
  if (!fs.existsSync(src)) { log('⚠', `Missing: ${src}`); continue; }
  const rel = dest.replace(TARGET_DIR + path.sep, '');
  if (fs.existsSync(dest)) {
    log('–', `${rel} (already exists — skipped)`);
    results.skipped.push(rel);
  } else {
    copyFile(src, dest);
    log('✓', rel);
    results.created.push(rel);
  }
}

// ── 5. MCP example config ─────────────────────────────────────────────────────

console.log('\n  [5/5] MCP example config...');
const mcpExampleSrc  = path.join(__dirname, 'templates', 'mcp.example.json');
const mcpExampleDest = path.join(TARGET_DIR, '.kiro', 'settings', 'mcp.example.json');

if (fs.existsSync(mcpExampleSrc)) {
  if (fs.existsSync(mcpExampleDest)) {
    log('–', '.kiro/settings/mcp.example.json (already exists — skipped)');
    results.skipped.push('.kiro/settings/mcp.example.json');
  } else {
    copyFile(mcpExampleSrc, mcpExampleDest);
    log('✓', '.kiro/settings/mcp.example.json');
    results.created.push('.kiro/settings/mcp.example.json');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║   Summary                                            ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log(`\n  Created: ${results.created.length} files`);
console.log(`  Skipped: ${results.skipped.length} files (already exist)`);

console.log('\n  Next steps:');
console.log('  1. Open the target project in Kiro IDE');
console.log('  2. The skills, steering, and hooks are ready to use');
console.log('  3. Run "apply architecture" in Kiro chat to verify the setup');
console.log('  4. Read docs/wiki/ai-governance.md for governance conventions');
console.log('  5. Adapt framework-*.md steering files to your project stack');
console.log('  6. Copy .kiro/settings/mcp.example.json → mcp.json and configure MCP servers');
console.log('  7. See docs/wiki/init-script.md for full configuration checklist\n');
