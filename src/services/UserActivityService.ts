import { Repository } from 'typeorm';
import { UserActivity } from '../entities/UserActivity';
import { AppDataSource } from '../config/DataSource';

export class UserActivityService {
    private activityRepository: Repository<UserActivity>;

    constructor() {
        this.activityRepository = AppDataSource.getRepository(UserActivity);
    }

    async logActivity(
        userId: string | null,
        action: string,
        screen: string, 
        details?: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<UserActivity> {
        const activity = this.activityRepository.create({
            userId: userId ?? undefined,
            action,
            screen,
            details,
            ipAddress,
            userAgent,
        });

        return this.activityRepository.save(activity);
    }

    async getUserActivities(
        userId: string,
        limit = 100,
        offset = 0
    ): Promise<UserActivity[]> {
        return this.activityRepository.find({
            where: { userId },
            order: { timestamp: 'DESC' },
            skip: offset,
            take: limit,
            relations: ['user'],
        });
    }

    async getAllActivities(limit = 100, offset = 0): Promise<UserActivity[]> {
        return this.activityRepository.find({
            order: { timestamp: 'DESC' },
            skip: offset,
            take: limit,
            relations: ['user'],
        });
    }
}
