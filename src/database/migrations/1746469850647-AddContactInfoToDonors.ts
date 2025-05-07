import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContactInfoToDonors1746469850647 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE donors 
            ADD COLUMN email VARCHAR(255) NULL,
            ADD COLUMN phone VARCHAR(255) NULL,
            ADD COLUMN address VARCHAR(255) NULL,
            ADD COLUMN city VARCHAR(255) NULL,
            ADD COLUMN postal_code VARCHAR(50) NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE donors
            DROP COLUMN email,
            DROP COLUMN phone,
            DROP COLUMN address,
            DROP COLUMN city,
            DROP COLUMN postal_code
        `);
  }
}
