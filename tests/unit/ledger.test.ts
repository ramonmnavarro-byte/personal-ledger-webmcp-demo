import { describe, expect, it } from 'vitest';

import {
  createLedgerSession,
  getLedgerSummary,
  listDemoTransactions,
} from '../../lib/ledger/service';

describe('ledger reads', () => {
  it('summarizes fictional balances, cash flow, and categories', () => {
    const summary = getLedgerSummary();

    expect(summary.household).toBe('Northstar Household');
    expect(summary.fictional).toBe(true);
    expect(summary.totalBalanceCents).toBeGreaterThan(0);
    expect(summary.incomeCents).toBeGreaterThan(summary.expenseCents);
    expect(summary.categoryTotals.length).toBeGreaterThan(3);
  });

  it('filters by type, category, and a bounded date range', () => {
    const result = listDemoTransactions({
      type: 'expense',
      category: 'Groceries',
      from: '2026-08-01',
      to: '2026-08-31',
      limit: 3,
    });

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.length).toBeLessThanOrEqual(3);
    expect(result.items.every((item) => item.category === 'Groceries')).toBe(true);
    expect(result.items.every((item) => item.type === 'expense')).toBe(true);
  });

  it('rejects unbounded or invalid filters', () => {
    expect(() => listDemoTransactions({ limit: 21 })).toThrow(/limit/i);
    expect(() =>
      listDemoTransactions({ from: '2026-09-01', to: '2026-08-01' }),
    ).toThrow(/date range/i);
    expect(() =>
      listDemoTransactions({ category: 'Crypto' as 'Groceries' }),
    ).toThrow(/category/i);
  });
});

describe('ephemeral draft entries', () => {
  it('creates a session-only fictional draft and resets cleanly', () => {
    const session = createLedgerSession();
    const draft = session.createDemoEntry({
      type: 'expense',
      amountCents: 4299,
      category: 'Home',
      merchant: 'Juniper Home Supply',
      date: '2026-08-27',
      note: 'Demo shelf brackets',
    });

    expect(draft.status).toBe('draft');
    expect(draft.fictional).toBe(true);
    expect(session.listDrafts()).toHaveLength(1);

    session.reset();
    expect(session.listDrafts()).toEqual([]);
  });

  it('rejects invalid amounts, categories, and extra external fields', () => {
    const session = createLedgerSession();

    expect(() =>
      session.createDemoEntry({
        type: 'expense',
        amountCents: -1,
        category: 'Home',
        merchant: 'Juniper Home Supply',
        date: '2026-08-27',
      }),
    ).toThrow(/amount/i);

    expect(() =>
      session.createDemoEntry({
        type: 'expense',
        amountCents: 1000,
        category: 'Crypto' as 'Home',
        merchant: 'Juniper Home Supply',
        date: '2026-08-27',
      }),
    ).toThrow(/category/i);

    expect(() =>
      session.createDemoEntry({
        type: 'expense',
        amountCents: 1000,
        category: 'Home',
        merchant: 'Juniper Home Supply',
        date: '2026-08-27',
        url: 'https://example.invalid',
      } as never),
    ).toThrow(/unexpected field/i);
  });

  it('rejects URL-like or account-like content', () => {
    const session = createLedgerSession();

    expect(() =>
      session.createDemoEntry({
        type: 'expense',
        amountCents: 1000,
        category: 'Home',
        merchant: 'https://merchant.invalid',
        date: '2026-08-27',
      }),
    ).toThrow(/external/i);

    expect(() =>
      session.createDemoEntry({
        type: 'expense',
        amountCents: 1000,
        category: 'Home',
        merchant: 'Juniper Home Supply',
        date: '2026-08-27',
        note: 'Account 123456789012',
      }),
    ).toThrow(/account/i);
  });
});
