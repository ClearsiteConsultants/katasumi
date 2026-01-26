import { Shortcut, AppInfo, Platform, SourceType, Keys } from './types';

// Test 1: Create a valid Shortcut object
const testShortcut: Shortcut = {
  id: 'test-1',
  app: 'vscode',
  action: 'Copy',
  keys: {
    mac: 'Cmd+C',
    windows: 'Ctrl+C',
    linux: 'Ctrl+C'
  },
  context: 'Editor',
  category: 'Editing',
  tags: ['clipboard', 'copy'],
  source: {
    type: SourceType.OFFICIAL,
    url: 'https://code.visualstudio.com/shortcuts',
    scrapedAt: new Date(),
    confidence: 1.0
  }
};

// Test 2: Keys object with optional fields
const macOnlyKeys: Keys = {
  mac: 'Cmd+Shift+P'
};

// Test 3: Create a valid AppInfo object
const testAppInfo: AppInfo = {
  id: 'vscode',
  name: 'vscode',
  displayName: 'Visual Studio Code',
  category: 'Code Editor',
  platforms: ['mac', 'windows', 'linux'],
  shortcutCount: 150
};

// Test 4: Platform type validation
const validPlatform: Platform = 'mac';
// This should cause a TypeScript error if uncommented:
// const invalidPlatform: Platform = 'ios';

// Test 5: SourceType enum usage
const officialSource = SourceType.OFFICIAL;
const communitySource = SourceType.COMMUNITY;

// All type validations passed!
export { testShortcut, testAppInfo, validPlatform, officialSource, communitySource };
