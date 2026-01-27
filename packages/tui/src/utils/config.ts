import fs from 'fs';
import path from 'path';
import type { Platform } from '@katasumi/core';

export type PlatformOption = Platform | 'all';

interface Config {
  platform?: PlatformOption;
  aiEnabled?: boolean;
  mode?: 'app-first' | 'full-phrase';
}

const CONFIG_DIR = path.join(process.env.HOME || '~', '.katasumi');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

export function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): Config {
  try {
    ensureConfigDir();
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    // Return empty config on error
  }
  return {};
}

export function saveConfig(config: Partial<Config>): void {
  try {
    ensureConfigDir();
    const existingConfig = loadConfig();
    const newConfig = { ...existingConfig, ...config };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf8');
  } catch (error) {
    // Silently fail - config persistence is not critical
  }
}

export function savePlatform(platform: PlatformOption): void {
  saveConfig({ platform });
}

export function loadPlatform(): PlatformOption | undefined {
  const config = loadConfig();
  return config.platform;
}
