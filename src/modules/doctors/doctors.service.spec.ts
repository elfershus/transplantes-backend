import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorsService } from './doctors.service';
import { Doctor } from '../../shared/entities/doctor.entity';
import * as bcrypt from 'bcrypt';

describe('DoctorsService', () => {
  let service: DoctorsService;
  let repository: Repository<Doctor>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorsService,
        {
          provide: getRepositoryToken(Doctor),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<DoctorsService>(DoctorsService);
    repository = module.get<Repository<Doctor>>(getRepositoryToken(Doctor));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of doctors', async () => {
      const result = [new Doctor()];
      jest.spyOn(repository, 'find').mockResolvedValue(result);

      expect(await service.findAll()).toBe(result);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single doctor', async () => {
      const result = new Doctor();
      jest.spyOn(repository, 'findOne').mockResolvedValue(result);

      expect(await service.findOne(1)).toBe(result);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: undefined,
      });
    });

    it('should throw an error if doctor not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create a doctor', async () => {
      const dto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password',
        licenseNumber: '12345',
        specialty: 'Cardiology',
      };

      const result = { ...dto, id: 1 } as Doctor;

      jest.spyOn(repository, 'create').mockReturnValue(result);
      jest.spyOn(repository, 'save').mockResolvedValue(result);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_password');

      expect(await service.create(dto)).toBe(result);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
    });
  });
});
