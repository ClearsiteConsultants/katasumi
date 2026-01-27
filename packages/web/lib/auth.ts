import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key-here';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT token for user
 */
export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
}

/**
 * Invalidated tokens store (in-memory, for production use Redis)
 */
const invalidatedTokens = new Set<string>();

/**
 * Invalidate a token
 */
export function invalidateToken(token: string): void {
  invalidatedTokens.add(token);
}

/**
 * Check if token is invalidated
 */
export function isTokenInvalidated(token: string): boolean {
  return invalidatedTokens.has(token);
}
