import { Pool, PoolClient } from 'pg';

/**
 * Handle database queries for Chart of Accounts and Journaling - Repository Layer
 */
export class AccountRepository {
    /**
     * Get Chart of Accounts
     */
    static async findAllActive(db: Pool) {
        const query = `
      SELECT * FROM accounts 
      WHERE is_active = true 
      ORDER BY code ASC
    `;
        const result = await db.query(query);
        return result.rows;
    }

    /**
     * Find account by ID
     */
    static async findById(db: Pool, id: string, client?: PoolClient) {
        const query = `SELECT * FROM accounts WHERE id = $1`;
        const executor = client || db;
        const result = await executor.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Create a new account in COA
     */
    static async create(db: Pool, accountData: any) {
        const { code, name, type, category, parent_id, description } = accountData;
        const query = `
      INSERT INTO accounts (code, name, type, category, parent_id, description) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `;
        const values = [code, name, type, category, parent_id || null, description || null];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    /**
     * Create Journal Entry Header
     */
    static async createJournalHeader(db: Pool, data: any, client: PoolClient) {
        const { date, reference, description, total_amount, created_by } = data;
        const query = `
      INSERT INTO journal_entries (entry_date, reference_number, description, total_amount, created_by) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
        const values = [date, reference || null, description, total_amount, created_by];
        const result = await client.query(query, values);
        return result.rows[0];
    }

    /**
     * Create Journal Entry Line
     */
    static async createJournalLine(db: Pool, line: any, client: PoolClient) {
        const { journal_entry_id, account_id, debit, credit, description } = line;
        const query = `
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit_amount, credit_amount, description) 
      VALUES ($1, $2, $3, $4, $5)
    `;
        await client.query(query, [journal_entry_id, account_id, debit, credit, description || null]);
    }

    /**
     * Update Account Balance
     */
    static async updateBalance(db: Pool, accountId: string, amount: number, client: PoolClient) {
        const query = `UPDATE accounts SET balance = balance + $1 WHERE id = $2`;
        await client.query(query, [amount, accountId]);
    }

    /**
     * Record a transaction log for the ledger
     */
    static async recordLedgerTransaction(db: Pool, data: any, client: PoolClient) {
        const { date, description, amount, debit_id, credit_id, ref_type, ref_id } = data;
        const accountId = debit_id || credit_id;
        if (!accountId || !amount) return;
        const type = debit_id ? 'DEBIT' : 'CREDIT';
        const query = `
      INSERT INTO transactions
        (transaction_date, description, amount, account_id, type, reference_type, reference_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
        await client.query(query, [date, description, amount, accountId, type, ref_type, ref_id]);
    }

    static async findAllTransactions(db: Pool) {
        const query = `
      SELECT * FROM transactions
      ORDER BY transaction_date DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    `;
        const result = await db.query(query);
        return result.rows;
    }

    static async deleteTransaction(db: Pool, id: string) {
        await db.query(`DELETE FROM transactions WHERE id = $1`, [id]);
    }
}
