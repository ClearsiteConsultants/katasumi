import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken, hashPassword, comparePassword, extractToken } from '../lib/auth';

describe('Auth utilities', () => {
  it('should generate and verify JWT token', () => {
    const token = generateToken('user-123', 'test@example.com');
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    
    const payload = verifyToken(token);
    expect(payload).toBeTruthy();
    expect(payload?.userId).toBe('user-123');
    expect(payload?.email).toBe('test@example.com');
  });
  
  it('should reject invalid token', () => {
    const payload = verifyToken('invalid-token');
    expect(payload).toBeNull();
  });
  
  it('should hash and compare passwords', async () => {
    const password = 'test-password-123';
    const hash = await hashPassword(password);
    
    expect(hash).toBeTruthy();
    expect(hash).not.toBe(password);
    
    const isValid = await comparePassword(password, hash);
    expect(isValid).toBe(true);
    
    const isInvalid = await comparePassword('wrong-password', hash);
    expect(isInvalid).toBe(false);
  });
  
  it('should extract token from Authorization header', () => {
    const token = extractToken('Bearer abc123');
    expect(token).toBe('abc123');
    
    const noToken = extractToken(null);
    expect(noToken).toBeNull();
    
    const invalidFormat = extractToken('abc123');
    expect(invalidFormat).toBeNull();
  });
});
