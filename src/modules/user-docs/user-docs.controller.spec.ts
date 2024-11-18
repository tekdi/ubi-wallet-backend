import { Test, TestingModule } from '@nestjs/testing';
import { UserDocsController } from './user-docs.controller';

describe('UserDocsController', () => {
  let controller: UserDocsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserDocsController],
    }).compile();

    controller = module.get<UserDocsController>(UserDocsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
