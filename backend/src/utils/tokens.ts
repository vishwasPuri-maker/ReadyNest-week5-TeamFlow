import crypto from 'crypto';
import { TokenType } from '@prisma/client';
import { prisma } from '../config/prisma';

const TTL: Record<TokenType, number> = {
  EMAIL_VERIFY: 24 * 60 * 60 * 1000, // 24h
  PASSWORD_RESET: 60 * 60 * 1000, // 1h
};

// Creates a single-use random token, invalidating any prior unused tokens of the same type.
export async function createToken(userId: string, type: TokenType): Promise<string> {
  await prisma.verificationToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = crypto.randomBytes(32).toString('hex');
  await prisma.verificationToken.create({
    data: { token, type, userId, expiresAt: new Date(Date.now() + TTL[type]) },
  });
  return token;
}

// Validates a token and marks it used. Returns the userId or null if invalid/expired.
export async function consumeToken(token: string, type: TokenType): Promise<string | null> {
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || record.type !== type || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }
  await prisma.verificationToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });
  return record.userId;
}
