import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

interface AuthenticatedRequest {
  user?: {
    userId?: number;
    email?: string;
  };
}

@Injectable()
export class AdminEmailGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();

    const configuredAdminEmail = process.env.ADMIN_EMAIL
      ?.trim()
      .toLowerCase();

    const loggedInEmail = request.user?.email
      ?.trim()
      .toLowerCase();

    // Fail closed if no admin email is configured.
    if (!configuredAdminEmail) {
      throw new ForbiddenException(
        'Admin access is not configured on the server.',
      );
    }

    if (
      !loggedInEmail ||
      loggedInEmail !== configuredAdminEmail
    ) {
      throw new ForbiddenException(
        'Administrator access is required.',
      );
    }

    return true;
  }
}