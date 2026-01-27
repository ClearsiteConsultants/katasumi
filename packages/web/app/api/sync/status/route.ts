import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken, isTokenInvalidated } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/sync/status
 * Get sync status including last sync timestamp and pending changes count
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    const token = extractToken(authHeader);
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }
    
    if (isTokenInvalidated(token)) {
      return NextResponse.json(
        { error: 'Token has been invalidated' },
        { status: 401 }
      );
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Get last successful sync log
    const lastSync = await prisma.syncLog.findFirst({
      where: {
        userId: payload.userId,
        status: 'success',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Count pending changes (shortcuts modified after last sync)
    const lastSyncTime = lastSync?.createdAt || new Date(0);
    const pendingChangesCount = await prisma.userShortcut.count({
      where: {
        userId: payload.userId,
        updatedAt: {
          gt: lastSyncTime,
        },
      },
    });
    
    // Total shortcuts count
    const totalShortcuts = await prisma.userShortcut.count({
      where: {
        userId: payload.userId,
      },
    });
    
    return NextResponse.json({
      lastSyncAt: lastSync?.createdAt || null,
      pendingChanges: pendingChangesCount,
      totalShortcuts,
      syncStatus: lastSync?.status || 'never',
    });
  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
