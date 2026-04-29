import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { FileController } from '../controllers/fileController';
import { authenticate } from '../../middlewares/authMiddleware';

const router = Router();

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * All file routes are protected
 */
router.use(authenticate);

/**
 * @route   POST /api/v1/files/upload
 * @desc    Upload a single file
 * @access  Private
 */
router.post('/upload', upload.single('file'), FileController.uploadFile);

/**
 * @route   GET /api/v1/files
 * @desc    Get list of uploaded files
 * @access  Private
 */
router.get('/', FileController.getFiles);

/**
 * @route   DELETE /api/v1/files/:id
 * @desc    Delete file record
 * @access  Private
 */
router.delete('/:id', FileController.deleteFile);

export default router;
