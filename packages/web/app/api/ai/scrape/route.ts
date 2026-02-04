import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken, isTokenInvalidated } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface ScrapedShortcut {
  action: string;
  keys: {
    mac?: string;
    windows?: string;
    linux?: string;
  };
  context?: string;
  category?: string;
  tags: string[];
  confidence: number;
}

interface ScrapeResponse {
  app: {
    name: string;
    displayName: string;
    category?: string;
  };
  shortcuts: ScrapedShortcut[];
  sourceUrl: string;
  scrapedAt: string;
}

/**
 * POST /api/ai/scrape
 * Use AI to search the web for keyboard shortcuts for an app
 * Rate limited to 5 scrapes per day for free users
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    const token = extractToken(authHeader);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required for AI scraping' },
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
    
    // Get user to check tier
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check rate limit for free users
    if (user.tier === 'free') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const usageCount = await prisma.aiUsage.count({
        where: {
          userId: payload.userId,
          timestamp: {
            gte: today,
          },
        },
      });
      
      if (usageCount >= 5) {
        return NextResponse.json(
          { 
            error: 'Daily AI scrape limit reached. Free users are limited to 5 AI scrapes per day. Upgrade to Pro for unlimited scrapes.',
            limit: 5,
            used: usageCount,
          },
          { status: 429 }
        );
      }
    }
    
    // Parse request body
    const body = await request.json();
    const { appName, context } = body;
    
    if (!appName || typeof appName !== 'string') {
      return NextResponse.json(
        { error: 'appName is required and must be a string' },
        { status: 400 }
      );
    }
    
    // Validate app name (basic sanitation)
    const cleanAppName = appName.trim();
    if (cleanAppName.length === 0 || cleanAppName.length > 100) {
      return NextResponse.json(
        { error: 'appName must be between 1 and 100 characters' },
        { status: 400 }
      );
    }
    
    // Check AI configuration
    const aiProvider = process.env.AI_PROVIDER;
    const aiApiKey = process.env.AI_API_KEY;
    
    if (!aiProvider || !aiApiKey) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact support.' },
        { status: 503 }
      );
    }
    
    // Call AI to scrape web for shortcuts
    const scrapeResult = await scrapeShortcutsWithAI(cleanAppName, context, {
      provider: aiProvider as any,
      apiKey: aiApiKey,
      model: process.env.AI_MODEL,
      baseUrl: process.env.AI_BASE_URL,
      timeout: parseInt(process.env.AI_TIMEOUT || '30000'),
    });
    
    // Log AI usage for rate limiting
    await prisma.aiUsage.create({
      data: {
        userId: payload.userId,
        query: `scrape:${cleanAppName}`,
      },
    });
    
    return NextResponse.json(scrapeResult);
  } catch (error) {
    console.error('AI scraping error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('API key') || errorMessage.includes('provider')) {
      return NextResponse.json(
        { error: 'AI service unavailable. Please try again later.' },
        { status: 503 }
      );
    }
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      return NextResponse.json(
        { error: 'AI service rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    if (errorMessage.includes('No shortcuts found')) {
      return NextResponse.json(
        { error: `Could not find keyboard shortcuts for "${errorMessage.split('"')[1] || 'this app'}". Try a different app name or check the official documentation.` },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to scrape shortcuts. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * Use AI to search the web and extract keyboard shortcuts
 */
