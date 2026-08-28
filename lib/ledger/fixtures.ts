import type { LedgerCategory, LedgerTransaction } from './types';

export const DEMO_HOUSEHOLD = 'Northstar Household';
export const DEMO_PERIOD = Object.freeze({
  from: '2026-08-01',
  to: '2026-08-31',
  label: 'August 2026',
});

export const DEMO_ACCOUNTS = Object.freeze([
  Object.freeze({ label: 'Northstar Demo Checking', balanceCents: 1248042 }),
  Object.freeze({ label: 'Northstar Demo Reserve', balanceCents: 872000 }),
]);

export const DEMO_BUDGETS: ReadonlyArray<
  Readonly<{ category: Exclude<LedgerCategory, 'Income'>; budgetCents: number }>
> = Object.freeze([
  Object.freeze({ category: 'Groceries', budgetCents: 85000 }),
  Object.freeze({ category: 'Dining', budgetCents: 36000 }),
  Object.freeze({ category: 'Transit', budgetCents: 50000 }),
  Object.freeze({ category: 'Home', budgetCents: 70000 }),
  Object.freeze({ category: 'Utilities', budgetCents: 60000 }),
  Object.freeze({ category: 'Wellbeing', budgetCents: 40000 }),
]);

export const DEMO_TRANSACTIONS: ReadonlyArray<LedgerTransaction> = Object.freeze([
  Object.freeze({ id: 'demo-tx-009', date: '2026-08-27', merchant: 'Cloudline Transit', category: 'Transit', type: 'expense', amountCents: 1825, accountLabel: 'Northstar Demo Checking', fictional: true }),
  Object.freeze({ id: 'demo-tx-008', date: '2026-08-26', merchant: 'Pine & Rail', category: 'Dining', type: 'expense', amountCents: 4230, accountLabel: 'Northstar Demo Checking', fictional: true }),
  Object.freeze({ id: 'demo-tx-007', date: '2026-08-24', merchant: 'Harbor Market', category: 'Groceries', type: 'expense', amountCents: 12847, accountLabel: 'Northstar Demo Checking', fictional: true }),
  Object.freeze({ id: 'demo-tx-006', date: '2026-08-20', merchant: 'Sunward Studio Payroll', category: 'Income', type: 'income', amountCents: 320000, accountLabel: 'Northstar Demo Checking', fictional: true }),
  Object.freeze({ id: 'demo-tx-005', date: '2026-08-18', merchant: 'Juniper Home Supply', category: 'Home', type: 'expense', amountCents: 4690, accountLabel: 'Northstar Demo Checking', fictional: true }),
  Object.freeze({ id: 'demo-tx-004', date: '2026-08-14', merchant: 'Pine & Rail', category: 'Dining', type: 'expense', amountCents: 2418, accountLabel: 'Northstar Demo Checking', fictional: true }),
  Object.freeze({ id: 'demo-tx-003', date: '2026-08-11', merchant: 'Hearthlight Energy', category: 'Utilities', type: 'expense', amountCents: 9634, accountLabel: 'Northstar Demo Checking', fictional: true }),
  Object.freeze({ id: 'demo-tx-002', date: '2026-08-07', merchant: 'Fieldstone Wellness', category: 'Wellbeing', type: 'expense', amountCents: 7500, accountLabel: 'Northstar Demo Checking', fictional: true }),
  Object.freeze({ id: 'demo-tx-001', date: '2026-08-05', merchant: 'Sunward Studio Payroll', category: 'Income', type: 'income', amountCents: 320000, accountLabel: 'Northstar Demo Checking', fictional: true }),
]);
