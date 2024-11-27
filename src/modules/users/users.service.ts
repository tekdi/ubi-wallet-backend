import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorResponse } from 'src/common/responses/error-response';
import { SuccessResponse } from 'src/common/responses/success-response';
import { User } from './entity/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = this.userRepository.create(createUserDto);
    try {
      const savedUser = await this.userRepository.save(user);

      return new SuccessResponse({
        statusCode: HttpStatus.OK, // Created
        message: 'User created successfully.',
        data: savedUser,
      });
    } catch (error) {
      return new ErrorResponse({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR, // Created
        errorMessage: error.message,
      });
    }
  }
  async createKeycloakData(body: any): Promise<User> {
    const user = this.userRepository.create({
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email || '',
      phone_number: body.mobile || '',
      sso_provider: 'keycloak',
      sso_id: body.keycloak_id,
      created_at: new Date(),
    });
    return await this.userRepository.save(user);
  }

  async findByMobile(mobile: string): Promise<User | undefined> {
    return await this.userRepository.findOne({
      where: { phone_number: mobile },
    });
  }
}
