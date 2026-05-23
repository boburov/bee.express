import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Authenticated } from '../types';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Authenticated => {
    const req = ctx.switchToHttp().getRequest<{ user: Authenticated }>();
    return req.user;
  },
);
