import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { UserActivityService } from '../services/UserActivityService';

const ACTIVITY_TYPES = {
    LOGIN: 'LOGIN',
};

export const loginTrackerMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const originalSend = res.send;

    res.send = function (body) {
        res.send = originalSend;

        try {
            processLoginResponse(req, body);
        } catch (error) {}

        return originalSend.call(res, body);
    };

    next();
};

function processLoginResponse(req: Request, body: any): void {
    const responseBody = parseResponseBody(body);

    if (!responseBody?.token) {
        return;
    }

    const userId = extractUserIdFromToken(responseBody.token);

    if (userId) {
        recordLoginActivity(req, userId);
    }
}

function parseResponseBody(body: any): any | null {
    if (!body) return null;

    if (typeof body === 'string') {
        try {
            return JSON.parse(body);
        } catch (e) {
            return null;
        }
    }

    return body;
}

function extractUserIdFromToken(token: string): string | null {
    try {
        const decoded = verify(
            token,
            process.env.JWT_SECRET || 'default_secret'
        ) as any;

        return decoded.id || decoded.sub || null;
    } catch (error) {
        return null;
    }
}

function recordLoginActivity(req: Request, userId: string): void {
    const userActivityService = new UserActivityService();

    const activityDetails = {
        email: req.body?.email,
        timestamp: new Date().toISOString(),
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
    };

    userActivityService
        .logActivity(
            userId,
            ACTIVITY_TYPES.LOGIN,
            'users-login',
            JSON.stringify(activityDetails),
            activityDetails.ipAddress,
            activityDetails.userAgent
        )
        .catch(() => {});
}
