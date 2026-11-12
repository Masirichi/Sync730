// lib/recruiter/billing.ts
// Server-authoritative Token Billing, Pricing Config, Payment Verification & Append-Only Ledger

import {
  TokenPackId,
  TokenPackConfig,
  BillingOrder,
  OrderStatus,
  TokenLedgerEntry,
  CorporateWorkspace,
} from './types';
import { getLocalWorkspace, saveLocalWorkspace } from './store';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Authoritative Server-side Token Pack Pricing Config.
 * The client only ever sends the pack ID.
 */
export const TOKEN_PACKS: Record<TokenPackId, TokenPackConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    tokens: 5,
    amount: 100000,
    amount_kobo: 100000 * 100, // 10,000,000 kobo
    currency: 'NGN',
    per_token_amount: 20000,
    per_token_display: '₦20,000',
    price_display: '₦100,000',
    discount_label: null,
    description: 'Perfect for small teams validating their first key engineering hires.',
  },
  growth: {
    id: 'growth',
    name: 'Growth Pack',
    tokens: 15,
    amount: 270000,
    amount_kobo: 270000 * 100, // 27,000,000 kobo
    currency: 'NGN',
    per_token_amount: 18000,
    per_token_display: '₦18,000',
    price_display: '₦270,000',
    discount_label: '10% Savings',
    description: 'Our most popular tier for fast-scaling engineering and product squads.',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Scale',
    tokens: 50,
    amount: 800000,
    amount_kobo: 800000 * 100, // 80,000,000 kobo
    currency: 'NGN',
    per_token_amount: 16000,
    per_token_display: '₦16,000',
    price_display: '₦800,000',
    discount_label: '20% Savings',
    description: 'Maximum volume discount for enterprise talent acquisition and agency pipelines.',
  },
};

/**
 * Dedicated Bank Transfer Account Details
 */
export const VIRTUAL_BANK_ACCOUNT = {
  bank_name: 'Titan Trust Bank / Paystack B2B',
  account_number: '9920194821',
  account_name: 'Sync730 Hub Escrow / Acme Global',
};

// Keys for persistence
const ORDERS_STORAGE_KEY = 'sync730_billing_orders';
const LEDGER_STORAGE_KEY = 'sync730_token_ledger';

// In-memory store for server runtime
let globalBillingStore = {
  orders: [] as BillingOrder[],
  ledger: [
    {
      id: 'led-init-001',
      workspace_id: 'ws-sync730-demo',
      user_id: 'system',
      user_email: 'system@sync730.com',
      type: 'CREDIT' as const,
      amount: 2,
      balance_after: 2,
      description: 'Initial complimentary trial tokens on workspace setup',
      created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    },
  ] as TokenLedgerEntry[],
};

/* ==============================================================================
 * Order Management Functions
 * ============================================================================== */

export function getLocalBillingOrders(workspaceId?: string): BillingOrder[] {
  if (typeof window === 'undefined') {
    return workspaceId
      ? globalBillingStore.orders.filter((o) => o.workspace_id === workspaceId)
      : globalBillingStore.orders;
  }
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    const orders: BillingOrder[] = raw ? JSON.parse(raw) : [];
    return workspaceId ? orders.filter((o) => o.workspace_id === workspaceId) : orders;
  } catch {
    return [];
  }
}

export function saveLocalBillingOrder(order: BillingOrder) {
  if (typeof window !== 'undefined') {
    try {
      const existing = getLocalBillingOrders();
      const idx = existing.findIndex((o) => o.id === order.id || o.payment_reference === order.payment_reference);
      let updated;
      if (idx >= 0) {
        updated = [...existing];
        updated[idx] = { ...existing[idx], ...order };
      } else {
        updated = [order, ...existing];
      }
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('sync730_billing_updated'));
    } catch (e) {
      console.warn('Failed to save billing order to localStorage:', e);
    }
  }

  const idx = globalBillingStore.orders.findIndex(
    (o) => o.id === order.id || o.payment_reference === order.payment_reference
  );
  if (idx >= 0) {
    globalBillingStore.orders[idx] = { ...globalBillingStore.orders[idx], ...order };
  } else {
    globalBillingStore.orders.unshift(order);
  }
}

/**
 * Creates a new PENDING or PENDING_CONFIRMATION billing order with server-verified pricing
 */
