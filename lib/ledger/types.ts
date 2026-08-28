export const LEDGER_CATEGORIES = [
  'Groceries',
  'Dining',
  'Transit',
  'Home',
  'Utilities',
  'Wellbeing',
  'Income',
] as const;

export type LedgerCategory = (typeof LEDGER_CATEGORIES)[number];
export type TransactionType = 'income' | 'expense';

export type LedgerTransaction = Readonly<{
  id: string;
  date: string;
  merchant: string;
  category: LedgerCategory;
  type: TransactionType;
  amountCents: number;
  accountLabel: string;
  note?: string;
  fictional: true;
}>;

export type DemoEntryInput = Readonly<{
  type: TransactionType;
  amountCents: number;
  category: LedgerCategory;
  merchant: string;
  date: string;
  note?: string;
}>;

export type DemoDraft = LedgerTransaction & Readonly<{ status: 'draft' }>;
export type PostedLedgerTransaction = LedgerTransaction & Readonly<{ status: 'posted' }>;

export type TransactionFilters = Readonly<{
  from?: string;
  to?: string;
  category?: LedgerCategory;
  type?: TransactionType;
  limit?: number;
}>;
