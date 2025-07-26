import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/user.entity';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<{ user: User }>();
    return request.user;
  },
);

export const CurrentToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ token: string }>();
    return request.token;
  },
); 