import { HrRepository } from '../repositories/hrRepository';
import { ApiError } from '../utils/ApiError';
import { isValidEmail } from '../utils/validators';
import { Pool } from "pg";

export class HrService {
    /**
     * Get all employees
     */
    static async getAllEmployees(db: Pool) {
        return await HrRepository.findAllEmployees(db);
    }

    /**
     * Get all attendance
     */
    static async getAllAttendance(db: Pool) {
        return await HrRepository.findAllAttendance(db);
    }

    /**
     * Get all payroll records
     */
    static async getAllPayroll(db: Pool) {
        return await HrRepository.findAllPayroll(db);
    }

    /**
     * Create a new employee
     */
    static async createEmployee(db: Pool, employeeData: any) {
        const { email } = employeeData;

        if (email && !isValidEmail(email)) {
            throw ApiError.badRequest('Invalid email format');
        }

        return await HrRepository.createEmployee(db, employeeData);
    }

    /**
     * Deactivate an employee
     */
    static async deactivateEmployee(db: Pool, id: string) {
        const employee = await HrRepository.findEmployeeById(db, id);
        if (!employee) {
            throw ApiError.notFound('Employee not found');
        }
        return await HrRepository.deactivateEmployee(db, id);
    }
}
