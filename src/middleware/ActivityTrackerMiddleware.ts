import { Request, Response, NextFunction } from 'express';
import { UserActivityService } from '../services/UserActivityService';
import { verify } from 'jsonwebtoken';

// Constantes para padronização
const LOG_PREFIXES = {
    REQUEST: '🔍 Request:',
    AUTH: '🔑 Autenticação:',
    ACTIVITY: '📝 Atividade:',
    ERROR: '❌ Erro:',
};

interface AuthenticatedRequest extends Request {
    userId?: string;
}

/**
 * Middleware global para rastreamento de atividades do usuário
 * Registra automaticamente atividades de rotas autenticadas
 */
export const globalActivityTracker = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Extrai informações básicas da requisição
        const requestInfo = extractRequestInfo(req);

        // Verifica autenticação e extrai userId do token JWT
        const userId = extractUserIdFromToken(requestInfo.authHeader);

        // Define userId no request para uso em outros middlewares
        if (userId) {
            req.userId = userId;
        }

        // Registra a atividade quando a resposta for finalizada
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
        next(); // Continua mesmo com erro no middleware
    }
};

/**
 * Processa uma requisição finalizada
 */
function processFinishedRequest(
    req: Request,
    res: Response,
    requestInfo: ReturnType<typeof extractRequestInfo>,
    userId: string | null
) {
    // Determina se é uma rota de login
    const isLoginRoute = checkIfLoginRoute(req, requestInfo.originalUrl);

    // Log para debugging
    logRequestFinished(
        req,
        requestInfo.originalUrl,
        userId,
        isLoginRoute,
        res.statusCode
    );

    // Se não for autenticado nem login, não registra
    if (!userId && !isLoginRoute) {
        return;
    }

    // Não registra login (delegado ao LoginTrackerMiddleware)
    if (isLoginRoute) {
        console.log(
            `${LOG_PREFIXES.ACTIVITY} Login detectado - ignorando registro no middleware global`
        );
        return;
    }

    // Registra atividade para requisição autenticada
    trackAuthenticatedActivity(req, requestInfo, userId);
}

/**
 * Extrai informações básicas da requisição
 */
function extractRequestInfo(req: Request) {
    return {
        originalUrl: req.originalUrl || req.url,
        method: req.method,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        authHeader: req.headers.authorization,
    };
}

/**
 * Extrai o userId do token JWT
 */
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

/**
 * Verifica se é uma rota de login
 */
function checkIfLoginRoute(req: Request, url: string): boolean {
    return (
        req.method === 'POST' &&
        (url.includes('/users/login') || url.includes('/auth/login'))
    );
}

/**
 * Registra log de requisição finalizada
 */
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

/**
 * Registra atividade para requisição autenticada
 */
function trackAuthenticatedActivity(
    req: Request,
    requestInfo: ReturnType<typeof extractRequestInfo>,
    userId: string | null
) {
    console.log(`${LOG_PREFIXES.ACTIVITY} Registrando para usuário:`, userId);

    const userActivityService = new UserActivityService();

    // Processa informações da URL
    const path =
        req.url !== requestInfo.originalUrl ? req.url : requestInfo.originalUrl;
    const screen = path.replace(/^\/api\//, '').replace(/\//g, '-') || 'root';

    // Formata os detalhes da atividade
    const details = formatActivityDetails(
        req,
        requestInfo.method,
        path,
        requestInfo.originalUrl
    );

    // Registra a atividade
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

/**
 * Formata detalhes da atividade com base no método HTTP
 */
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
