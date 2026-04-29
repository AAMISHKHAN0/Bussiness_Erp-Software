import { Request, Response, NextFunction } from 'express';
import { FileService } from '../../services/fileService';
import { ApiError } from '../../utils/ApiError';

export class FileController {
    /**
     * POST /api/v1/files/upload
     * Handle file uploads via multer
     */
    static async uploadFile(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.file) {
                throw ApiError.badRequest('No file uploaded');
            }

            const result = await FileService.uploadFile(req.tenantDb!, req.file);

            res.status(201).json({
                success: true,
                message: 'File uploaded successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/files
     * Get list of all uploaded files (metadata)
     */
    static async getFiles(req: Request, res: Response, next: NextFunction) {
        try {
            const files = await FileService.getFiles(req.tenantDb!);
            res.json({ success: true, data: files });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/v1/files/:id
     * Delete file metadata
     */
    static async deleteFile(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const result = await FileService.deleteFile(req.tenantDb!, id as string);
            res.json({
                success: true,
                message: 'File record deleted successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}
