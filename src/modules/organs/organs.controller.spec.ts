import { Test, TestingModule } from '@nestjs/testing';
import { OrgansController } from './organs.controller';

describe('OrgansController', () => {
  let controller: OrgansController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrgansController],
    }).compile();

    controller = module.get<OrgansController>(OrgansController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
