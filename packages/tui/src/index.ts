import { Shortcut, AppInfo } from '@katasumi/core';

/**
 * TUI entry point for Katasumi keyboard shortcut search
 */
export function main() {
  console.log('Katasumi TUI - Keyboard Shortcut Search');
  
  // Test that we can import and use types from core
  const testShortcut: Shortcut = {
    id: 'test-1',
    app: 'test-app',
    action: 'Test Action',
    keys: {
      mac: 'Cmd+T'
    },
    tags: ['test']
  };
  
  console.log('Test shortcut:', testShortcut);
}

if (require.main === module) {
  main();
}
