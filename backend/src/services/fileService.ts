import { ApiError } from '../utils/ApiError';
import { Pool } from "pg";

interface FileMetadata {
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: string;
    url?: string;
}

/**
 * In-memory store for mock uploaded files metadata.
 * In Phase 2, this will be migrated to the PostgreSQL 'files' table.
 */
let uploadedFiles: FileMetadata[] = [
    { id: '1', name: 'invoice_march.pdf', type: 'application/pdf', size: 102450, uploadedAt: '2024-03-01' },
    { id: '2', name: 'office_profile.jpg', type: 'image/jpeg', size: 450000, uploadedAt: '2024-03-05' }
];

export class FileService {
    /**
     * Get all uploaded files metadata
     */
    static async getFiles(db: Pool) {
        return uploadedFiles;
    }

    /**
     * Process uploaded file and store metadata
     */
    static async uploadFile(db: Pool, file: Express.Multer.File) {
        if (!file) {
            throw ApiError.badRequest('No file uploaded');
        }

        const newFile: FileMetadata = {
            id: Date.now().toString(),
            name: file.originalname,
            type: file.mimetype,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            url: `/uploads/${file.filename}`
        };

        uploadedFiles.unshift(newFile);
        return newFile;
    }

    /**
     * Delete file metadata
     */
    static async deleteFile(db: Pool, id: string) {
        const initialLength = uploadedFiles.length;
        uploadedFiles = uploadedFiles.filter(f => f.id !== id);

        if (uploadedFiles.length === initialLength) {
            throw ApiError.notFound('File not found');
        }

        return { id };
    }
}
