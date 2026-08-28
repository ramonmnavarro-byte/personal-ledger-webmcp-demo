import { createLedgerSession, getLedgerSummary, listDemoTransactions } from '../ledger/service';

export type WebMcpTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: {
    readOnlyHint: boolean;
    openWorldHint: false;
    destructiveHint: false;
    untrustedContentHint: false;
  };
  execute: (input: unknown, client?: { signal?: AbortSignal }) => unknown;
};

export type ModelContextRegistry = {
  registerTool: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => unknown;
};

const categoryEnum = ['Groceries', 'Dining', 'Transit', 'Home', 'Utilities', 'Wellbeing', 'Income'];
const baseAnnotations = {
  openWorldHint: false,
  destructiveHint: false,
  untrustedContentHint: false,
} as const;

const hasRegisterTool = (modelContext: unknown): modelContext is ModelContextRegistry =>
  typeof (modelContext as ModelContextRegistry | undefined)?.registerTool === 'function';

export function registerLedgerTools(modelContext: unknown) {
  if (!hasRegisterTool(modelContext)) {
    return { status: 'unsupported' as const };
  }

  const controller = new AbortController();
  const session = createLedgerSession();
  const options = { signal: controller.signal };

  modelContext.registerTool(
    {
      name: 'get_ledger_summary',
      title: 'Get fictional ledger summary',
      description:
        'Returns bounded fictional balances, cash-flow totals, and category totals. Demo only; not financial advice.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { ...baseAnnotations, readOnlyHint: true },
      execute: () => getLedgerSummary(),
    },
    options,
  );

  modelContext.registerTool(
    {
      name: 'list_demo_transactions',
      title: 'List fictional demo transactions',
      description:
        'Lists fictional transactions with validated type, category, date range, and capped result filters.',
      inputSchema: {
        type: 'object',
        properties: {
          from: { type: 'string', format: 'date', description: 'Optional start date, YYYY-MM-DD.' },
          to: { type: 'string', format: 'date', description: 'Optional end date, YYYY-MM-DD.' },
          category: { type: 'string', enum: categoryEnum, description: 'Optional fictional category.' },
          type: { type: 'string', enum: ['income', 'expense'], description: 'Optional transaction type.' },
          limit: { type: 'integer', minimum: 1, maximum: 20, description: 'Maximum result count.' },
        },
        additionalProperties: false,
      },
      annotations: { ...baseAnnotations, readOnlyHint: true },
      execute: (input) => listDemoTransactions(input),
    },
    options,
  );

  modelContext.registerTool(
    {
      name: 'create_demo_entry',
      title: 'Create session-only draft entry',
      description:
        'Creates an ephemeral fictional draft entry. It never posts, emails, uploads, pays, or connects externally.',
      inputSchema: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['income', 'expense'], description: 'Fictional draft type.' },
          amountCents: { type: 'integer', minimum: 1, maximum: 1000000, description: 'Positive amount in cents.' },
          category: { type: 'string', enum: categoryEnum, description: 'Fictional category.' },
          merchant: { type: 'string', minLength: 2, maxLength: 60, description: 'Invented merchant only.' },
          date: { type: 'string', format: 'date', description: 'Draft date, YYYY-MM-DD.' },
          note: { type: 'string', maxLength: 120, description: 'Optional demo-safe note; no URLs or targets.' },
        },
        required: ['type', 'amountCents', 'category', 'merchant', 'date'],
        additionalProperties: false,
      },
      annotations: { ...baseAnnotations, readOnlyHint: false },
      execute: (input) => ({
        entry: session.createDemoEntry(input),
        savedExternally: false,
        boundary: 'session-only fictional draft',
      }),
    },
    options,
  );

  return { status: 'registered' as const, controller };
}
