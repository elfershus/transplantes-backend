import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../entities/doctor.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
  ) {}

  async seedAdminUser() {
    // Check if admin user already exists
    const existingAdmin = await this.doctorsRepository.findOne({
      where: { email: 'admin@admin.com' },
    });

    if (existingAdmin) {
      console.log('Admin user already exists, skipping seed.');
      return;
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('adminadmin', saltRounds);

    // Create admin user
    const adminUser = this.doctorsRepository.create({
      email: 'admin@admin.com',
      firstName: 'Admin',
      lastName: 'User',
      specialty: 'System Administrator',
      licenseNumber: 'ADMIN-001',
      phone: '',
      passwordHash,
      institutions: [],
    });

    const savedAdmin = await this.doctorsRepository.save(adminUser);
    console.log(`Admin user created with ID: ${savedAdmin.id}`);
  }
}
