// src/modules/auth/token-blacklist.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenBlacklistService {
  private readonly blacklist = new Map<string, number>(); 

  add(token: string, expiresAt: number): void {
    this.blacklist.set(token, expiresAt);
    this.cleanup();
  }

  isBlacklisted(token: string): boolean {
    return this.blacklist.has(token);
  }

  private cleanup(): void {
    const now = Math.floor(Date.now() / 1000);
    for (const [token, exp] of this.blacklist.entries()) {
      if (exp < now) this.blacklist.delete(token);
    }
  }
}