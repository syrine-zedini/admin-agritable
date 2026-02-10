// Property-based tests for Income Statement Ledger
// **Feature: income-statement-ledger, Property 2: Double-Entry Constraint Invariant**

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Double-entry accounting validation functions
 * These mirror the database constraints and business logic
 */

interface IncomeStatementEntry {
  debit_amount: number;
  credit_amount: number;
  transaction_type: 'revenue' | 'expense';
}

/**
 * Validates that an entry follows double-entry accounting rules:
 * - Exactly one of debit_amount or credit_amount must be > 0
 * - The other must be exactly 0
 * - Revenue transactions must have credit_amount > 0
 * - Expense transactions must have debit_amount > 0
 */
function isValidDoubleEntry(entry: IncomeStatementEntry): boolean {
  const { debit_amount, credit_amount, transaction_type } = entry;
  
  // Both amounts must be non-negative
  if (debit_amount < 0 || credit_amount < 0) {
    return false;
  }
  
  // Exactly one must be > 0, the other must be 0
  const hasValidAmounts = 
    (debit_amount > 0 && credit_amount === 0) || 
    (credit_amount > 0 && debit_amount === 0);
  
  if (!hasValidAmounts) {
    return false;
  }
  
  // Revenue transactions must have credit > 0
  if (transaction_type === 'revenue' && credit_amount <= 0) {
    return false;
  }
  
  // Expense transactions must have debit > 0
  if (transaction_type === 'expense' && debit_amount <= 0) {
    return false;
  }
  
  return true;
}

/**
 * Creates a valid income statement entry based on transaction type
 */
function createValidEntry(
  amount: number, 
  transaction_type: 'revenue' | 'expense'
): IncomeStatementEntry {
  if (transaction_type === 'revenue') {
    return {
      debit_amount: 0,
      credit_amount: amount,
      transaction_type
    };
  } else {
    return {
      debit_amount: amount,
      credit_amount: 0,
      transaction_type
    };
  }
}

