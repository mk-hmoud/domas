import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuditUserContext } from '../../common/interfaces/audit-user-context.interface';

export const UserContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuditUserContext => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      // Fallback for unauthenticated requests
      // Create a new guest UUID ? Could be smarter to do so in the future.
      return {
        userId: '00000000-0000-0000-0000-000000000000', // System/Guest UUID
        username: 'guest',
        ipAddress: request.ip || '127.0.0.1',
        userAgent: request.headers['user-agent'],
      };
    }

    return {
      userId: user.id,
      username: user.email,
      isRecoveryAdmin: user.isRecoveryAdmin,
      permissions: user.permissions,
      roles: user.roles?.map((r: any) => ({ name: r.name })),
      locationScope: user.locationScope,
      ipAddress: request.ip || '127.0.0.1',
      userAgent: request.headers['user-agent'],
    };
  },
);
