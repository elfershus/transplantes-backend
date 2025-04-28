import { Test, TestingModule } from '@nestjs/testing';
import { TransplantProceduresService } from './transplant-procedures.service';

describe('TransplantProceduresService', () => {
  let service: TransplantProceduresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransplantProceduresService],
    }).compile();

    service = module.get<TransplantProceduresService>(TransplantProceduresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
