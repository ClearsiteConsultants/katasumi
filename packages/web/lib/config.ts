import type { AIProvider } from '@katasumi/core'

export interface AIConfig {
  provider: AIProvider
  apiKey?: string
  model?: string
  baseUrl?: string
}

interface Config {
  ai?: AIConfig
}

const CONFIG_KEY = 'katasumi-config'

export function loadConfig(): Config {
  if (typeof window === 'undefined') return {}
  
  try {
    const data = localStorage.getItem(CONFIG_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Failed to load config:', error)
  }
  return {}
}

export function saveConfig(config: Partial<Config>): void {
  if (typeof window === 'undefined') return
  
  try {
    const existingConfig = loadConfig()
    const newConfig = { ...existingConfig, ...config }
    localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig))
  } catch (error) {
    console.error('Failed to save config:', error)
  }
}

export function saveAIConfig(aiConfig: AIConfig): void {
  saveConfig({ ai: aiConfig })
}

export function loadAIConfig(): AIConfig | undefined {
  const config = loadConfig()
  return config.ai
}

export function isAIConfigured(): boolean {
  const aiConfig = loadAIConfig()
  if (!aiConfig) return false
  
  // Ollama doesn't require an API key
  if (aiConfig.provider === 'ollama') return true
  
  // Other providers require an API key
  return !!aiConfig.apiKey && aiConfig.apiKey.trim().length > 0
}
