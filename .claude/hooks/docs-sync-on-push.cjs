// PostToolUse hook (migrated from .kiro/hooks/docs-sync-on-push.json).
// After a `git push` run via Bash/PowerShell, warns if docs look stale for the pushed commit.
const { execSync } = require('child_process');

let input;
try { input = JSON.parse(require('fs').readFileSync(0, 'utf8')); } catch { process.exit(0); }
const cmd = (input.tool_input && input.tool_input.command) || '';
if (!/\bgit\s+push\b/.test(cmd)) process.exit(0);

let changed = [];
try {
  changed = execSync('git diff HEAD~1 HEAD --name-only', {
    cwd: input.cwd || process.cwd(),
    stdio: ['ignore', 'pipe', 'ignore'],
  }).toString().split('\n').map(s => s.trim()).filter(Boolean);
} catch { process.exit(0); }
if (!changed.length) process.exit(0);

const warnings = new Set();
const skillChanged = changed.some(f => f.startsWith('.claude/skills/') || f.startsWith('.kiro/skills/'));
if (skillChanged && !changed.includes('README.md')) warnings.add('- README.md §9 AI Skills may be out of sync');

for (const f of changed) {
  const api = f.match(/^src\/api\/sites\/([^/]+)\//);
  if (api && !changed.some(c => c.includes('docs/wiki/api/' + api[1]))) {
    warnings.add(`- docs/wiki/api/${api[1]}-api-layer.md may be out of sync`);
  }
  const spec = f.match(/^tests\/ui\/smoke\/sites\/([^/]+)\/.*\.spec\.ts$/);
  if (spec && !changed.some(c => c.includes('docs/test-cases/' + spec[1]))) {
    warnings.add(`- docs/test-cases/${spec[1]}/ may be out of sync`);
  }
}

if (warnings.size) {
  const text = 'Docs may be out of sync after this push:\n' + [...warnings].join('\n') +
    '\n\nRun: "update docs" via automation-architect to sync.';
  console.log(JSON.stringify({
    systemMessage: text,
    hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: text },
  }));
}
process.exit(0);
