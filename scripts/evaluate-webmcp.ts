import { registerLedgerTools, type WebMcpTool } from '../lib/webmcp/register';

type Check = Readonly<{ name: string; passed: boolean; detail: string }>;

const checks: Check[] = [];
const record = (name: string, passed: boolean, detail: string) => {
  checks.push(Object.freeze({ name, passed, detail }));
};

const captureTools = () => {
  const tools = new Map<string, WebMcpTool>();
  const registration = registerLedgerTools({
    registerTool: (tool: WebMcpTool) => tools.set(tool.name, tool),
  });
  return { tools, registration };
};

const expectFailure = (name: string, action: () => unknown, pattern: RegExp) => {
  try {
    action();
    record(name, false, 'Expected rejection, but the call succeeded.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    record(name, pattern.test(message), message);
  }
};

const first = captureTools();
record('register exactly three tools', first.tools.size === 3, [...first.tools.keys()].join(', '));

const summary = first.tools.get('get_ledger_summary')?.execute({}) as
  | { fictional?: boolean; household?: string; expenseCents?: number }
  | undefined;
record(
  'valid bounded summary read',
  summary?.fictional === true && summary.household === 'Northstar Household',
  JSON.stringify(summary),
);

const filtered = first.tools.get('list_demo_transactions')?.execute({
  category: 'Groceries',
  type: 'expense',
  from: '2026-08-01',
  to: '2026-08-31',
  limit: 2,
}) as { items?: Array<{ category?: string; type?: string }> } | undefined;
record(
  'valid filtered transaction read',
  Boolean(
    filtered?.items?.length &&
      filtered.items.length <= 2 &&
      filtered.items.every((item) => item.category === 'Groceries' && item.type === 'expense'),
  ),
  JSON.stringify(filtered),
);

const validDraft = first.tools.get('create_demo_entry')?.execute({
  type: 'expense',
  amountCents: 4299,
  category: 'Home',
  merchant: 'Juniper Home Supply',
  date: '2026-08-27',
  note: 'Fictional review draft',
}) as { entry?: { status?: string; fictional?: boolean }; savedExternally?: boolean } | undefined;
record(
  'valid session-only demo write',
  validDraft?.entry?.status === 'draft' &&
    validDraft.entry.fictional === true &&
    validDraft.savedExternally === false,
  JSON.stringify(validDraft),
);

expectFailure(
  'reject invalid amount',
  () =>
    first.tools.get('create_demo_entry')?.execute({
      type: 'expense',
      amountCents: -12,
      category: 'Home',
      merchant: 'Juniper Home Supply',
      date: '2026-08-27',
    }),
  /amount/i,
);

expectFailure(
  'reject invalid category',
  () =>
    first.tools.get('create_demo_entry')?.execute({
      type: 'expense',
      amountCents: 1200,
      category: 'External Assets',
      merchant: 'Juniper Home Supply',
      date: '2026-08-27',
    }),
  /category/i,
);

expectFailure(
  'reject forbidden external action fields',
  () =>
    first.tools.get('create_demo_entry')?.execute({
      type: 'expense',
      amountCents: 1200,
      category: 'Home',
      merchant: 'Juniper Home Supply',
      date: '2026-08-27',
      externalTarget: 'payment destination',
    }),
  /unexpected field/i,
);

if (first.registration.status === 'registered') first.registration.controller.abort();
const clean = captureTools();
const cleanDraft = clean.tools.get('create_demo_entry')?.execute({
  type: 'expense',
  amountCents: 100,
  category: 'Home',
  merchant: 'Cedar Demo Shop',
  date: '2026-08-27',
}) as { entry?: { id?: string } } | undefined;
record('clean-state reset on new session', cleanDraft?.entry?.id === 'demo-draft-1', JSON.stringify(cleanDraft));
if (clean.registration.status === 'registered') clean.registration.controller.abort();

for (const check of checks) {
  const marker = check.passed ? 'PASS' : 'FAIL';
  process.stdout.write(`${marker}  ${check.name}\n`);
  if (!check.passed) process.stdout.write(`      ${check.detail}\n`);
}

const failed = checks.filter((check) => !check.passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} WebMCP evaluations passed.\n`);
if (failed.length > 0) process.exitCode = 1;
