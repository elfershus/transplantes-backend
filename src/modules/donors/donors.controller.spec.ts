import { Test, TestingModule } from '@nestjs/testing';
import { DonorsController } from './donors.controller';

describe('DonorsController', () => {
  let controller: DonorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DonorsController],
    }).compile();

    controller = module.get<DonorsController>(DonorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
