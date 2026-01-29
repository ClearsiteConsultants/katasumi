import { NextRequest, NextResponse } from 'next/server';
import { AISearchEngine } from '@katasumi/core/dist/ai-search-engine';
import type { AIProvider } from '@katasumi/core/dist/ai-search-engine';

/**
 * POST /api/ai/test
 * Test AI provider connection
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, model, baseUrl } = body;

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      );
    }

    // Validate API key for non-Ollama providers
    if (provider !== 'ollama' && !apiKey) {
      return NextResponse.json(
        { error: 'API key is required for this provider' },
        { status: 400 }
      );
    }

    // Create a minimal test to verify the provider is accessible
    const config = {
      provider: provider as AIProvider,
      apiKey,
      model,
      baseUrl,
      timeout: 10000, // 10s timeout for test
    };

    // For Ollama, just check if the endpoint is reachable
    if (provider === 'ollama') {
      const url = baseUrl || 'http://localhost:11434';
      try {
        const response = await fetch(`${url}/api/tags`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        
        if (!response.ok) {
          return NextResponse.json(
            { error: 'Ollama service not reachable. Make sure Ollama is running.' },
            { status: 503 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Ollama connection successful',
        });
      } catch (error) {
        return NextResponse.json(
          { error: 'Could not connect to Ollama. Make sure it is running at ' + url },
          { status: 503 }
        );
      }
    }

    // For cloud providers, make a minimal test request
    try {
      let testUrl = '';
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      let testBody: any = {};

      switch (provider) {
        case 'openai': {
          const base = baseUrl || 'https://api.openai.com/v1';
          testUrl = `${base}/models`;
          headers['Authorization'] = `Bearer ${apiKey}`;
          const response = await fetch(testUrl, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(5000),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return NextResponse.json(
              { error: error.error?.message || `OpenAI API error: ${response.status}` },
              { status: response.status }
            );
          }
          break;
        }

        case 'anthropic': {
          const base = baseUrl || 'https://api.anthropic.com/v1';
          testUrl = `${base}/messages`;
          headers['x-api-key'] = apiKey;
          headers['anthropic-version'] = '2023-06-01';
          testBody = {
            model: model || 'claude-3-sonnet-20240229',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }],
          };

          const response = await fetch(testUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(testBody),
            signal: AbortSignal.timeout(10000),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return NextResponse.json(
              { error: error.error?.message || `Anthropic API error: ${response.status}` },
              { status: response.status }
            );
          }
          break;
        }

        case 'openrouter': {
          const base = baseUrl || 'https://openrouter.ai/api/v1';
          testUrl = `${base}/models`;
          headers['Authorization'] = `Bearer ${apiKey}`;
          const response = await fetch(testUrl, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(5000),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return NextResponse.json(
              { error: error.error?.message || `OpenRouter API error: ${response.status}` },
              { status: response.status }
            );
          }
          break;
        }

        default:
          return NextResponse.json(
            { error: 'Unsupported provider' },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        message: 'Connection successful',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { error: `Connection failed: ${errorMessage}` },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}
