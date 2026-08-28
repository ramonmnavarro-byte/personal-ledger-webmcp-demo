'use client';

import { useEffect, useMemo, useState } from 'react';
import { DEMO_PERIOD } from '../lib/ledger/fixtures';
import { createLedgerSession, getLedgerSummary, listDemoTransactions } from '../lib/ledger/service';
import { LEDGER_CATEGORIES, type DemoDraft, type LedgerCategory, type TransactionType } from '../lib/ledger/types';
import { registerLedgerTools } from '../lib/webmcp/register';

declare global {
  interface Document {
    modelContext?: unknown;
  }
}

const ledgerSession = createLedgerSession();
const currency = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });
const money = (cents: number) => currency.format(cents / 100);

export default function LedgerClient() {
  const summary = getLedgerSummary();
  const [category, setCategory] = useState<LedgerCategory | 'All'>('All');
  const [type, setType] = useState<TransactionType | 'All'>('All');
  const [draftPanelOpen, setDraftPanelOpen] = useState(false);
  const [drafts, setDrafts] = useState<ReadonlyArray<DemoDraft>>([]);
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [draftCategory, setDraftCategory] = useState<LedgerCategory>('Groceries');
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('Loading interactive demo.');

  useEffect(() => {
    const registration = registerLedgerTools(document.modelContext);
    const timer = window.setTimeout(() => {
      setReady(true);
      setStatus('Demo state ready.');
    }, 0);
    return () => {
      window.clearTimeout(timer);
      if (registration.status === 'registered') registration.controller.abort();
    };
  }, []);

  const transactions = useMemo(() => {
    const result = listDemoTransactions({
      category: category === 'All' ? undefined : category,
      type: type === 'All' ? undefined : type,
      limit: 8,
    });
    const visibleDrafts = drafts.filter((draft) => {
      if (category !== 'All' && draft.category !== category) return false;
      if (type !== 'All' && draft.type !== type) return false;
      return true;
    });
    return [...visibleDrafts, ...result.items].slice(0, 8);
  }, [category, drafts, type]);

  const createDraft = () => {
    try {
      const amountCents = Math.round(Number(amount) * 100);
      const draft = ledgerSession.createDemoEntry({
        type: 'expense',
        amountCents,
        category: draftCategory,
        merchant,
        date: '2026-08-27',
        note: 'Session only review draft',
      });
      setDrafts((current) => [draft, ...current]);
      setMerchant('');
      setAmount('');
      setStatus('Draft created. Session only; nothing was posted or exported.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Draft could not be created.');
    }
  };

  const clearDrafts = () => {
    ledgerSession.reset();
    setDrafts([]);
    setStatus('Draft state cleared.');
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f8f4] text-[#17211c]">
      <section className="border-b border-[#dbe1d8] bg-[#fcfdf9]">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 md:grid-cols-[minmax(0,1fr)_430px] md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#617064]">Fictional demo</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-normal">Personal Ledger</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#56645b]">
              Northstar Household uses invented records to show a person and a WebMCP agent working together:
              observe cash flow, understand categories, draft a correction, and prove the boundary. This is not
              financial advice and has no bank, payment, storage, analytics, or external connector.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Balance" value={money(summary.totalBalanceCents)} />
            <Metric label="Income" value={money(summary.incomeCents)} />
            <Metric label="Expense" value={money(summary.expenseCents)} />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-5 md:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)] md:px-8">
        <section className="space-y-5">
          <section className="grid gap-4 md:grid-cols-2">
            {summary.balances.map((account) => (
              <article key={account.label} className="rounded-lg border border-[#dbe1d8] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#617064]">{account.label}</p>
                <p className="mt-3 text-2xl font-semibold">{money(account.balanceCents)}</p>
              </article>
            ))}
          </section>

          <section className="rounded-lg border border-[#dbe1d8] bg-white p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Recent activity</h2>
                <p className="text-sm text-[#617064]">{DEMO_PERIOD.label}, fictional records only.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="grid gap-1 text-xs font-medium text-[#56645b]">
                  Category filter
                  <select className="h-10 rounded-md border border-[#c9d2c7] bg-white px-3 text-sm" value={category} disabled={!ready} onChange={(event) => setCategory(event.target.value as LedgerCategory | 'All')}>
                    <option>All</option>
                    {LEDGER_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-medium text-[#56645b]">
                  Type filter
                  <select className="h-10 rounded-md border border-[#c9d2c7] bg-white px-3 text-sm" value={type} disabled={!ready} onChange={(event) => setType(event.target.value as TransactionType | 'All')}>
                    <option>All</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table aria-label="Demo transactions" className="w-full text-left text-sm">
                <thead className="border-b border-[#dbe1d8] text-xs uppercase tracking-[0.1em] text-[#617064]">
                  <tr>
                    <th className="py-3 font-semibold">Date</th>
                    <th className="py-3 font-semibold">Merchant</th>
                    <th className="py-3 font-semibold">Category</th>
                    <th className="py-3 font-semibold">Type</th>
                    <th className="py-3 text-right font-semibold">Amount</th>
                    <th className="py-3 font-semibold">State</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((item) => (
                    <tr key={item.id} className="border-b border-[#edf0eb]">
                      <td className="py-3">{item.date}</td>
                      <td className="py-3 font-medium">{item.merchant}</td>
                      <td className="py-3">{item.category}</td>
                      <td className="py-3 capitalize">{item.type}</td>
                      <td className="py-3 text-right">{money(item.amountCents)}</td>
                      <td className="py-3">
                        <span className="rounded-md bg-[#e8eee8] px-2 py-1 text-xs font-medium capitalize">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-[#dbe1d8] bg-white p-4">
            <h2 className="text-xl font-semibold">Category plan</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {summary.categoryTotals.map((item) => (
                <article key={item.category} className="rounded-lg border border-[#edf0eb] p-3">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-medium">{item.category}</span>
                    <span>{money(item.spentCents)} used</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-[#e8eee8]">
                    <div className="h-2 rounded-full bg-[#426b5a]" style={{ width: `${Math.min(100, item.budgetCents ? (item.spentCents / item.budgetCents) * 100 : 0)}%` }} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-[#dbe1d8] bg-white p-4">
            <h2 className="text-xl font-semibold">Cash flow</h2>
            <dl className="mt-4 space-y-3">
              <Fact label="Net cash flow" value={money(summary.netCashFlowCents)} />
              <Fact label="Agent-readable tools" value="3 demo tools" />
              <Fact label="Data boundary" value="Fictional only" />
            </dl>
          </section>

          <section className="rounded-lg border border-[#dbe1d8] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Draft entry flow</h2>
              <button className="rounded-md border border-[#c9d2c7] px-3 py-2 text-sm" disabled={!ready} onClick={() => setDraftPanelOpen((open) => !open)}>
                Draft an entry
              </button>
            </div>
            {draftPanelOpen ? (
              <div className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm">
                  Merchant
                  <input className="h-10 rounded-md border border-[#c9d2c7] px-3" value={merchant} disabled={!ready} onChange={(event) => setMerchant(event.target.value)} placeholder="Harbor Market" />
                </label>
                <label className="grid gap-1 text-sm">
                  Amount
                  <input className="h-10 rounded-md border border-[#c9d2c7] px-3" inputMode="decimal" value={amount} disabled={!ready} onChange={(event) => setAmount(event.target.value)} placeholder="42.99" />
                </label>
                <label className="grid gap-1 text-sm">
                  Draft category
                  <select className="h-10 rounded-md border border-[#c9d2c7] bg-white px-3" value={draftCategory} disabled={!ready} onChange={(event) => setDraftCategory(event.target.value as LedgerCategory)}>
                    {LEDGER_CATEGORIES.filter((item) => item !== 'Income').map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <div className="flex gap-3">
                  <button className="rounded-md bg-[#20372d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={!ready} onClick={createDraft}>
                    Save demo draft
                  </button>
                  <button className="rounded-md border border-[#c9d2c7] px-4 py-3 text-sm disabled:opacity-60" disabled={!ready} onClick={clearDrafts}>
                    Clear drafts
                  </button>
                </div>
              </div>
            ) : null}
            <p role="status" className="mt-4 min-h-6 text-sm text-[#56645b]">{status}</p>
          </section>
        </aside>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#dbe1d8] bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#617064]">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#edf0eb] pb-3 text-sm">
      <dt className="text-[#617064]">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