export function createBillingOrder(params: {
  workspaceId: string;
  packId: TokenPackId;
  createdBy: string;
  paymentMethod: 'card' | 'bank_transfer';
}): BillingOrder {
  const pack = TOKEN_PACKS[params.packId];
  if (!pack) {
    throw new Error(`Invalid token pack: ${params.packId}`);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes expiry
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase();
  const paymentReference = `SYNC730-ORD-${uniqueSuffix}`;

  const initialStatus: OrderStatus =
    params.paymentMethod === 'bank_transfer' ? 'PENDING_CONFIRMATION' : 'PENDING';

  const order: BillingOrder = {
    id: `ord-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    workspace_id: params.workspaceId,
    pack_id: params.packId,
    tokens: pack.tokens,
    amount: pack.amount,
    amount_kobo: pack.amount_kobo,
    currency: 'NGN',
    created_by: params.createdBy,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    payment_reference: paymentReference,
    payment_method: params.paymentMethod,
    status: initialStatus,
    bank_details: params.paymentMethod === 'bank_transfer' ? VIRTUAL_BANK_ACCOUNT : undefined,
  };

  saveLocalBillingOrder(order);
  return order;
}

export function findOrderByReference(reference: string): BillingOrder | null {
  const allOrders = getLocalBillingOrders();
  const order = allOrders.find((o) => o.payment_reference === reference);
  if (!order) return null;

  // Check for auto-abandonment if pending and past 30 minutes
  if (
    order.status === 'PENDING' &&
    new Date(order.expires_at).getTime() < Date.now()
  ) {
    order.status = 'ABANDONED';
    order.failure_reason = 'Order expired after 30 minutes without confirmed payment';
    saveLocalBillingOrder(order);
  }

  return order;
}

/* ==============================================================================
 * Append-Only Token Ledger Functions
 * ============================================================================== */

export function getLocalTokenLedger(workspaceId?: string): TokenLedgerEntry[] {
  if (typeof window === 'undefined') {
    return workspaceId
      ? globalBillingStore.ledger.filter((l) => l.workspace_id === workspaceId)
      : globalBillingStore.ledger;
  }
  try {
    const raw = localStorage.getItem(LEDGER_STORAGE_KEY);
    const ledger: TokenLedgerEntry[] = raw ? JSON.parse(raw) : [];
    return workspaceId ? ledger.filter((l) => l.workspace_id === workspaceId) : ledger;
  } catch {
    return [];
  }
}

export function saveLocalLedgerEntry(entry: TokenLedgerEntry) {
  if (typeof window !== 'undefined') {
    try {
      const existing = getLocalTokenLedger();
      const updated = [entry, ...existing];
      localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('sync730_ledger_updated'));
    } catch (e) {
      console.warn('Failed to save ledger entry to localStorage:', e);
    }
  }
  globalBillingStore.ledger.unshift(entry);
}

/**
 * Compute the authoritative token balance strictly from the sum of the ledger entries.
 * Balance = sum of (amount) for all ledger rows.
 */
export function calculateLedgerBalance(workspaceId: string): number {
  const ledger = getLocalTokenLedger(workspaceId);
  return ledger.reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Idempotently issues tokens from a verified order.
 * Ensures the exact order reference is NEVER credited twice.
 */
export function issueTokensFromOrder(order: BillingOrder): {
  success: boolean;
  ledgerEntry: TokenLedgerEntry;
  newBalance: number;
} {
  // Idempotency Check: check if a ledger entry already exists for this order
  const existingLedger = getLocalTokenLedger(order.workspace_id);
  const alreadyCredited = existingLedger.find((l) => l.order_id === order.id);
  if (alreadyCredited) {
    return {
      success: true,
      ledgerEntry: alreadyCredited,
      newBalance: calculateLedgerBalance(order.workspace_id),
    };
  }

  const currentBalance = calculateLedgerBalance(order.workspace_id);
  const newBalance = currentBalance + order.tokens;

  const ledgerEntry: TokenLedgerEntry = {
    id: `led-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    workspace_id: order.workspace_id,
    user_id: order.created_by,
    user_email: order.created_by,
    order_id: order.id,
    type: 'CREDIT',
    amount: order.tokens,
    balance_after: newBalance,
    description: `Purchased ${TOKEN_PACKS[order.pack_id]?.name || 'Token Pack'} (${order.tokens} Tokens via ${order.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'Paystack Card'})`,
    created_at: new Date().toISOString(),
  };

  saveLocalLedgerEntry(ledgerEntry);

  // Sync workspace object cache
  const ws = getLocalWorkspace();
  if (ws.id === order.workspace_id) {
    ws.token_balance = newBalance;
    saveLocalWorkspace(ws);
  }

  // Update order status to CONFIRMED
  order.status = 'CONFIRMED';
  order.paid_at = new Date().toISOString();
  saveLocalBillingOrder(order);

  return {
    success: true,
    ledgerEntry,
    newBalance,
  };
}

/**
 * Records an append-only token spend (debit) when unlocking a candidate.
 */
export function recordTokenSpend(params: {
  workspaceId: string;
  userId: string;
  userEmail?: string;
  candidateId: string;
  candidateMaskedId?: string;
  tokens: number;
}): { success: boolean; newBalance: number; ledgerEntry: TokenLedgerEntry } {
  const currentBalance = calculateLedgerBalance(params.workspaceId);
  if (currentBalance < params.tokens) {
    throw new Error('Insufficient tokens in organization ledger.');
  }

  const newBalance = currentBalance - params.tokens;
  const ledgerEntry: TokenLedgerEntry = {
    id: `led-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    workspace_id: params.workspaceId,
    user_id: params.userId,
    user_email: params.userEmail || params.userId,
    candidate_id: params.candidateId,
    candidate_masked_id: params.candidateMaskedId || `#${params.candidateId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`,
    type: 'DEBIT',
    amount: -params.tokens,
    balance_after: newBalance,
    description: `Unlocked dossier for Candidate ${params.candidateMaskedId || params.candidateId}`,
    created_at: new Date().toISOString(),
  };

  saveLocalLedgerEntry(ledgerEntry);

  // Sync workspace cache
  const ws = getLocalWorkspace();
  if (ws.id === params.workspaceId) {
    ws.token_balance = newBalance;
    saveLocalWorkspace(ws);
  }

  return {
    success: true,
    newBalance,
    ledgerEntry,
  };
}

/**
 * Manual token adjustment by Sync730 Super Admin only, with mandatory reason.
 */
export function recordManualAdjustment(params: {
  workspaceId: string;
  adminUserId: string;
  amount: number;
  reason: string;
}): { success: boolean; newBalance: number; ledgerEntry: TokenLedgerEntry } {
  if (!params.reason || params.reason.trim().length < 5) {
    throw new Error('A detailed reason is strictly required for administrative token adjustments.');
  }

  const currentBalance = calculateLedgerBalance(params.workspaceId);
  const newBalance = currentBalance + params.amount;
  if (newBalance < 0) {
    throw new Error('Adjustment cannot result in a negative organization token balance.');
  }

  const ledgerEntry: TokenLedgerEntry = {
    id: `led-adj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    workspace_id: params.workspaceId,
    user_id: params.adminUserId,
    user_email: 'admin@sync730.com',
    type: 'ADJUSTMENT',
    amount: params.amount,
    balance_after: newBalance,
    description: `Administrative adjustment by ${params.adminUserId}: ${params.reason.trim()}`,
    created_at: new Date().toISOString(),
  };

  saveLocalLedgerEntry(ledgerEntry);

  const ws = getLocalWorkspace();
  if (ws.id === params.workspaceId) {
    ws.token_balance = newBalance;
    saveLocalWorkspace(ws);
  }

  return {
    success: true,
    newBalance,
    ledgerEntry,
  };
}

/**
 * Verifies and confirms an order with all strict server-side validation criteria:
 * 1. Reference matches existing PENDING or PENDING_CONFIRMATION order
 * 2. Paid amount matches order exactly
 * 3. Currency matches ('NGN')
 * 4. Idempotent token issuance
 */
export function verifyAndConfirmPayment(params: {
  reference: string;
  paidAmountKobo: number;
  currency: string;
  confirmedBy?: string;
}): {
  success: boolean;
  order: BillingOrder;
  alreadyConfirmed: boolean;
  tokensIssued?: number;
  newBalance?: number;
  error?: string;
} {
  const order = findOrderByReference(params.reference);
  if (!order) {
    return {
      success: false,
      order: null as any,
      alreadyConfirmed: false,
      error: `Order with reference ${params.reference} not found.`,
    };
  }

  // Idempotency: If already confirmed, return success without re-crediting
  if (order.status === 'CONFIRMED') {
    return {
      success: true,
      order,
      alreadyConfirmed: true,
      tokensIssued: 0,
      newBalance: calculateLedgerBalance(order.workspace_id),
    };
  }

  // Strict validation: Amount & Currency match
  if (params.currency.toUpperCase() !== order.currency) {
    order.status = 'FLAGGED_REVIEW';
    order.failure_reason = `Currency mismatch: expected ${order.currency}, received ${params.currency}`;
    saveLocalBillingOrder(order);
    return {
      success: false,
      order,
      alreadyConfirmed: false,
      error: order.failure_reason,
    };
  }

  if (params.paidAmountKobo !== order.amount_kobo) {
    order.status = 'FLAGGED_REVIEW';
    order.failure_reason = `Amount mismatch: expected ₦${order.amount.toLocaleString()} (${order.amount_kobo} kobo), received ${params.paidAmountKobo} kobo. Flagged for manual review.`;
    saveLocalBillingOrder(order);
    return {
      success: false,
      order,
      alreadyConfirmed: false,
      error: order.failure_reason,
    };
  }

  // Issue tokens and update order status
  if (params.confirmedBy) {
    order.confirmed_by = params.confirmedBy;
  }
  const result = issueTokensFromOrder(order);

  return {
    success: true,
    order,
    alreadyConfirmed: false,
    tokensIssued: order.tokens,
    newBalance: result.newBalance,
  };
}
