import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './User';

@Entity('user_activities')
export class UserActivity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true }) 
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    action: string;

    @Column()
    screen: string;

    @Column({ nullable: true })
    details: string;

    @CreateDateColumn()
    timestamp: Date;

    @Column({ nullable: true })
    ipAddress: string;

    @Column({ nullable: true })
    userAgent: string;
}
