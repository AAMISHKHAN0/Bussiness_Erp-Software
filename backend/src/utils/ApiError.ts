/**
 * Custom API Error class
 */
export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly details: any;
    public readonly isOperational: boolean;

    constructor(statusCode: number, message: string, details: any = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message: string, details?: any) {
        return new ApiError(400, message, details);
    }

    static unauthorized(message: string = 'Unauthorized') {
        return new ApiError(401, message);
    }

    static forbidden(message: string = 'Forbidden') {
        return new ApiError(403, message);
    }

    static notFound(message: string = 'Resource not found') {
        return new ApiError(404, message);
    }

    static conflict(message: string) {
        return new ApiError(409, message);
    }

    static tooMany(message: string = 'Too many requests') {
        return new ApiError(429, message);
    }

    static internal(message: string = 'Internal server error') {
        return new ApiError(500, message);
    }
}
