import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportingService } from './reporting.service';
import { Organ } from '../../shared/entities/organ.entity';
import { Donor } from '../../shared/entities/donor.entity';
import { Receiver } from '../../shared/entities/receiver.entity';
import { TransplantProcedure } from '../../shared/entities/transplant-procedure.entity';
import { Transportation } from '../../shared/entities/transportation.entity';
import { Institution } from '../../shared/entities/institution.entity';

describe('ReportingService', () => {
  let service: ReportingService;
  let organRepository: Repository<Organ>;
  let donorRepository: Repository<Donor>;
  let receiverRepository: Repository<Receiver>;
  let procedureRepository: Repository<TransplantProcedure>;
  let transportationRepository: Repository<Transportation>;
  let institutionRepository: Repository<Institution>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingService,
        {
          provide: getRepositoryToken(Organ),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Donor),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Receiver),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(TransplantProcedure),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Transportation),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Institution),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<ReportingService>(ReportingService);
    organRepository = module.get<Repository<Organ>>(getRepositoryToken(Organ));
    donorRepository = module.get<Repository<Donor>>(getRepositoryToken(Donor));
    receiverRepository = module.get<Repository<Receiver>>(getRepositoryToken(Receiver));
    procedureRepository = module.get<Repository<TransplantProcedure>>(
      getRepositoryToken(TransplantProcedure),
    );
    transportationRepository = module.get<Repository<Transportation>>(
      getRepositoryToken(Transportation),
    );
    institutionRepository = module.get<Repository<Institution>>(getRepositoryToken(Institution));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSystemOverview', () => {
    it('should return system statistics', async () => {
      jest.spyOn(donorRepository, 'count').mockResolvedValueOnce(100).mockResolvedValueOnce(80);
      jest.spyOn(receiverRepository, 'count').mockResolvedValueOnce(200).mockResolvedValueOnce(150);
      jest.spyOn(organRepository, 'count').mockResolvedValueOnce(120).mockResolvedValueOnce(50);
      jest.spyOn(procedureRepository, 'count').mockResolvedValueOnce(70).mockResolvedValueOnce(65);
      jest.spyOn(transportationRepository, 'count').mockResolvedValue(10);

      const result = await service.getSystemOverview();

      expect(result).toEqual({
        donors: { total: 100, active: 80 },
        receivers: { total: 200, waiting: 150 },
        organs: { total: 120, available: 50 },
        transplants: { total: 70, successful: 65 },
        transportations: { pending: 10 },
      });
    });
  });
});
