import { describe, expect, it, vi } from 'vitest';

import { registerLedgerTools, type WebMcpTool } from '../../lib/webmcp/register';

describe('WebMCP registration', () => {
  it('registers only the three least-privilege demo tools', () => {
    const registerTool = vi.fn();

    const registration = registerLedgerTools({ registerTool });

    expect(registration.status).toBe('registered');
    expect(registerTool).toHaveBeenCalledTimes(3);
    expect(registerTool.mock.calls.map(([tool]) => tool.name)).toEqual([
      'get_ledger_summary',
      'list_demo_transactions',
      'create_demo_entry',
    ]);
    expect(registerTool.mock.calls[0][0].annotations.readOnlyHint).toBe(true);
    expect(registerTool.mock.calls[2][0].annotations.readOnlyHint).toBe(false);
    expect(registerTool.mock.calls[2][0].annotations.openWorldHint).toBe(false);
  });

  it('returns a safe unsupported state when WebMCP is unavailable', () => {
    expect(registerLedgerTools(undefined)).toEqual({ status: 'unsupported' });
  });

  it('tool handlers reject forbidden actions and reset with a new session', async () => {
    const registered = new Map<string, (input: unknown) => unknown>();
    const registerTool = vi.fn((tool: WebMcpTool) => {
      registered.set(tool.name, tool.execute);
    });

    registerLedgerTools({ registerTool });
    const create = registered.get('create_demo_entry');

    expect(() =>
      create?.({
        type: 'expense',
        amountCents: 1200,
        category: 'Home',
        merchant: 'Juniper Home Supply',
        date: '2026-08-27',
        email: 'send@external.invalid',
      }),
    ).toThrow(/unexpected field/i);

    const secondRegistration = new Map<string, (input: unknown) => unknown>();
    registerLedgerTools({
      registerTool: (tool: WebMcpTool) => secondRegistration.set(tool.name, tool.execute),
    });
    const summary = secondRegistration.get('get_ledger_summary')?.({});
    expect(summary).not.toHaveProperty('drafts');
  });
});
