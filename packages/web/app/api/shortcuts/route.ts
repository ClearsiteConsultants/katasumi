import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken, isTokenInvalidated } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * POST /api/shortcuts
 * Create a new user shortcut
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    const token = extractToken(authHeader);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
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
    
    // Parse request body
    const body = await request.json();
    const {
      app,
      action,
      keysMac,
      keysWindows,
      keysLinux,
      context,
      category,
      tags,
      sourceType,
      sourceUrl,
      sourceScrapedAt,
      sourceConfidence,
    } = body;
    
    // Validate required fields
    if (!app || !action) {
      return NextResponse.json(
        { error: 'app and action are required' },
        { status: 400 }
      );
    }
    
    // At least one key combination must be provided
    if (!keysMac && !keysWindows && !keysLinux) {
      return NextResponse.json(
        { error: 'At least one key combination (keysMac, keysWindows, or keysLinux) is required' },
        { status: 400 }
      );
    }
    
    // Create shortcut
    const shortcut = await prisma.userShortcut.create({
      data: {
        userId: payload.userId,
        app: app.toString(),
        action: action.toString(),
        keysMac: keysMac || null,
        keysWindows: keysWindows || null,
        keysLinux: keysLinux || null,
        context: context || null,
        category: category || null,
        tags: tags || '',
        sourceType: sourceType || 'user-added',
        sourceUrl: sourceUrl || null,
        sourceScrapedAt: sourceScrapedAt ? new Date(sourceScrapedAt) : null,
        sourceConfidence: sourceConfidence || null,
      },
    });
    
    return NextResponse.json({
      id: shortcut.id,
      message: 'Shortcut created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating shortcut:', error);
    return NextResponse.json(
      { error: 'Failed to create shortcut' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/shortcuts
 * Get user shortcuts with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    const token = extractToken(authHeader);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
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
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const app = searchParams.get('app');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    // Build where clause
    const where: any = {
      userId: payload.userId,
    };
    
    if (app) {
      where.app = app;
    }
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Get shortcuts
    const shortcuts = await prisma.userShortcut.findMany({
      where,
      orderBy: [
        { app: 'asc' },
        { category: 'asc' },
        { action: 'asc' },
      ],
    });
    
    return NextResponse.json({ shortcuts });
  } catch (error) {
    console.error('Error fetching shortcuts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shortcuts' },
      { status: 500 }
    );
  }
}
