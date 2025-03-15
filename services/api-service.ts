/**
 * API service for handling ledger and transaction data
 */

// Types
export interface Ledger {
  id: string;
  name: string;
  metalBalance: number;
  cashBalance: number;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  ledgerId: string;
  type: "sale" | "purchase" | "metal_received" | "metal_given" | "cash_received" | "cash_given";
  amount?: number;
  weight?: number;
  purity?: number;
  timestamp: string;
}

// Configuration for API base URL
const API_BASE_URL =  'http://localhost:8080'; // Set your main server URL here

// Cache for ledger data
const ledgerCache = new Map<string, { data: Ledger; timestamp: number }>();
const CACHE_TTL =0; // 5 minutes

/**
 * Fetches all ledgers
 */
export async function getLedgers(debouncedSearchValue?: string): Promise<Ledger[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ledgers`);
    if (!response.ok) {
      throw new Error(`Error fetching ledgers: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching ledgers:", error);
    throw new Error("Failed to fetch ledgers");
  }
}

/**
 * Fetches a ledger by ID
 */
export async function getLedger(id: string): Promise<Ledger> {
  // Check cache first
  const cachedLedger = ledgerCache.get(id);
  if (cachedLedger && Date.now() - cachedLedger.timestamp < CACHE_TTL) {
    return cachedLedger.data;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/ledgers/${id}`);
    if (!response.ok) {
      throw new Error(`Error fetching ledger ${id}: ${response.statusText}`);
    }
    const data = await response.json();

    // Cache the result
    ledgerCache.set(id, { data, timestamp: Date.now() });

    return data;
  } catch (error) {
    console.error(`Error fetching ledger ${id}:`, error);
    throw new Error("Failed to fetch ledger");
  }
}

/**
 * Searches for ledgers by name
 */
export async function searchLedgers(query: string): Promise<Ledger[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ledgers/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`Error searching ledgers: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error searching ledgers:", error);
    throw new Error("Failed to search ledgers");
  }
}

/**
 * Creates a new ledger
 */
export async function createLedger(name: string): Promise<Ledger> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ledgers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      throw new Error(`Error creating ledger: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating ledger:", error);
    throw new Error("Failed to create ledger");
  }
}

/**
 * Fetches transactions for a ledger
 */
export async function getLedgerTransactions(ledgerId: string): Promise<Transaction[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ledgers/${ledgerId}/transactions`);
    if (!response.ok) {
      throw new Error(`Error fetching transactions for ledger ${ledgerId}: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching transactions for ledger ${ledgerId}:`, error);
    throw new Error("Failed to fetch transactions");
  }
}

/**
 * Creates a new transaction
 */
export async function createTransaction(transaction: Omit<Transaction, "id" | "timestamp">): Promise<Transaction> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ledgers/${transaction.ledgerId}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
    if (!response.ok) {
      throw new Error(`Error creating transaction: ${response.statusText}`);
    }
    const data = await response.json();

    // Invalidate the ledger cache
    ledgerCache.delete(transaction.ledgerId);

    return data;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw new Error("Failed to create transaction");
  }
}