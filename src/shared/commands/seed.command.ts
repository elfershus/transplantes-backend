import { Command, CommandRunner } from 'nest-commander';
import { SeedService } from '../services/seed.service';

@Command({ name: 'seed:admin', description: 'Seed admin user data' })
export class SeedAdminCommand extends CommandRunner {
  constructor(private readonly seedService: SeedService) {
    super();
  }

  async run(): Promise<void> {
    try {
      await this.seedService.seedAdminUser();
      console.log('Admin user seed completed successfully');
    } catch (error) {
      console.error('Error seeding admin user:', error);
    } finally {
      process.exit(0);
    }
  }
}