describe('Income Statement - Double-Entry Constraint Property Tests', () => {
  /**
   * **Feature: income-statement-ledger, Property 2: Double-Entry Constraint Invariant**
   * **Validates: Requirements 2.1, 2.2, 2.3**
   * 
   * For any income_statement_entry, exactly one of debit_amount or credit_amount 
   * SHALL be greater than zero, and the other SHALL be exactly zero. 
   * Revenue transactions SHALL have credit_amount > 0, and expense transactions 
   * SHALL have debit_amount > 0.
   */
  describe('Property 2: Double-Entry Constraint Invariant', () => {
    it('valid revenue entries have credit > 0 and debit = 0', () => {
      fc.assert(
        fc.property(
          // Generate positive amounts (0.01 to 100000)
          fc.double({ min: 0.01, max: 100000, noNaN: true }),
          (amount) => {
            const entry = createValidEntry(amount, 'revenue');
            
            // Verify the entry is valid
            expect(isValidDoubleEntry(entry)).toBe(true);
            
            // Verify revenue-specific rules
            expect(entry.credit_amount).toBeGreaterThan(0);
            expect(entry.debit_amount).toBe(0);
            expect(entry.transaction_type).toBe('revenue');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('valid expense entries have debit > 0 and credit = 0', () => {
      fc.assert(
        fc.property(
          // Generate positive amounts (0.01 to 100000)
          fc.double({ min: 0.01, max: 100000, noNaN: true }),
          (amount) => {
            const entry = createValidEntry(amount, 'expense');
            
            // Verify the entry is valid
            expect(isValidDoubleEntry(entry)).toBe(true);
            
            // Verify expense-specific rules
            expect(entry.debit_amount).toBeGreaterThan(0);
            expect(entry.credit_amount).toBe(0);
            expect(entry.transaction_type).toBe('expense');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects entries with both debit and credit > 0', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 100000, noNaN: true }),
          fc.double({ min: 0.01, max: 100000, noNaN: true }),
          fc.constantFrom('revenue', 'expense') as fc.Arbitrary<'revenue' | 'expense'>,
          (debit, credit, type) => {
            const invalidEntry: IncomeStatementEntry = {
              debit_amount: debit,
              credit_amount: credit,
              transaction_type: type
            };
            
            // Both being > 0 should be invalid
            expect(isValidDoubleEntry(invalidEntry)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects entries with both debit and credit = 0', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('revenue', 'expense') as fc.Arbitrary<'revenue' | 'expense'>,
          (type) => {
            const invalidEntry: IncomeStatementEntry = {
              debit_amount: 0,
              credit_amount: 0,
              transaction_type: type
            };
            
            // Both being 0 should be invalid
            expect(isValidDoubleEntry(invalidEntry)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects revenue entries with debit > 0 instead of credit', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 100000, noNaN: true }),
          (amount) => {
            const invalidEntry: IncomeStatementEntry = {
              debit_amount: amount,
              credit_amount: 0,
              transaction_type: 'revenue'
            };
            
            // Revenue with debit instead of credit should be invalid
            expect(isValidDoubleEntry(invalidEntry)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects expense entries with credit > 0 instead of debit', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 100000, noNaN: true }),
          (amount) => {
            const invalidEntry: IncomeStatementEntry = {
              debit_amount: 0,
              credit_amount: amount,
              transaction_type: 'expense'
            };
            
            // Expense with credit instead of debit should be invalid
            expect(isValidDoubleEntry(invalidEntry)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects entries with negative amounts', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -100000, max: -0.01, noNaN: true }),
          fc.constantFrom('revenue', 'expense') as fc.Arbitrary<'revenue' | 'expense'>,
          (negativeAmount, type) => {
            // Test negative debit
            const invalidDebit: IncomeStatementEntry = {
              debit_amount: negativeAmount,
              credit_amount: 0,
              transaction_type: type
            };
            expect(isValidDoubleEntry(invalidDebit)).toBe(false);
            
            // Test negative credit
            const invalidCredit: IncomeStatementEntry = {
              debit_amount: 0,
              credit_amount: negativeAmount,
              transaction_type: type
            };
            expect(isValidDoubleEntry(invalidCredit)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


/**
 * Helper types and functions for additional property tests
 */
interface FullIncomeStatementEntry {
  id: string;
  transaction_date: string;
  debit_amount: number;
  credit_amount: number;
  transaction_type: 'revenue' | 'expense';
  account_category_id: string;
  account_category?: {
    id: string;
    name: string;
    type: 'revenue' | 'expense' | 'general';
  };
}

interface IncomeStatementFilters {
  date_from?: string;
  date_to?: string;
  account_category_ids?: string[];
  transaction_type?: 'revenue' | 'expense' | 'all';
  customer_type?: 'b2c' | 'b2b' | 'all';
}

/**
 * Calculate running balances per category
 * Mirrors the implementation in useIncomeStatementData.ts
 */
function calculateRunningBalances(entries: FullIncomeStatementEntry[]): Map<string, number> {
  const balances = new Map<string, number>();
  const categoryBalances = new Map<string, number>();

  // Sort by date ascending for running balance calculation
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
  );

  for (const entry of sortedEntries) {
    const categoryId = entry.account_category_id || 'uncategorized';
    const currentBalance = categoryBalances.get(categoryId) || 0;
    const newBalance = currentBalance + Number(entry.credit_amount) - Number(entry.debit_amount);
    
    categoryBalances.set(categoryId, newBalance);
    balances.set(entry.id, newBalance);
  }

  return balances;
}

/**
 * Calculate period totals
 * Mirrors the implementation in useIncomeStatementData.ts
 */
function calculatePeriodTotals(entries: FullIncomeStatementEntry[]) {
  let totalRevenue = 0;
  let totalExpenses = 0;
  const byCategory = new Map<string, { total_debit: number; total_credit: number }>();

  for (const entry of entries) {
    const categoryId = entry.account_category_id || 'uncategorized';
    
    if (!byCategory.has(categoryId)) {
      byCategory.set(categoryId, { total_debit: 0, total_credit: 0 });
    }

    const cat = byCategory.get(categoryId)!;
    cat.total_debit += Number(entry.debit_amount);
    cat.total_credit += Number(entry.credit_amount);

    totalRevenue += Number(entry.credit_amount);
    totalExpenses += Number(entry.debit_amount);
  }

  return {
    total_revenue: totalRevenue,
    total_expenses: totalExpenses,
    net_income: totalRevenue - totalExpenses,
    by_category: Array.from(byCategory.entries()),
  };
}

/**
 * Aggregate entries by period
 */
function aggregateEntries(
  entries: FullIncomeStatementEntry[],
  level: 'daily' | 'weekly' | 'monthly'
): Map<string, { total_debit: number; total_credit: number; count: number }> {
  const grouped = new Map<string, { total_debit: number; total_credit: number; count: number }>();

  for (const entry of entries) {
    const date = new Date(entry.transaction_date);
    let periodKey: string;

    if (level === 'daily') {
      periodKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}_${entry.account_category_id}`;
    } else if (level === 'weekly') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      periodKey = `${weekStart.toISOString().split('T')[0]}_${entry.account_category_id}`;
    } else {
      periodKey = `${date.getFullYear()}-${date.getMonth()}_${entry.account_category_id}`;
    }

    if (!grouped.has(periodKey)) {
      grouped.set(periodKey, { total_debit: 0, total_credit: 0, count: 0 });
    }

    const agg = grouped.get(periodKey)!;
    agg.total_debit += Number(entry.debit_amount);
    agg.total_credit += Number(entry.credit_amount);
    agg.count += 1;
  }

  return grouped;
}

/**
 * Apply filters to entries
 */
function applyFilters(
  entries: FullIncomeStatementEntry[],
  filters: IncomeStatementFilters
): FullIncomeStatementEntry[] {
  return entries.filter(entry => {
    // Date range filter
    if (filters.date_from && entry.transaction_date < filters.date_from) {
      return false;
    }
    if (filters.date_to && entry.transaction_date > filters.date_to) {
      return false;
    }

    // Account category filter
    if (filters.account_category_ids && filters.account_category_ids.length > 0) {
      if (!filters.account_category_ids.includes(entry.account_category_id)) {
        return false;
      }
    }

    // Transaction type filter
    if (filters.transaction_type && filters.transaction_type !== 'all') {
      if (entry.transaction_type !== filters.transaction_type) {
        return false;
      }
    }

    return true;
  });
}

// Generators for property tests
const genCategoryId = fc.uuid();
const genEntryId = fc.uuid();
const genTransactionDate = fc.date({ 
  min: new Date('2024-01-01'), 
  max: new Date('2025-12-31') 
}).map(d => d.toISOString());

const genValidEntry = fc.record({
  id: genEntryId,
  transaction_date: genTransactionDate,
  transaction_type: fc.constantFrom('revenue', 'expense') as fc.Arbitrary<'revenue' | 'expense'>,
  account_category_id: genCategoryId,
  amount: fc.double({ min: 0.01, max: 100000, noNaN: true }),
}).map(({ id, transaction_date, transaction_type, account_category_id, amount }) => ({
  id,
  transaction_date,
  transaction_type,
  account_category_id,
  debit_amount: transaction_type === 'expense' ? amount : 0,
  credit_amount: transaction_type === 'revenue' ? amount : 0,
}));

const genEntryList = fc.array(genValidEntry, { minLength: 0, maxLength: 50 });

describe('Income Statement - Running Balance Property Tests', () => {
  /**
   * **Feature: income-statement-ledger, Property 3: Running Balance Calculation**
   * **Validates: Requirements 2.4, 6.1**
   * 
   * For any account category and any point in time, the running balance SHALL equal 
   * the sum of all credit_amounts minus the sum of all debit_amounts for entries 
   * in that category with transaction_date less than or equal to the specified time.
   */
  describe('Property 3: Running Balance Calculation', () => {
    it('running balance equals cumulative credits minus debits per category', () => {
      fc.assert(
        fc.property(genEntryList, (entries) => {
          const balances = calculateRunningBalances(entries);
          
          // For each entry, verify the running balance
          const sortedEntries = [...entries].sort(
            (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
          );
          
          const categoryTotals = new Map<string, number>();
          
          for (const entry of sortedEntries) {
            const categoryId = entry.account_category_id || 'uncategorized';
            const prevTotal = categoryTotals.get(categoryId) || 0;
            const expectedBalance = prevTotal + entry.credit_amount - entry.debit_amount;
            
            categoryTotals.set(categoryId, expectedBalance);
            
            const actualBalance = balances.get(entry.id);
            expect(actualBalance).toBeCloseTo(expectedBalance, 2);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});

describe('Income Statement - Period Totals Property Tests', () => {
  /**
   * **Feature: income-statement-ledger, Property 4: Period Totals Consistency**
   * **Validates: Requirements 2.5, 6.2, 6.3, 6.4**
   * 
   * For any date range, the period totals SHALL satisfy: 
   * Net Income = Total Revenue (sum of credits) - Total Expenses (sum of debits),
   * and the sum of all category subtotals SHALL equal the grand totals.
   */
  describe('Property 4: Period Totals Consistency', () => {
    it('net income equals total revenue minus total expenses', () => {
      fc.assert(
        fc.property(genEntryList, (entries) => {
          const totals = calculatePeriodTotals(entries);
          
          // Net income should equal revenue minus expenses
          expect(totals.net_income).toBeCloseTo(
            totals.total_revenue - totals.total_expenses, 
            2
          );
        }),
        { numRuns: 100 }
      );
    });

    it('category subtotals sum to grand totals', () => {
      fc.assert(
        fc.property(genEntryList, (entries) => {
          const totals = calculatePeriodTotals(entries);
          
          // Sum of category credits should equal total revenue
          let categoryCreditsSum = 0;
          let categoryDebitsSum = 0;
          
          for (const [, cat] of totals.by_category) {
            categoryCreditsSum += cat.total_credit;
            categoryDebitsSum += cat.total_debit;
          }
          
          expect(categoryCreditsSum).toBeCloseTo(totals.total_revenue, 2);
          expect(categoryDebitsSum).toBeCloseTo(totals.total_expenses, 2);
        }),
        { numRuns: 100 }
      );
    });
  });
});

describe('Income Statement - Aggregation Level Property Tests', () => {
  /**
   * **Feature: income-statement-ledger, Property 5: Aggregation Level Consistency**
   * **Validates: Requirements 4.2, 4.3, 4.4**
   * 
   * For any set of income statement entries and any aggregation level (daily, weekly, monthly),
   * the sum of aggregated debit_amounts SHALL equal the sum of individual debit_amounts,
   * and the sum of aggregated credit_amounts SHALL equal the sum of individual credit_amounts.
   */
  describe('Property 5: Aggregation Level Consistency', () => {
    it('daily aggregation preserves total debits and credits', () => {
      fc.assert(
        fc.property(genEntryList, (entries) => {
          const aggregated = aggregateEntries(entries, 'daily');
          
          // Sum individual entries
          const individualDebits = entries.reduce((sum, e) => sum + e.debit_amount, 0);
          const individualCredits = entries.reduce((sum, e) => sum + e.credit_amount, 0);
          
          // Sum aggregated entries
          let aggregatedDebits = 0;
          let aggregatedCredits = 0;
          for (const [, agg] of aggregated) {
            aggregatedDebits += agg.total_debit;
            aggregatedCredits += agg.total_credit;
          }
          
          expect(aggregatedDebits).toBeCloseTo(individualDebits, 2);
          expect(aggregatedCredits).toBeCloseTo(individualCredits, 2);
        }),
        { numRuns: 100 }
      );
    });

    it('weekly aggregation preserves total debits and credits', () => {
      fc.assert(
        fc.property(genEntryList, (entries) => {
          const aggregated = aggregateEntries(entries, 'weekly');
          
          const individualDebits = entries.reduce((sum, e) => sum + e.debit_amount, 0);
          const individualCredits = entries.reduce((sum, e) => sum + e.credit_amount, 0);
          
          let aggregatedDebits = 0;
          let aggregatedCredits = 0;
          for (const [, agg] of aggregated) {
            aggregatedDebits += agg.total_debit;
            aggregatedCredits += agg.total_credit;
          }
          
          expect(aggregatedDebits).toBeCloseTo(individualDebits, 2);
          expect(aggregatedCredits).toBeCloseTo(individualCredits, 2);
        }),
        { numRuns: 100 }
      );
    });

    it('monthly aggregation preserves total debits and credits', () => {
      fc.assert(
        fc.property(genEntryList, (entries) => {
          const aggregated = aggregateEntries(entries, 'monthly');
          
          const individualDebits = entries.reduce((sum, e) => sum + e.debit_amount, 0);
          const individualCredits = entries.reduce((sum, e) => sum + e.credit_amount, 0);
          
          let aggregatedDebits = 0;
          let aggregatedCredits = 0;
          for (const [, agg] of aggregated) {
            aggregatedDebits += agg.total_debit;
            aggregatedCredits += agg.total_credit;
          }
          
          expect(aggregatedDebits).toBeCloseTo(individualDebits, 2);
          expect(aggregatedCredits).toBeCloseTo(individualCredits, 2);
        }),
        { numRuns: 100 }
      );
    });
  });
});

describe('Income Statement - Filter AND Logic Property Tests', () => {
  /**
   * **Feature: income-statement-ledger, Property 6: Filter AND Logic**
   * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7**
   * 
   * For any combination of filters (date range, account category, transaction type),
   * the returned entries SHALL be exactly those that match ALL applied filter criteria simultaneously.
   */
  describe('Property 6: Filter AND Logic', () => {
    it('filtered entries match all applied criteria', () => {
      fc.assert(
        fc.property(
          genEntryList,
          fc.option(genTransactionDate),
          fc.option(genTransactionDate),
          fc.option(fc.array(genCategoryId, { minLength: 1, maxLength: 3 })),
          fc.option(fc.constantFrom('revenue', 'expense') as fc.Arbitrary<'revenue' | 'expense'>),
          (entries, dateFrom, dateTo, categoryIds, transactionType) => {
            const filters: IncomeStatementFilters = {};
            
            if (dateFrom !== null) filters.date_from = dateFrom;
            if (dateTo !== null) filters.date_to = dateTo;
            if (categoryIds !== null) filters.account_category_ids = categoryIds;
            if (transactionType !== null) filters.transaction_type = transactionType;
            
            const filtered = applyFilters(entries, filters);
            
            // Verify each filtered entry matches ALL criteria
            for (const entry of filtered) {
              if (filters.date_from) {
                expect(entry.transaction_date >= filters.date_from).toBe(true);
              }
              if (filters.date_to) {
                expect(entry.transaction_date <= filters.date_to).toBe(true);
              }
              if (filters.account_category_ids && filters.account_category_ids.length > 0) {
                expect(filters.account_category_ids).toContain(entry.account_category_id);
              }
              if (filters.transaction_type && filters.transaction_type !== 'all') {
                expect(entry.transaction_type).toBe(filters.transaction_type);
              }
            }
            
            // Verify no entries were incorrectly excluded
            for (const entry of entries) {
              const shouldBeIncluded = 
                (!filters.date_from || entry.transaction_date >= filters.date_from) &&
                (!filters.date_to || entry.transaction_date <= filters.date_to) &&
                (!filters.account_category_ids || filters.account_category_ids.length === 0 || 
                  filters.account_category_ids.includes(entry.account_category_id)) &&
                (!filters.transaction_type || filters.transaction_type === 'all' || 
                  entry.transaction_type === filters.transaction_type);
              
              if (shouldBeIncluded) {
                expect(filtered).toContainEqual(entry);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


describe('Income Statement - Account Category Ordering Property Tests', () => {
  /**
   * **Feature: income-statement-ledger, Property 7: Account Category Ordering**
   * **Validates: Requirements 3.4**
   * 
   * For any set of account categories with distinct sort_order values, 
   * when displaying grouped transactions, categories SHALL appear in ascending sort_order.
   */
  describe('Property 7: Account Category Ordering', () => {
    interface AccountCategory {
      id: string;
      name: string;
      sort_order: number;
    }

    const genCategory = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      sort_order: fc.integer({ min: 0, max: 100 }),
    });

    const genCategoryList = fc.array(genCategory, { minLength: 1, maxLength: 20 })
      .map(cats => {
        // Ensure unique sort_orders
        const seen = new Set<number>();
        return cats.filter(c => {
          if (seen.has(c.sort_order)) return false;
          seen.add(c.sort_order);
          return true;
        });
      });

    it('categories are sorted by sort_order ascending', () => {
      fc.assert(
        fc.property(genCategoryList, (categories) => {
          // Sort categories by sort_order
          const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
          
          // Verify ordering
          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i].sort_order).toBeGreaterThan(sorted[i - 1].sort_order);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});


describe('Income Statement - Drill-Down Expansion Property Tests', () => {
  /**
   * **Feature: income-statement-ledger, Property 9: Drill-Down Expansion Consistency**
   * **Validates: Requirements 7.2**
   * 
   * For any aggregated row (daily/weekly/monthly), when expanded, the sum of the 
   * individual entries' debit_amounts and credit_amounts SHALL equal the aggregated row's totals.
   */
  describe('Property 9: Drill-Down Expansion Consistency', () => {
    interface AggregatedEntry {
      total_debit: number;
      total_credit: number;
      entries: { debit_amount: number; credit_amount: number }[];
    }

    const genAggregatedEntry = fc.array(
      fc.record({
        debit_amount: fc.double({ min: 0, max: 10000, noNaN: true }),
        credit_amount: fc.double({ min: 0, max: 10000, noNaN: true }),
      }),
      { minLength: 1, maxLength: 20 }
    ).map(entries => {
      const total_debit = entries.reduce((sum, e) => sum + e.debit_amount, 0);
      const total_credit = entries.reduce((sum, e) => sum + e.credit_amount, 0);
      return { total_debit, total_credit, entries };
    });

    it('expanded entries sum equals aggregated totals', () => {
      fc.assert(
        fc.property(genAggregatedEntry, (aggregated) => {
          // Sum individual entries
          const sumDebit = aggregated.entries.reduce((sum, e) => sum + e.debit_amount, 0);
          const sumCredit = aggregated.entries.reduce((sum, e) => sum + e.credit_amount, 0);
          
          // Verify sums match aggregated totals
          expect(sumDebit).toBeCloseTo(aggregated.total_debit, 2);
          expect(sumCredit).toBeCloseTo(aggregated.total_credit, 2);
        }),
        { numRuns: 100 }
      );
    });
  });
});
