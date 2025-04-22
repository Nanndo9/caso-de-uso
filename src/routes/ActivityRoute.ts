import { Router, Request, Response, NextFunction } from 'express';
import { UserActivityService } from '../services/UserActivityService';
import { authMiddleware } from '../middleware/AuthMiddleware';

interface AuthenticatedRequest extends Request {
    userId?: string;
}

export class ActivityRouter {
    private router: Router;
    private userActivityService: UserActivityService;

    constructor() {
        this.router = Router();
        this.userActivityService = new UserActivityService();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        this.router.get(
            '/my-activities',
            authMiddleware,
            async (
                req: AuthenticatedRequest,
                res: Response,
                next: NextFunction
            ) => {
                try {
                    if (!req.userId) {
                        res.status(401).json({
                            error: 'Usuário não autenticado',
                        });
                        return;
                    }

                    const limit = parseInt(req.query.limit as string) || 100;
                    const offset = parseInt(req.query.offset as string) || 0;

                    const activities =
                        await this.userActivityService.getUserActivities(
                            req.userId,
                            limit,
                            offset
                        );

                    res.status(200).json(activities);
                } catch (error) {
                    next(error);
                }
            }
        );

        this.router.get(
            '/all',
            authMiddleware,
            async (
                req: AuthenticatedRequest,
                res: Response,
                next: NextFunction
            ) => {
                try {
                    if (!req.userId) {
                        res.status(401).json({
                            error: 'Usuário não autenticado',
                        });
                        return;
                    }

                    const limit = parseInt(req.query.limit as string) || 100;
                    const offset = parseInt(req.query.offset as string) || 0;

                    const activities =
                        await this.userActivityService.getAllActivities(
                            limit,
                            offset
                        );

                    res.status(200).json(activities);
                } catch (error) {
                    next(error);
                }
            }
        );

        this.router.post(
            '/track',
            authMiddleware,
            async (
                req: AuthenticatedRequest,
                res: Response,
                next: NextFunction
            ) => {
                try {
                    if (!req.userId) {
                        res.status(401)
                            .json({ error: 'Usuário não autenticado' });
                        return;
                    }

                    const { screen, action, details } = req.body;

                    if (!screen || !action) {
                        res.status(400)
                            .json({ error: 'Dados incompletos' });
                        return;
                    }

                    const ipAddress = req.ip || req.socket.remoteAddress;
                    const userAgent = req.headers['user-agent'];

                    await this.userActivityService.logActivity(
                        req.userId,
                        action,
                        screen,
                        details,
                        ipAddress,
                        userAgent
                    );

                    res.status(200).json({ success: true });
                } catch (error) {
                    next(error);
                }
            }
        );
    }

    public getRouter(): Router {
        return this.router;
    }
}

export const createActivityRouter = (): Router => {
    const activityRouter = new ActivityRouter();
    return activityRouter.getRouter();
};
