import { Test, TestingModule } from '@nestjs/testing';
import { CompatibilityController } from './compatibility.controller';

describe('CompatibilityController', () => {
  let controller: CompatibilityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompatibilityController],
    }).compile();

    controller = module.get<CompatibilityController>(CompatibilityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
