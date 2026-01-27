import { NextRequest, NextResponse } from 'next/server';
import { extractToken, invalidateToken, verifyToken } from '@/lib/auth';

/**
 * POST /api/auth/logout
 * Invalidate JWT token
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = extractToken(authHeader);
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 400 }
      );
    }
    
    // Verify token is valid before invalidating
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Invalidate token
    invalidateToken(token);
    
    return NextResponse.json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
