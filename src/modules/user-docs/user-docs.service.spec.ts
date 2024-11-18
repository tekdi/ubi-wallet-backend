import { Test, TestingModule } from '@nestjs/testing';
import { UserDocsService } from './user-docs.service';

describe('UserDocsService', () => {
  let service: UserDocsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserDocsService],
    }).compile();

    service = module.get<UserDocsService>(UserDocsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
