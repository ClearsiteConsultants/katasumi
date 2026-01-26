import { Shortcut, AppInfo } from '@katasumi/core';

/**
 * Web interface entry point for Katasumi keyboard shortcut search
 */
export function initWeb() {
  console.log('Katasumi Web - Keyboard Shortcut Search');
  
  // Test that we can import and use types from core
  const testShortcut: Shortcut = {
    id: 'web-test-1',
    app: 'web-app',
    action: 'Web Test Action',
    keys: {
      windows: 'Ctrl+W'
    },
    tags: ['web', 'test']
  };
  
  return testShortcut;
}

export default initWeb;
