import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(userData: {
    firstName: string;
    lastName: string;
    accountId: string;
    username: string;
    password: string;
    token?: string;
    did?: string;
    phone?: string;
    email?: string;
    createdBy?: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
      status: UserStatus.ACTIVE,
      blocked: false,
    });

    return await this.userRepository.save(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { username, status: UserStatus.ACTIVE, blocked: false },
    });
  }

  async findByAccountId(accountId: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { accountId, status: UserStatus.ACTIVE, blocked: false },
    });
  }

  async findByToken(token: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { token, status: UserStatus.ACTIVE, blocked: false },
    });
  }

  async updateToken(accountId: string, token: string): Promise<void> {
    await this.userRepository.update(
      { accountId },
      { token, updatedAt: new Date() },
    );
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
  }

  async blockUser(accountId: string, updatedBy: string): Promise<void> {
    await this.userRepository.update(
      { accountId },
      { blocked: true, updatedBy, updatedAt: new Date() },
    );
  }

  async unblockUser(accountId: string, updatedBy: string): Promise<void> {
    await this.userRepository.update(
      { accountId },
      { blocked: false, updatedBy, updatedAt: new Date() },
    );
  }

  async updateStatus(
    accountId: string,
    status: UserStatus,
    updatedBy: string,
  ): Promise<void> {
    await this.userRepository.update(
      { accountId },
      { status, updatedBy, updatedAt: new Date() },
    );
  }
}
