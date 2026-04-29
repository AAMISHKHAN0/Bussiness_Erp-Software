import { Request, Response, NextFunction } from 'express';
import { AccountService } from '../../services/accountService';
import { ApiError } from '../../utils/ApiError';
import { validateRequired } from '../../utils/validators';
import { requireAuthUser } from '../../utils/requestUser';

export class AccountController {
    /**
     * GET /api/v1/accounting/accounts
     * Get Chart of Accounts
     */
    static async getAccounts(req: Request, res: Response, next: NextFunction) {
        try {
            const accounts = await AccountService.getAccounts(req.tenantDb!);
            res.json({ success: true, count: accounts.length, data: accounts });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/accounting/accounts
     * Create a new account in COA
     */
    static async createAccount(req: Request, res: Response, next: NextFunction) {
        try {
            const required = validateRequired(req.body, ['code', 'name', 'type', 'category']);
            if (!required.valid) {
                throw ApiError.badRequest(`Missing required fields: ${required.missing.join(', ')}`);
            }

            const newAccount = await AccountService.createAccount(req.tenantDb!, req.body);
            res.status(201).json({
                success: true,
                message: 'Account created successfully',
                data: newAccount
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/accounting/journals
     * Create a manual journal entry
     */
    static async createJournalEntry(req: Request, res: Response, next: NextFunction) {
        try {
            const required = validateRequired(req.body, ['date', 'description', 'lines']);
            if (!required.valid) {
                throw ApiError.badRequest(`Missing required fields: ${required.missing.join(', ')}`);
            }

            const userId = requireAuthUser(req).id;
            const entry = await AccountService.createJournalEntry(req.tenantDb!, req.body, userId);

            res.status(201).json({
                success: true,
                message: 'Journal entry created successfully',
                data: entry
            });
        } catch (error) {
            next(error);
        }
    }

    static async getTransactions(req: Request, res: Response, next: NextFunction) {
        try {
            const rows = await AccountService.listTransactions(req.tenantDb!);
            res.json({ success: true, count: rows.length, data: rows });
        } catch (error) {
            next(error);
        }
    }

    static async deleteTransaction(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await AccountService.deleteTransaction(req.tenantDb!, id as string);
            res.json({ success: true, message: 'Transaction deleted' });
        } catch (error) {
            next(error);
        }
    }
}
