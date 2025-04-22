import { Router, Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { authMiddleware } from '../middleware/AuthMiddleware';
import { hash } from 'bcrypt';
import { loginTrackerMiddleware } from '../middleware/LoginTrackerMiddleware';

interface AuthenticatedRequest extends Request {
    userId?: string;
}

export class UserRouter {
    private router: Router;

    constructor(private readonly userService: UserService) {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        this.router.post(
            '/register',
            async (
                req: Request,
                res: Response,
                next: NextFunction
            ): Promise<any> => {
                try {
                    const { name, email, password } = req.body;

                    if (
                        !name ||
                        typeof name !== 'string' ||
                        name.trim().length < 2
                    ) {
                        return res.status(400).json({
                            error: 'Nome obrigatório: no mínimo dois caracteres',
                        });
                    }

                    if (!email || typeof email !== 'string') {
                        return res.status(400).json({
                            error: 'Email obrigatório',
                        });
                    }

                    if (
                        !password ||
                        typeof password !== 'string' ||
                        password.length < 6
                    ) {
                        return res.status(400).json({
                            error: 'Senha obrigatória: no mínimo seis caracteres',
                        });
                    }

                    const hashedPassword = await hash(password, 10);
                    const user = await this.userService.create(
                        name,
                        email,
                        hashedPassword
                    );

                    const { password: _, ...userWithoutPassword } = user;

                    return res.status(201).json(userWithoutPassword);
                } catch (error: any) {
                    next(error);
                }
            }
        );

        this.router.post(
            '/login',
            loginTrackerMiddleware,
            async (
                req: Request,
                res: Response,
                next: NextFunction
            ): Promise<any> => {
                try {
                    const { email, password } = req.body;

                    if (!email || !password) {
                        return res.status(400).json({
                            error: 'Email e senha são obrigatórios',
                        });
                    }

                    const result = await this.userService.login({
                        email,
                        password,
                    });
                    return res.status(200).json({ token: result.token });
                } catch (error: any) {
                    next(error);
                }
            }
        );

        this.router.get(
            '/profile',
            authMiddleware,
            async (
                req: AuthenticatedRequest,
                res: Response,
                next: NextFunction
            ): Promise<any> => {
                try {
                    if (!req.userId) {
                        return res
                            .status(401)
                            .json({ error: 'Usuário não autenticado' });
                    }

                    const user = await this.userService.findById(req.userId);
                    if (!user) {
                        return res
                            .status(404)
                            .json({ error: 'Usuário não encontrado' });
                    }

                    const { password, ...userWithoutPassword } = user;

                    return res.status(200).json({ user: userWithoutPassword });
                } catch (error: any) {
                    next(error);
                }
            }
        );
    }

    public getRouter(): Router {
        return this.router;
    }
}

export const createUserRouter = (userService: UserService): Router => {
    const userRouter = new UserRouter(userService);
    return userRouter.getRouter();
};
