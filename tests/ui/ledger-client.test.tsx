import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import LedgerClient from '../../app/ledger-client';

describe('Personal Ledger UI', () => {
  it('shows the fictional boundary, summary, transactions, and budgets', () => {
    render(<LedgerClient />);

    expect(screen.getByText(/fictional demo/i)).toBeInTheDocument();
    expect(screen.getByText(/not financial advice/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /cash flow/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /recent activity/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /category plan/i })).toBeInTheDocument();
  });

  it('filters the transaction list by category', async () => {
    const user = userEvent.setup();
    render(<LedgerClient />);
    await screen.findByText('Demo state ready.');

    await user.selectOptions(screen.getByLabelText(/category filter/i), 'Groceries');

    const table = screen.getByRole('table', { name: /demo transactions/i });
    expect(within(table).getAllByText('Groceries').length).toBeGreaterThan(0);
    expect(within(table).queryByText('Pine & Rail')).not.toBeInTheDocument();
  });

  it('creates and clears a local draft without implying a posted transaction', async () => {
    const user = userEvent.setup();
    render(<LedgerClient />);

    await user.click(screen.getByRole('button', { name: /draft an entry/i }));
    await user.type(screen.getByLabelText(/merchant/i), 'Juniper Home Supply');
    await user.type(screen.getByLabelText(/amount/i), '42.99');
    await user.selectOptions(screen.getByLabelText(/draft category/i), 'Home');
    await user.click(screen.getByRole('button', { name: /save demo draft/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/draft created/i);
    expect(screen.getByText(/session only/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear drafts/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/state cleared/i);
    expect(within(screen.getByRole('table', { name: /demo transactions/i })).queryByText(/^draft$/i)).not.toBeInTheDocument();
  });
});
