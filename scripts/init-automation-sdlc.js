#!/usr/bin/env node

/**
 * automation-sdlc --init
 *
 * Bootstraps the AI Automation SDLC configuration into a target project.
 * Supports Kiro, Claude Code, or both agents via the --agent flag.
 *
 * Usage:
 *   node scripts/init-automation-sdlc.js [target-dir] [--agent=kiro|claude|both]
 *
 *   node scripts/init-automation-sdlc.js ../my-project --agent=both   (default)
 *   node scripts/init-automation-sdlc.js ../my-project --agent=kiro
 *   node scripts/init-automation-sdlc.js ../my-project --agent=claude
 *
 * Future:
 *   npx automation-sdlc init [target-dir] [--agent=...]
 */

const fs   = require('fs');
const path = require('path');

// ── Args ──────────────────────────────────────────────────────────────────────

const REPO_ROOT  = path.resolve(__dirname, '..');
const positional = process.argv.slice(2).filter(a => !a.startsWith('--'));
const TARGET_DIR = positional[0] ? path.resolve(positional[0]) : process.cwd();

const agentFlag  = process.argv.find(a => a.startsWith('--agent='));
const AGENT      = agentFlag ? agentFlag.split('=')[1] : 'both';

if (!['kiro', 'claude', 'both'].includes(AGENT)) {
  console.error(`  ✖  Unknown --agent="${AGENT}". Use: kiro | claude | both`);
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

function copyFileTo(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return [];
  const copied = [];
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copied.push(...copyDir(s, d));
    else { copyFileTo(s, d); copied.push(d.replace(TARGET_DIR + path.sep, '')); }
  }
  return copied;
}

function copyOne(src, dest, label) {
  if (!fs.existsSync(src)) { console.log(`  ⚠  Missing: ${label}`); return; }
  if (fs.existsSync(dest)) {
    console.log(`  –  ${label} (already exists — skipped)`);
    results.skipped.push(label);
  } else {
    copyFileTo(src, dest);
    console.log(`  ✓  ${label}`);
    results.created.push(label);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║   AI Automation SDLC — Initialiser                  ║');
console.log('╚══════════════════════════════════════════════════════╝\n');
console.log(`  Target: ${TARGET_DIR}`);
console.log(`  Agent:  ${AGENT}\n`);

if (!fs.existsSync(TARGET_DIR)) {
  console.error(`  ✖  Target directory does not exist: ${TARGET_DIR}`);
  process.exit(1);
}

const results = { created: [], skipped: [] };

// ── KIRO LAYER ────────────────────────────────────────────────────────────────

if (AGENT === 'kiro' || AGENT === 'both') {

  console.log('  ── Kiro ──────────────────────────────────────────────');

  // 1. Skills
  console.log('\n  [kiro 1/4] Skills...');
  const kiroSkills = copyDir(
    path.join(REPO_ROOT, '.kiro', 'skills'),
    path.join(TARGET_DIR, '.kiro', 'skills'),
  );
  kiroSkills.forEach(f => { console.log(`  ✓  ${f}`); results.created.push(f); });

  // 2. Steering
  console.log('\n  [kiro 2/4] Steering files...');
  const kiroSteering = copyDir(
    path.join(REPO_ROOT, '.kiro', 'steering'),
    path.join(TARGET_DIR, '.kiro', 'steering'),
  );
  kiroSteering.forEach(f => { console.log(`  ✓  ${f}`); results.created.push(f); });

  // 3. Hooks
  console.log('\n  [kiro 3/4] Hooks...');
  const kiroHooks = copyDir(
    path.join(REPO_ROOT, '.kiro', 'hooks'),
    path.join(TARGET_DIR, '.kiro', 'hooks'),
  );
  kiroHooks.forEach(f => { console.log(`  ✓  ${f}`); results.created.push(f); });

  // 4. MCP example
  console.log('\n  [kiro 4/4] MCP example config...');
  copyOne(
    path.join(__dirname, 'templates', 'mcp.example.json'),
    path.join(TARGET_DIR, '.kiro', 'settings', 'mcp.example.json'),
    '.kiro/settings/mcp.example.json',
  );
}

// ── CLAUDE LAYER ──────────────────────────────────────────────────────────────

if (AGENT === 'claude' || AGENT === 'both') {

  console.log('\n  ── Claude ────────────────────────────────────────────');

  // 1. CLAUDE.md
  console.log('\n  [claude 1/2] CLAUDE.md...');
  copyOne(
    path.join(REPO_ROOT, 'CLAUDE.md'),
    path.join(TARGET_DIR, 'CLAUDE.md'),
    'CLAUDE.md',
  );

  // 2. Claude skill reference
  console.log('\n  [claude 2/2] docs/agents/claude/...');
  const claudeAgents = copyDir(
    path.join(REPO_ROOT, 'docs', 'agents', 'claude'),
    path.join(TARGET_DIR, 'docs', 'agents', 'claude'),
  );
  claudeAgents.forEach(f => { console.log(`  ✓  ${f}`); results.created.push(f); });
}

// ── SHARED DOCS ───────────────────────────────────────────────────────────────

console.log('\n  ── Shared docs ───────────────────────────────────────');
console.log('\n  [docs] Governance + skill prompts...');

const sharedDocs = [
  ['docs/wiki/ai-governance.md'],
  ['docs/wiki/init-script.md'],
  ['docs/wiki/dual-agent-setup.md'],
  ['docs/decisions/ADR-001-skill-naming-convention.md'],
  ...fs.readdirSync(path.join(REPO_ROOT, 'docs', 'skills'))
      .filter(f => f.endsWith('.md'))
      .map(f => [`docs/skills/${f}`]),
];

for (const [rel] of sharedDocs) {
  copyOne(
    path.join(REPO_ROOT, rel),
    path.join(TARGET_DIR, rel),
    rel,
  );
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║   Summary                                            ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log(`\n  Agent:   ${AGENT}`);
console.log(`  Created: ${results.created.length} files`);
console.log(`  Skipped: ${results.skipped.length} files (already exist)`);
console.log('\n  Next steps:');
if (AGENT === 'kiro' || AGENT === 'both') {
  console.log('  Kiro:');
  console.log('    1. Open the target project in Kiro IDE');
  console.log('    2. Run "apply architecture" to verify the setup');
  console.log('    3. Adapt framework-*.md steering files to your project stack');
  console.log('    4. Copy .kiro/settings/mcp.example.json → mcp.json');
}
if (AGENT === 'claude' || AGENT === 'both') {
  console.log('  Claude:');
  console.log('    1. Open the target project in Claude Code');
  console.log('    2. CLAUDE.md is auto-loaded — say "apply architecture" to verify');
  console.log('    3. For full skill rules: @docs/agents/claude/skill-reference.md');
}
console.log('\n  Read docs/wiki/dual-agent-setup.md for the full setup guide\n');
