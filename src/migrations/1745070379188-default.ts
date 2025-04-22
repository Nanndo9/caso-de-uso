import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1745070379188 implements MigrationInterface {
    name = 'Default1745070379188'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "action" character varying NOT NULL, "screen" character varying NOT NULL, "details" character varying, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), "ipAddress" character varying, "userAgent" character varying, CONSTRAINT "PK_1245d4d2cf04ba7743f2924d951" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_activities" ADD CONSTRAINT "FK_5618ade060df353e3965b759995" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_activities" DROP CONSTRAINT "FK_5618ade060df353e3965b759995"`);
        await queryRunner.query(`DROP TABLE "user_activities"`);
    }

}
