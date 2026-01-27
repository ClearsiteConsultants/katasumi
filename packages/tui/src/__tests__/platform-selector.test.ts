import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAppStore } from '../store.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadPlatform, savePlatform } from '../utils/config.js';

describe('Platform Selector', () => {
  const configPath = path.join(os.homedir(), '.katasumi', 'config.json');
  
  beforeEach(() => {
    // Clean up config before each test
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  });

  afterEach(() => {
    // Clean up after tests
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  });

  it('should update platform when setPlatform is called', () => {
    const store = useAppStore.getState();
    
    store.setPlatform('windows');
    expect(useAppStore.getState().platform).toBe('windows');
    
    store.setPlatform('linux');
    expect(useAppStore.getState().platform).toBe('linux');
  });

  it('should persist platform preference to config.json', () => {
    const store = useAppStore.getState();
    
    store.setPlatform('linux');
    
    // Check that config file was created
    expect(fs.existsSync(configPath)).toBe(true);
    
    // Check that platform was saved
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(config.platform).toBe('linux');
  });

  it('should load platform preference from config', () => {
    // Save a platform preference
    savePlatform('windows');
    
    // Load it back
    const loaded = loadPlatform();
    
    expect(loaded).toBe('windows');
  });

  it('should support all platform types including "all"', () => {
    const store = useAppStore.getState();
    const platforms: Array<'mac' | 'windows' | 'linux' | 'all'> = ['mac', 'windows', 'linux', 'all'];
    
    platforms.forEach((platform) => {
      store.setPlatform(platform);
      expect(useAppStore.getState().platform).toBe(platform);
    });
  });

  it('should persist "all" platform option', () => {
    const store = useAppStore.getState();
    
    store.setPlatform('all');
    
    // Check that config file was created and contains "all"
    expect(fs.existsSync(configPath)).toBe(true);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(config.platform).toBe('all');
  });
});
