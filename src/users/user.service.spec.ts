import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { UserService } from './user.service';
import { User, UserStatus } from './user.entity';

describe('UserService', () => {
  let service: UserService;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkUsernameExists', () => {
    it('should return true when username exists', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        status: UserStatus.ACTIVE,
      } as User;

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.checkUsernameExists('testuser');
      expect(result).toBe(true);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });

    it('should return false when username does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.checkUsernameExists('nonexistent');
      expect(result).toBe(false);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'nonexistent' },
      });
    });
  });

  describe('checkEmailExists', () => {
    it('should return true when email exists', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        status: UserStatus.ACTIVE,
      } as User;

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.checkEmailExists('test@example.com');
      expect(result).toBe(true);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return false when email does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.checkEmailExists('nonexistent@example.com');
      expect(result).toBe(false);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
    });

    it('should return false when email is empty or null', async () => {
      const result1 = await service.checkEmailExists('');
      const result2 = await service.checkEmailExists(null as any);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(mockRepository.findOne).not.toHaveBeenCalled();
    });
  });
});
