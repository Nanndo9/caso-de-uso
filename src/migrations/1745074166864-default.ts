import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1745074166864 implements MigrationInterface {
    name = 'Default1745074166864'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_activities" DROP CONSTRAINT "FK_5618ade060df353e3965b759995"`);
        await queryRunner.query(`ALTER TABLE "user_activities" ALTER COLUMN "userId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_activities" ADD CONSTRAINT "FK_5618ade060df353e3965b759995" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_activities" DROP CONSTRAINT "FK_5618ade060df353e3965b759995"`);
        await queryRunner.query(`ALTER TABLE "user_activities" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_activities" ADD CONSTRAINT "FK_5618ade060df353e3965b759995" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
