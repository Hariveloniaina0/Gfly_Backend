import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { TokenBlacklistService } from '../../../modules/auth/token-blacklist.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly tokenBlacklistService: TokenBlacklistService) {
    super();
  }

canActivate(context: ExecutionContext) {
  const request = context.switchToHttp().getRequest<Request>();
  const token = this.extractToken(request);
  
  console.log('=== JwtAuthGuard ===');
  console.log('Token reçu:', token ? token.substring(0, 20) + '...' : 'ABSENT');
  console.log('Blacklisté:', token ? this.tokenBlacklistService.isBlacklisted(token) : 'N/A');

  if (token && this.tokenBlacklistService.isBlacklisted(token)) {
    throw new UnauthorizedException('Token révoqué');
  }

  return super.canActivate(context);
}

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}