import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './config/DataSource';
import { Router } from 'express';
import { createUserRouter } from './routes/UserRoute';
import { UserService } from './services/UserService';
import { createActivityRouter } from './routes/ActivityRoute';
import { globalActivityTracker } from './middleware/ActivityTrackerMiddleware';

dotenv.config();

AppDataSource.initialize()
    .then(() => {
        const app = express();

        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(cors());

        app.use(globalActivityTracker);

        const routes = Router();

        const userService = new UserService();
        routes.use('/users', createUserRouter(userService));

        const activityRouter = createActivityRouter();
        routes.use('/activities', activityRouter);

        app.use('/api', routes);

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`✅ Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ Error initializing database:', err);
    });
