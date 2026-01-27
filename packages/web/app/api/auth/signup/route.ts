import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/db';
import { generateToken } from '@/lib/auth';

/**
 * POST /api/auth/signup
 * Create a new user account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }
    
    // Create user
    const user = await createUser(email, password);
    
    // Generate token
    const token = generateToken(user.id, user.email);
    
    return NextResponse.json(
      {
        message: 'User created successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          tier: user.tier,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'User already exists') {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }
    
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
