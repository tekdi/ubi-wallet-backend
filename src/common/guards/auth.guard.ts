import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from '../../users/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token is required');
    }

    // Validate token and get user
    const user = await this.userService.findByToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    // Check if user is blocked
    if (user.blocked) {
      throw new ForbiddenException('User account is blocked');
    }

    // Attach user to request for use in controllers
    request['user'] = user;
    request['token'] = token;

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
