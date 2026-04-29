import { AccountRepository } from '../repositories/accountRepository';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { Pool } from "pg";

export class AccountService {
    /**
     * Get Chart of Accounts
     */
    static async getAccounts(db: Pool) {
        return await AccountRepository.findAllActive(db);
    }

    /**
     * Create a new account in COA
     */
    static async createAccount(db: Pool, accountData: any) {
        try {
            return await AccountRepository.create(db, accountData);
        } catch (error: any) {
            if (error.code === '23505') {
                throw ApiError.conflict('Account with this code already exists');
            }
            throw error;
        }
    }

    /**
     * Create a manual journal entry (Atomic Transaction)
     */
    static async createJournalEntry(db: Pool, entryData: any, userId: string) {
        const { date, reference, description, lines } = entryData;

        if (!Array.isArray(lines) || lines.length < 2) {
            throw ApiError.badRequest('A journal entry must have at least two lines');
        }

        // Validate Debit = Credit
        let totalDebit = 0;
        let totalCredit = 0;
        lines.forEach(line => {
            totalDebit += parseFloat(line.debit) || 0;
            totalCredit += parseFloat(line.credit) || 0;
        });

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw ApiError.badRequest(`Transactional imbalance: Debits (${totalDebit.toFixed(2)}) != Credits (${totalCredit.toFixed(2)})`);
        }

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            const entryRes = await AccountRepository.createJournalHeader(db, {
                date, reference, description, total_amount: totalDebit, created_by: userId
            }, client);
            const entryId = entryRes.id;

            for (const line of lines) {
                const debit = parseFloat(line.debit) || 0;
                const credit = parseFloat(line.credit) || 0;

                await AccountRepository.createJournalLine(db, {
                    journal_entry_id: entryId,
                    account_id: line.account_id,
                    debit,
                    credit,
                    description: line.description || null
                }, client);

                // Update Account Balance based on account type
                if (debit > 0 || credit > 0) {
                    const account = await AccountRepository.findById(db, line.account_id, client);
                    if (account) {
                        let adjustment = 0;
                        if (['Asset', 'Expense'].includes(account.type)) {
                            adjustment = debit - credit;
                        } else {
                            adjustment = credit - debit;
                        }
                        await AccountRepository.updateBalance(db, line.account_id, adjustment, client);
                    }
                }

                // Log into standard ledger transactions
                const amount = debit > 0 ? debit : credit;
                if (amount > 0) {
                    await AccountRepository.recordLedgerTransaction(db, {
                        date,
                        description: line.description || description,
                        amount,
                        debit_id: debit > 0 ? line.account_id : null,
                        credit_id: credit > 0 ? line.account_id : null,
                        ref_type: 'journal_entry',
                        ref_id: entryId
                    }, client);
                }
            }

            await client.query('COMMIT');
            return entryRes;
        } catch (error: any) {
            await client.query('ROLLBACK');
            logger.error('Failed to create journal entry', { error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    static async listTransactions(db: Pool) {
        const rows = await AccountRepository.findAllTransactions(db);
        return rows.map((tx: any) => ({
            ...tx,
            entry_type: String(tx.type || '').toUpperCase() === 'DEBIT' ? 'Debit' : 'Credit',
        }));
    }

    static async deleteTransaction(db: Pool, id: string) {
        await AccountRepository.deleteTransaction(db, id);
    }
}
