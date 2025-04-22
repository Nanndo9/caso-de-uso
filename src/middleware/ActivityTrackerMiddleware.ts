import { Request, Response, NextFunction } from 'express';
import { UserActivityService } from '../services/UserActivityService';
import { verify } from 'jsonwebtoken';

const LOG_PREFIXES = {
    REQUEST: '🔍 Request:',
    AUTH: '🔑 Autenticação:',
    ACTIVITY: '📝 Atividade:',
    ERROR: '❌ Erro:',
};

interface AuthenticatedRequest extends Request {
    userId?: string;
}


export const globalActivityTracker = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const requestInfo = extractRequestInfo(req);

        const userId = extractUserIdFromToken(requestInfo.authHeader);

        if (userId) {
            req.userId = userId;
        }

        res.on('finish', () => {
            try {
                processFinishedRequest(req, res, requestInfo, userId);
            } catch (err) {
                console.error(
                    `${LOG_PREFIXES.ERROR} Falha ao processar atividade:`,
                    err
                );
            }
        });

        next();
    } catch (err) {
        console.error(`${LOG_PREFIXES.ERROR} Erro no middleware global:`, err);
        next();
    }
};


function processFinishedRequest(
    req: Request,
    res: Response,
    requestInfo: ReturnType<typeof extractRequestInfo>,
    userId: string | null
) {
    const isLoginRoute = checkIfLoginRoute(req, requestInfo.originalUrl);

    logRequestFinished(
        req,
        requestInfo.originalUrl,
        userId,
        isLoginRoute,
        res.statusCode
    );

    if (!userId && !isLoginRoute) {
        return;
    }

    if (isLoginRoute) {
        console.log(
            `${LOG_PREFIXES.ACTIVITY} Login detectado - ignorando registro no middleware global`
        );
        return;
    }

    trackAuthenticatedActivity(req, requestInfo, userId);
}


function extractRequestInfo(req: Request) {
    return {
        originalUrl: req.originalUrl || req.url,
        method: req.method,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        authHeader: req.headers.authorization,
    };
}


function extractUserIdFromToken(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = verify(
            token,
            process.env.JWT_SECRET || 'default_secret'
        ) as any;
        return decoded.id || decoded.sub || null;
    } catch (error) {
        console.error(`${LOG_PREFIXES.ERROR} Token inválido:`, error);
        return null;
    }
}


function checkIfLoginRoute(req: Request, url: string): boolean {
    return (
        req.method === 'POST' &&
        (url.includes('/users/login') || url.includes('/auth/login'))
    );
}

function logRequestFinished(
    req: Request,
    url: string,
    userId: string | null,
    isLoginRoute: boolean,
    statusCode: number
) {
    const statusIndicator = statusCode < 400 ? '✅' : '⚠️';
    console.log(
        `${LOG_PREFIXES.REQUEST} ${statusIndicator} ${req.method} ${url} [${statusCode}] | ` +
            `usuário: ${userId || 'não autenticado'} ${
                isLoginRoute ? '(LOGIN)' : ''
            }`
    );
}


function trackAuthenticatedActivity(
    req: Request,
    requestInfo: ReturnType<typeof extractRequestInfo>,
    userId: string | null
) {
    console.log(`${LOG_PREFIXES.ACTIVITY} Registrando para usuário:`, userId);

    const userActivityService = new UserActivityService();

    const path =
        req.url !== requestInfo.originalUrl ? req.url : requestInfo.originalUrl;
    const screen = path.replace(/^\/api\//, '').replace(/\//g, '-') || 'root';

    const details = formatActivityDetails(
        req,
        requestInfo.method,
        path,
        requestInfo.originalUrl
    );

    userActivityService
        .logActivity(
            userId,
            requestInfo.method,
            screen,
            details,
            requestInfo.ipAddress,
            requestInfo.userAgent
        )
        .then(() =>
            console.log(`${LOG_PREFIXES.ACTIVITY} Registrada com sucesso`)
        )
        .catch((err) =>
            console.error(`${LOG_PREFIXES.ERROR} Falha ao registrar:`, err)
        );
}


function formatActivityDetails(
    req: Request,
    method: string,
    path: string,
    originalUrl: string
): string {
    const skipBodyMethods = ['GET', 'OPTIONS', 'HEAD'];

    if (skipBodyMethods.includes(method)) {
        return `${method} ${path}`;
    }

    return JSON.stringify({
        method,
        path,
        originalPath: path !== originalUrl ? originalUrl : undefined,
        body: req.body,
    });
}
