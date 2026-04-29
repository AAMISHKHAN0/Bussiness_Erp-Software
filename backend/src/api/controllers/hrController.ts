import { Request, Response, NextFunction } from 'express';
import { HrService } from '../../services/hrService';
import { ApiError } from '../../utils/ApiError';
import { validateRequired } from '../../utils/validators';

export class HrController {
    /**
     * GET /api/v1/hr/employees
     */
    static async getEmployees(req: Request, res: Response, next: NextFunction) {
        try {
            const employees = await HrService.getAllEmployees(req.tenantDb!);
            res.json({ success: true, count: employees.length, data: employees });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/hr/attendance
     */
    static async getAttendance(req: Request, res: Response, next: NextFunction) {
        try {
            const attendance = await HrService.getAllAttendance(req.tenantDb!);
            res.json({ success: true, count: attendance.length, data: attendance });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/hr/payroll
     */
    static async getPayroll(req: Request, res: Response, next: NextFunction) {
        try {
            const payroll = await HrService.getAllPayroll(req.tenantDb!);
            res.json({ success: true, count: payroll.length, data: payroll });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/hr/employees
     */
    static async createEmployee(req: Request, res: Response, next: NextFunction) {
        try {
            const required = validateRequired(req.body, ['first_name', 'last_name', 'designation', 'department', 'salary', 'join_date']);
            if (!required.valid) {
              throw ApiError.badRequest(`Missing required fields: ${required.missing.join(', ')}`);
            }

            const newEmployee = await HrService.createEmployee(req.tenantDb!, req.body);
            res.status(201).json({
                success: true,
                message: 'Employee created successfully',
                data: newEmployee
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/v1/hr/employees/:id
     */
    static async deactivateEmployee(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const result = await HrService.deactivateEmployee(req.tenantDb!, id as string);
            res.json({
                success: true,
                message: 'Employee deactivated successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}