async function scrapeShortcutsWithAI(
  appName: string,
  context: string | undefined,
  config: {
    provider: 'openai' | 'anthropic' | 'openrouter' | 'ollama';
    apiKey: string;
    model?: string;
    baseUrl?: string;
    timeout: number;
  }
): Promise<ScrapeResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);
  
  try {
    const prompt = buildScrapePrompt(appName, context);
    const response = await callAIProvider(prompt, config, controller.signal);
    
    // Parse and validate response
    const result = parseAIResponse(response);
    
    if (!result.shortcuts || result.shortcuts.length === 0) {
      throw new Error(`No shortcuts found for "${appName}"`);
    }
    
    return {
      app: result.app || {
        name: appName.toLowerCase().replace(/\s+/g, '-'),
        displayName: appName,
        category: result.category,
      },
      shortcuts: result.shortcuts,
      sourceUrl: result.sourceUrl || `https://www.google.com/search?q=${encodeURIComponent(appName + ' keyboard shortcuts')}`,
      scrapedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Build prompt for AI to scrape shortcuts
 */
function buildScrapePrompt(appName: string, context?: string): string {
  return `You are a keyboard shortcut expert. Search your knowledge for official keyboard shortcuts for the application "${appName}"${context ? ` (context: ${context})` : ''}.

Extract keyboard shortcuts from official documentation or reliable sources. For each shortcut, provide:
1. action: What the shortcut does (e.g., "Copy", "Paste", "Save file")
2. keys: Keyboard combination for different platforms (mac, windows, linux)
3. context: Where the shortcut applies (e.g., "Normal Mode", "Editor", optional)
4. category: Group shortcuts by category (e.g., "Editing", "Navigation", "File Management")
5. tags: Array of searchable keywords
6. confidence: Your confidence level (0.0 to 1.0) that this is accurate

Return ONLY a valid JSON object in this exact format:
{
  "app": {
    "name": "${appName.toLowerCase().replace(/\s+/g, '-')}",
    "displayName": "${appName}",
    "category": "Category like Text Editor, Terminal, Browser, IDE, etc."
  },
  "shortcuts": [
    {
      "action": "Description of action",
      "keys": {
        "mac": "Cmd+C",
        "windows": "Ctrl+C",
        "linux": "Ctrl+C"
      },
      "context": "Optional context",
      "category": "Category name",
      "tags": ["tag1", "tag2"],
      "confidence": 0.95
    }
  ],
  "sourceUrl": "URL of official documentation or source",
  "category": "Application category"
}

IMPORTANT:
- Only include shortcuts you are highly confident about (confidence >= 0.7)
- Use standard key notation: Cmd/Ctrl/Alt/Shift + letter/symbol
- If a shortcut is the same across platforms, include it for all platforms
- If you don't know a platform's shortcut, omit that platform from keys
- Provide at least 10-20 common shortcuts if available
- Focus on the most useful and commonly used shortcuts
- If you cannot find any shortcuts for this application, return an error in the "error" field

Return ONLY valid JSON, no markdown formatting or explanations.`;
}

/**
 * Call AI provider
 */
async function callAIProvider(
  prompt: string,
  config: {
    provider: 'openai' | 'anthropic' | 'openrouter' | 'ollama';
    apiKey: string;
    model?: string;
    baseUrl?: string;
  },
  signal: AbortSignal
): Promise<string> {
  switch (config.provider) {
    case 'openai':
      return await callOpenAI(prompt, config, signal);
    case 'anthropic':
      return await callAnthropic(prompt, config, signal);
    case 'openrouter':
      return await callOpenRouter(prompt, config, signal);
    case 'ollama':
      return await callOllama(prompt, config, signal);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

async function callOpenAI(
  prompt: string,
  config: { apiKey: string; model?: string; baseUrl?: string },
  signal: AbortSignal
): Promise<string> {
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  const model = config.model || 'gpt-4-turbo';
  
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that knows about keyboard shortcuts for various applications. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    }),
    signal,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${response.status} ${errorData.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function callAnthropic(
  prompt: string,
  config: { apiKey: string; model?: string; baseUrl?: string },
  signal: AbortSignal
): Promise<string> {
  const baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
  const model = config.model || 'claude-3-sonnet-20240229';
  
  const response = await fetch(`${baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      messages: [
        { role: 'user', content: prompt },
      ],
    }),
    signal,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Anthropic API error: ${response.status} ${errorData.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  return data.content[0]?.text || '';
}

async function callOpenRouter(
  prompt: string,
  config: { apiKey: string; model?: string; baseUrl?: string },
  signal: AbortSignal
): Promise<string> {
  const baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
  const model = config.model || 'openai/gpt-4-turbo';
  
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'HTTP-Referer': 'https://katasumi.dev',
      'X-Title': 'Katasumi',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that knows about keyboard shortcuts for various applications. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    }),
    signal,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter API error: ${response.status} ${errorData.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function callOllama(
  prompt: string,
  config: { model?: string; baseUrl?: string },
  signal: AbortSignal
): Promise<string> {
  const baseUrl = config.baseUrl || 'http://localhost:11434';
  const model = config.model || 'llama2';
  
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
    signal,
  });
  
  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.response || '';
}

/**
 * Parse AI response and validate structure
 */
function parseAIResponse(content: string): any {
  // Try to extract JSON from the response (in case AI adds markdown formatting)
  let jsonStr = content.trim();
  
  // Remove markdown code blocks if present
  if (jsonStr.startsWith('```')) {
    const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      jsonStr = match[1].trim();
    }
  }
  
  try {
    const parsed = JSON.parse(jsonStr);
    
    // Validate structure
    if (parsed.error) {
      throw new Error(parsed.error);
    }
    
    if (!parsed.shortcuts || !Array.isArray(parsed.shortcuts)) {
      throw new Error('Invalid response: missing shortcuts array');
    }
    
    // Validate each shortcut
    parsed.shortcuts = parsed.shortcuts.filter((s: any) => {
      return s.action && s.keys && typeof s.action === 'string';
    });
    
    return parsed;
  } catch (error) {
    console.error('Failed to parse AI response:', content);
    throw new Error(`Failed to parse AI response: ${error}`);
  }
}
