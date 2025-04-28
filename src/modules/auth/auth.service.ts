import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../../shared/entities/doctor.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
    private jwtService: JwtService,
  ) {}

  async validateDoctor(email: string, password: string): Promise<any> {
    const doctor = await this.doctorsRepository.findOne({
      where: { email },
      relations: ['institutions'],
    });

    if (!doctor) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, doctor.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { passwordHash, ...result } = doctor;
    return result;
  }

  async login(doctor: any) {
    const payload = { email: doctor.email, sub: doctor.id };

    return {
      access_token: this.jwtService.sign(payload),
      doctor: {
        id: doctor.id,
        email: doctor.email,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        institutions: doctor.institutions,
      },
    };
  }
}
