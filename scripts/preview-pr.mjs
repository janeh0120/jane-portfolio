#!/usr/bin/env node
// Runs a Claude-authored PR branch locally, away from your secrets.
//
//   npm run preview:pr <id>              review the changed files, then start the site
//   npm run preview:pr <id> -- --clean   remove that preview
//
// The branch is checked out in a separate folder that has no .env, and the server starts with a
// minimal environment. It can still read other files on your laptop, so read the diff first.

import { execFileSync, spawn } from 'node:child_process';
import { constants, cpSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PREVIEW_ROOT = join(homedir(), '.portfolio-pr-previews');
const PORT = '4322';

// Files that run code or change how the site builds. A feedback fix has no reason to touch them.
const FORBIDDEN = [
  /^package(-lock)?\.json$/,
  /^\.npmrc$/,
  /^\.env/,
  /^\.github\//,
  /^\.claude\//,
  /^\.vscode\//,
  /^CLAUDE\.md$/,
  /^astro\.config\./,
  /^tsconfig/,
  /^vite\.config\./,
  /^vercel\.json$/,
  /^scripts\//,
  /^supabase\//,
  /^src\/middleware/,
  /^src\/pages\/api\//,
  /^src\/pages\/admin\//,
  /^src\/lib\/(admin-auth|supabase|pr-requests|persistent-rate-limit)/,
];

function git(...args) {
  return execFileSync('git', args, { cwd: REPO, encoding: 'utf8' }).trim();
}

function fail(message) {
  console.error(`\n${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const clean = args.includes('--clean');
const id = args.find((arg) => !arg.startsWith('--')) ?? '';

if (!/^[0-9a-f]{8}$/.test(id)) {
  fail('Usage: npm run preview:pr <8-character comment id> [-- --clean]');
}

const branch = `claude/comment-${id}`;
const remoteRef = `refs/remotes/origin/${branch}`;
const previewDir = join(PREVIEW_ROOT, id);

if (clean) {
  if (existsSync(previewDir)) git('worktree', 'remove', '--force', previewDir);
  console.log(`Removed the preview for ${branch}.`);
  process.exit(0);
}

try {
  git('fetch', 'origin', `+refs/heads/main:refs/remotes/origin/main`, `+refs/heads/${branch}:${remoteRef}`);
} catch {
  fail(`Could not fetch ${branch}. Claude may still be working, or the branch may not exist yet.`);
}

const range = `refs/remotes/origin/main...${remoteRef}`;
const files = git('diff', '--name-only', range).split('\n').filter(Boolean);

if (files.length === 0) fail(`${branch} has no changes compared with main.`);

console.log(`\n${branch} changes:\n`);
console.log(git('diff', '--stat', range));

const blocked = files.filter((file) => FORBIDDEN.some((pattern) => pattern.test(file)));
if (blocked.length > 0) {
  console.error('\nThis branch changes files a feedback fix should never touch:');
  for (const file of blocked) console.error(`  ${file}`);
  fail('Not running it. Read the PR on GitHub and close it if you did not expect this.');
}

console.log(`\nRead the code before running it: git diff ${range}`);

const prompt = createInterface({ input: process.stdin, output: process.stdout });
const answer = await prompt.question('\nRun this branch on your laptop? [y/N] ');
prompt.close();
if (answer.trim().toLowerCase() !== 'y') fail('Stopped. Nothing was run.');

mkdirSync(PREVIEW_ROOT, { recursive: true });
if (existsSync(previewDir)) git('worktree', 'remove', '--force', previewDir);
git('worktree', 'add', '--detach', previewDir, remoteRef);

if (existsSync(join(previewDir, '.env'))) {
  fail('This branch contains a .env file. Not running it.');
}

// package.json and the lockfile are unchanged (checked above), so your installed packages match.
// A copy, not a symlink: Vite refuses to serve files from outside the preview folder. On macOS
// this is a near-instant clone that takes almost no disk space.
cpSync(join(REPO, 'node_modules'), join(previewDir, 'node_modules'), {
  recursive: true,
  verbatimSymlinks: true,
  mode: constants.COPYFILE_FICLONE,
});

console.log(`\nStarting http://localhost:${PORT}`);
console.log('Comment features will not load here because this preview has no database access.');
console.log(`When you're done: npm run preview:pr ${id} -- --clean\n`);

const server = spawn(
  join(previewDir, 'node_modules', '.bin', 'astro'),
  ['dev', '--port', PORT],
  {
    cwd: previewDir,
    stdio: 'inherit',
    env: { PATH: process.env.PATH, HOME: process.env.HOME, TERM: process.env.TERM },
  },
);

server.on('exit', (code) => process.exit(code ?? 0));
