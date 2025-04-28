import { Test, TestingModule } from '@nestjs/testing';
import { TransportationController } from './transportation.controller';

describe('TransportationController', () => {
  let controller: TransportationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransportationController],
    }).compile();

    controller = module.get<TransportationController>(TransportationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
