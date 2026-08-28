import {
  DEMO_ACCOUNTS,
  DEMO_BUDGETS,
  DEMO_HOUSEHOLD,
  DEMO_PERIOD,
  DEMO_TRANSACTIONS,
} from './fixtures';
import {
  LEDGER_CATEGORIES,
  type DemoDraft,
  type DemoEntryInput,
  type LedgerCategory,
  type PostedLedgerTransaction,
  type TransactionFilters,
  type TransactionType,
} from './types';

const MAX_RESULT_LIMIT = 20;
const DEFAULT_RESULT_LIMIT = 10;
const MAX_AMOUNT_CENTS = 1_000_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EXTERNAL_PATTERN = /(?:https?:\/\/|www\.|@|mailto:|file:|post|publish|upload|send|email)/i;
const ACCOUNT_LIKE_PATTERN = /\b\d{8,}\b/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const assertNoUnexpectedFields = (input: Record<string, unknown>, allowed: ReadonlyArray<string>) => {
  const unexpected = Object.keys(input).find((key) => !allowed.includes(key));
  if (unexpected) throw new Error(`Unexpected field: ${unexpected}`);
};

function assertDate(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    throw new Error(`${label} must be an ISO date`);
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} must be a real date`);
  }
}

function assertCategory(value: unknown): asserts value is LedgerCategory {
  if (!LEDGER_CATEGORIES.includes(value as LedgerCategory)) {
    throw new Error('Category must be one of the fictional demo categories');
  }
}

function assertType(value: unknown): asserts value is TransactionType {
  if (value !== 'income' && value !== 'expense') {
    throw new Error('Type must be income or expense');
  }
}

export const parseTransactionFilters = (input: unknown): TransactionFilters => {
  if (!isRecord(input)) throw new Error('Filters must be an object');
  assertNoUnexpectedFields(input, ['from', 'to', 'category', 'type', 'limit']);
  if (input.from !== undefined) assertDate(input.from, 'from');
  if (input.to !== undefined) assertDate(input.to, 'to');
  if (input.from && input.to && input.from > input.to) {
    throw new Error('Invalid date range: from must not be after to');
  }
  if (input.category !== undefined) assertCategory(input.category);
  if (input.type !== undefined) assertType(input.type);
  const limit = input.limit;
  if (limit !== undefined && (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > MAX_RESULT_LIMIT)) {
    throw new Error(`Limit must be an integer from 1 to ${MAX_RESULT_LIMIT}`);
  }
  return {
    ...(input.from ? { from: input.from } : {}),
    ...(input.to ? { to: input.to } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.type ? { type: input.type } : {}),
    ...(limit ? { limit } : {}),
  };
};

export const parseDemoEntry = (input: unknown): DemoEntryInput => {
  if (!isRecord(input)) throw new Error('Demo entry must be an object');
  assertNoUnexpectedFields(input, ['type', 'amountCents', 'category', 'merchant', 'date', 'note']);
  assertType(input.type);
  assertCategory(input.category);
  assertDate(input.date, 'date');
  const amountCents = input.amountCents;
  if (typeof amountCents !== 'number' || !Number.isInteger(amountCents) || amountCents < 1 || amountCents > MAX_AMOUNT_CENTS) {
    throw new Error('Amount must be a positive integer no greater than 1000000 cents');
  }
  if (typeof input.merchant !== 'string' || input.merchant.trim().length < 2 || input.merchant.trim().length > 60) {
    throw new Error('Merchant must contain 2 to 60 characters');
  }
  if (input.note !== undefined && (typeof input.note !== 'string' || input.note.length > 120)) {
    throw new Error('Note must contain no more than 120 characters');
  }
  const text = `${input.merchant} ${input.note ?? ''}`;
  if (EXTERNAL_PATTERN.test(text)) throw new Error('External URLs, addresses, and targets are not allowed');
  if (ACCOUNT_LIKE_PATTERN.test(text)) throw new Error('Account-like identifiers are not allowed');
  return {
    type: input.type,
    amountCents,
    category: input.category,
    merchant: input.merchant.trim(),
    date: input.date,
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
  };
};

export const listDemoTransactions = (rawFilters: unknown = {}) => {
  const filters = parseTransactionFilters(rawFilters);
  const items: PostedLedgerTransaction[] = DEMO_TRANSACTIONS.filter((transaction) => {
    if (filters.from && transaction.date < filters.from) return false;
    if (filters.to && transaction.date > filters.to) return false;
    if (filters.category && transaction.category !== filters.category) return false;
    if (filters.type && transaction.type !== filters.type) return false;
    return true;
  })
    .slice(0, filters.limit ?? DEFAULT_RESULT_LIMIT)
    .map((item) => ({ ...item, status: 'posted' as const }));

  return Object.freeze({
    household: DEMO_HOUSEHOLD,
    fictional: true as const,
    resultCap: MAX_RESULT_LIMIT,
    count: items.length,
    items: items.map((item) => ({ ...item })),
  });
};

export const getLedgerSummary = () => {
  const incomeCents = DEMO_TRANSACTIONS.filter((item) => item.type === 'income').reduce((total, item) => total + item.amountCents, 0);
  const expenseCents = DEMO_TRANSACTIONS.filter((item) => item.type === 'expense').reduce((total, item) => total + item.amountCents, 0);
  const categoryTotals = DEMO_BUDGETS.map(({ category, budgetCents }) => {
    const spentCents = DEMO_TRANSACTIONS.filter((item) => item.type === 'expense' && item.category === category).reduce((total, item) => total + item.amountCents, 0);
    return { category, spentCents, budgetCents, remainingCents: budgetCents - spentCents };
  });
  return Object.freeze({
    household: DEMO_HOUSEHOLD,
    fictional: true as const,
    currency: 'USD' as const,
    disclaimer: 'Fictional demonstration only; not financial advice.',
    period: { ...DEMO_PERIOD },
    balances: DEMO_ACCOUNTS.map((account) => ({ ...account })),
    totalBalanceCents: DEMO_ACCOUNTS.reduce((total, account) => total + account.balanceCents, 0),
    incomeCents,
    expenseCents,
    netCashFlowCents: incomeCents - expenseCents,
    categoryTotals,
  });
};

export const createLedgerSession = () => {
  let drafts: ReadonlyArray<DemoDraft> = Object.freeze([]);
  let sequence = 0;
  return Object.freeze({
    createDemoEntry(rawInput: unknown): DemoDraft {
      const input = parseDemoEntry(rawInput);
      sequence += 1;
      const draft: DemoDraft = Object.freeze({
        ...input,
        id: `demo-draft-${sequence}`,
        accountLabel: 'Session-only draft',
        status: 'draft',
        fictional: true,
      });
      drafts = Object.freeze([...drafts, draft]);
      return { ...draft };
    },
    listDrafts(): ReadonlyArray<DemoDraft> {
      return drafts.map((draft) => ({ ...draft }));
    },
    reset(): void {
      drafts = Object.freeze([]);
      sequence = 0;
    },
  });
};
