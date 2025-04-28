import { Test, TestingModule } from '@nestjs/testing';
import { TransplantProceduresController } from './transplant-procedures.controller';

describe('TransplantProceduresController', () => {
  let controller: TransplantProceduresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransplantProceduresController],
    }).compile();

    controller = module.get<TransplantProceduresController>(TransplantProceduresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
