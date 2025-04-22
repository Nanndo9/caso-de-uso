import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { AppError } from '../errors/AppError';

interface TokenPayload {
    id: string;
    iat: number;
    exp: number;
    sub: string;
}

interface AuthenticatedRequest extends Request {
    userId?: string;
}

export function authMiddleware(
    request: AuthenticatedRequest,
    _: Response,
    next: NextFunction
): void {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
        throw new AppError('JWT token is missing', 401);
    }

    const [, token] = authHeader.split(' ');

    try {
        const decoded = verify(
            token,
            process.env.JWT_SECRET || 'default_secret'
        );

        const { sub } = decoded as TokenPayload;

        request.userId = sub;

        return next();
    } catch {
        throw new AppError('Invalid JWT token', 401);
    }
}
