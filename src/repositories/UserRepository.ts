import { Repository } from 'typeorm';
import { User } from '../entities/User';
import { BaseRepository } from './BaseRepository';

export class UserRepository extends BaseRepository<User> {
    public constructor(repository: Repository<User>) {
        super(repository);
    }

    public async findById(id: string): Promise<User | null>{
        return await this.repository.findOne({where: {id}})
    }
    
    public async findByEmail(email: string): Promise<User | null>{
        return await this.repository.findOne({where: {email}});
    }

}