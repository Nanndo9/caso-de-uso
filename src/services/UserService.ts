import { Repository } from 'typeorm';
import { User } from '../entities/User';
import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { AppDataSource } from '../config/DataSource';
import { AppError } from '../errors/AppError';
import { UserActivityService } from './UserActivityService';

interface ILoginRequest {
    email: string;
    password: string;
}

interface ILoginResponse {
    user: Omit<User, 'password'>;
    token: string;
}

export class UserService {
    private userRepository: Repository<User>;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
    }

    async create(name: string, email: string, password: string): Promise<User> {
        const userExists = await this.userRepository.findOne({
            where: { email },
        });

        if (userExists) {
            throw new AppError('User already exists', 400);
        }

        const user = this.userRepository.create({
            name,
            email,
            password,
        });

        await this.userRepository.save(user);

        return user;
    }

    async login({ email, password }: ILoginRequest): Promise<ILoginResponse> {
        const user = await this.userRepository.findOne({
            where: { email },
        });

        if (!user) {
            throw new AppError('Email or password incorrect', 401);
        }

        if (!user.isActive) {
            throw new AppError('User is inactive', 401);
        }

        const passwordMatch = await compare(password, user.password);

        if (!passwordMatch) {
            throw new AppError('Email or password incorrect', 401);
        }

        const token = sign(
            {
                id: user.id,
            },
            process.env.JWT_SECRET || 'default_secret',
            {
                subject: user.id,
                expiresIn: '1d',
            }
        );

        const { password: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword as any,
            token,
        };
    }

    async findById(id: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { id },
        });
    }
}
