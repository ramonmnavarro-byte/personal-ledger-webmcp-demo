import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

type Finding = Readonly<{ file: string; rule: string }>;

const root = resolve(import.meta.dirname, '..');
const directories = ['app', 'lib', 'docs', 'public'];
const standaloneFiles = ['README.md', 'next.config.ts', 'vercel.json', '.openai/hosting.json'];
const allowedExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.md', '.css', '.svg']);

const remoteProtocol = new RegExp(['ht', 'tps?://(?!localhost|127\\.0\\.0\\.1)'].join(''), 'i');
const privatePath = new RegExp(['/(?:Us', 'ers|home)/|[A-Z]:\\\\Users\\\\|file://'].join(''), 'i');
const secretToken = new RegExp('(?:(?:sk|ghp|xox[baprs])-[A-Za-z0-9_-]{16,}|AKIA[0-9A-Z]{16}|BEGIN [A-Z ]+PRIVATE KEY)');
const realFinancialIdentifier = /\b(?:\d[ -]*?){12,19}\b|\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/;
const trackingOrStorage = new RegExp(['document\\.cookie', 'localStorage', 'sessionStorage', 'indexedDB', 'google-analytics', 'googletagmanager', 'posthog', 'mixpanel', 'hotjar'].join('|'), 'i');
const productionConnectorImport = /(?:from\s+|require\()['"][^'"]*(?:plaid|stripe|supabase|firebase|prisma|clerk|auth0|sentry)[^'"]*['"]/i;

const rules = [
  { name: 'secret-like token', pattern: secretToken },
  { name: 'private filesystem path', pattern: privatePath },
  { name: 'remote URL', pattern: remoteProtocol },
  { name: 'real-looking financial identifier', pattern: realFinancialIdentifier },
  { name: 'tracking, browser storage, or telemetry', pattern: trackingOrStorage },
  { name: 'production connector import', pattern: productionConnectorImport },
] as const;

const isAllowedRemoteUrl = (file: string, contents: string) => {
  if (file === 'docs/PRIVACY-ARCHITECTURE.md') return true;
  if (file === 'public/favicon.svg' && contents.includes('http://www.w3.org/2000/svg')) return true;
  if (file === 'next.config.ts' && contents.includes('http://localhost:*')) return true;
  return false;
};

const collectFiles = async (path: string): Promise<string[]> => {
  try {
    const details = await stat(path);
    if (details.isFile()) return allowedExtensions.has(extname(path)) || path.endsWith('hosting.json') ? [path] : [];
    const children = await readdir(path);
    const nested = await Promise.all(children.map((child) => collectFiles(join(path, child))));
    return nested.flat();
  } catch {
    return [];
  }
};

const candidates = (
  await Promise.all([
    ...directories.map((directory) => collectFiles(join(root, directory))),
    ...standaloneFiles.map((file) => collectFiles(join(root, file))),
  ])
).flat();

const findings: Finding[] = [];
for (const file of candidates) {
  const contents = await readFile(file, 'utf8');
  const relativePath = relative(root, file);
  for (const rule of rules) {
    if (rule.name === 'remote URL' && isAllowedRemoteUrl(relativePath, contents)) continue;
    if (rule.name === 'tracking, browser storage, or telemetry' && relativePath === 'docs/PRIVACY-ARCHITECTURE.md') continue;
    if (rule.pattern.test(contents)) findings.push({ file: relativePath, rule: rule.name });
  }
}

const hostingText = await readFile(join(root, '.openai/hosting.json'), 'utf8');
const hosting = JSON.parse(hostingText) as { d1?: unknown; r2?: unknown; auth?: unknown };
if (hosting.d1 !== null || hosting.r2 !== null || hosting.auth !== undefined) {
  findings.push({ file: '.openai/hosting.json', rule: 'unexpected D1, R2, or auth capability' });
}

if (findings.length > 0) {
  process.stderr.write('Privacy scan failed:\n');
  findings.forEach((finding) => process.stderr.write(`- ${finding.file}: ${finding.rule}\n`));
  process.exitCode = 1;
} else {
  process.stdout.write(`Privacy scan passed across ${candidates.length} local authored files.\n`);
}
