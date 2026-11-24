export class HttpError extends Error {
    status;
    code;
    details;
    constructor(status, message, code, details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }
}
export const badRequest = (m, code, d) => new HttpError(400, m, code, d);
export const unauthorized = (m = 'Authentication required', code = 'UNAUTHORIZED') => new HttpError(401, m, code);
export const forbidden = (m = 'You do not have permission to do this', code = 'FORBIDDEN') => new HttpError(403, m, code);
export const notFound = (m = 'Not found') => new HttpError(404, m, 'NOT_FOUND');
export const conflict = (m, code = 'CONFLICT') => new HttpError(409, m, code);
