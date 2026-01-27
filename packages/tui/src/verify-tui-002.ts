#!/usr/bin/env node
/**
 * Verification script for PHASE2-TUI-002 - App-First Mode
 * Tests all acceptance criteria for the App-First mode implementation
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const tuiDir = join(__dirname, '..');

console.log('🧪 PHASE2-TUI-002 Verification: App-First Mode\n');

let allPassed = true;
const results: Array<{ criterion: string; passed: boolean; message?: string }> = [];

function test(criterion: string, testFn: () => boolean, message?: string) {
  try {
    const passed = testFn();
    results.push({ criterion, passed, message: passed ? undefined : message });
    if (!passed) allPassed = false;
    console.log(passed ? '✅' : '❌', criterion);
    if (message && !passed) {
      console.log('   ', message);
    }
  } catch (error) {
    results.push({ criterion, passed: false, message: String(error) });
    allPassed = false;
    console.log('❌', criterion);
    console.log('   ', error);
  }
}

// Criterion 1: AppSelector component exists
test('AppSelector component exists', () => {
  const componentsDir = join(tuiDir, 'src', 'components');
  return existsSync(join(componentsDir, 'AppSelector.tsx'));
}, 'AppSelector.tsx should exist in components directory');

// Criterion 2: AppSelector shows autocomplete list
test('AppSelector implements autocomplete', () => {
  const content = execSync('cat src/components/AppSelector.tsx', { cwd: tuiDir, encoding: 'utf-8' });
  return content.includes('fuzzyMatch') || content.includes('filter');
}, 'AppSelector should implement fuzzy matching or filtering');

// Criterion 3: AppSelector handles keyboard navigation
test('AppSelector handles arrow keys', () => {
  const content = execSync('cat src/components/AppSelector.tsx', { cwd: tuiDir, encoding: 'utf-8' });
  return content.includes('upArrow') && content.includes('downArrow') && content.includes('return');
}, 'AppSelector should handle arrow keys and Enter');

// Criterion 4: FiltersBar component exists
test('FiltersBar component exists', () => {
  const componentsDir = join(tuiDir, 'src', 'components');
  return existsSync(join(componentsDir, 'FiltersBar.tsx'));
}, 'FiltersBar.tsx should exist in components directory');

// Criterion 5: FiltersBar shows Context, Category, Tags
test('FiltersBar shows filter options', () => {
  const content = execSync('cat src/components/FiltersBar.tsx', { cwd: tuiDir, encoding: 'utf-8' });
  return content.includes('Context') && content.includes('Category') && content.includes('Tags');
}, 'FiltersBar should display Context, Category, and Tags filters');

// Criterion 6: FiltersBar has Quick Search input
test('FiltersBar implements Quick Search', () => {
  const content = execSync('cat src/components/FiltersBar.tsx', { cwd: tuiDir, encoding: 'utf-8' });
  return content.includes('Quick Search') || content.includes('quickSearch');
}, 'FiltersBar should have Quick Search functionality');

// Criterion 7: ResultsList component exists
test('ResultsList component exists', () => {
  const componentsDir = join(tuiDir, 'src', 'components');
  return existsSync(join(componentsDir, 'ResultsList.tsx'));
}, 'ResultsList.tsx should exist in components directory');

// Criterion 8: ResultsList displays keys, action, context
test('ResultsList displays shortcut information', () => {
  const content = execSync('cat src/components/ResultsList.tsx', { cwd: tuiDir, encoding: 'utf-8' });
  return content.includes('keys') && content.includes('action') && content.includes('context');
}, 'ResultsList should display keys, action, and context');

// Criterion 9: F2 key handling implemented
test('F2 key returns to app selector', () => {
  const content = execSync('cat src/components/AppFirstMode.tsx', { cwd: tuiDir, encoding: 'utf-8' });
  return content.includes('f2') || content.includes('F2') || content.includes("name === 'f2'");
}, 'AppFirstMode should handle F2 key to return to app selector');

// Criterion 10: F3 key handling implemented
test('F3 key focuses filters bar', () => {
  const content = execSync('cat src/components/AppFirstMode.tsx', { cwd: tuiDir, encoding: 'utf-8' });
  return content.includes('f3') || content.includes('F3') || content.includes("name === 'f3'");
}, 'AppFirstMode should handle F3 key to focus filters bar');

// Criterion 11: Database integration for apps list
test('Database integration implemented', () => {
  const content = execSync('cat src/components/AppFirstMode.tsx', { cwd: tuiDir, encoding: 'utf-8' });
  return content.includes('getApps') && (content.includes('SQLiteAdapter') || content.includes('DatabaseAdapter'));
}, 'AppFirstMode should use DatabaseAdapter.getApps()');

// Criterion 12: Database integration for shortcuts
test('Shortcuts loaded from database', () => {
  const content = execSync('cat src/components/AppFirstMode.tsx', { cwd: tuiDir, encoding: 'utf-8' });
  return content.includes('getShortcutsByApp');
}, 'AppFirstMode should use DatabaseAdapter.getShortcutsByApp()');

// Criterion 13: Store extended with App-First state
test('Store has App-First mode state', () => {
  const content = execSync('cat src/store.ts', { cwd: tuiDir, encoding: 'utf-8' });
  return (
    content.includes('focusSection') &&
    content.includes('availableApps') &&
    content.includes('appQuery')
  );
}, 'store.ts should have focusSection, availableApps, and appQuery states');

// Criterion 14: Build compiles successfully
test('Build completes successfully', () => {
  try {
    execSync('npm run build', { cwd: tuiDir, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}, 'npm run build should complete without errors');

// Criterion 15: All new components compile
test('All new components compile to JavaScript', () => {
  const distDir = join(tuiDir, 'dist', 'components');
  return (
    existsSync(join(distDir, 'AppSelector.js')) &&
    existsSync(join(distDir, 'FiltersBar.js')) &&
    existsSync(join(distDir, 'ResultsList.js'))
  );
}, 'All new component files should compile to JavaScript');

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Results: ${results.filter(r => r.passed).length}/${results.length} tests passed\n`);

if (allPassed) {
  console.log('✅ All acceptance criteria verified successfully!\n');
  console.log('Manual verification still needed:');
  console.log('  - Run `npm start` and switch to App-First mode');
  console.log('  - Type to filter apps with fuzzy matching');
  console.log('  - Use arrow keys to navigate app list');
  console.log('  - Press Enter to select an app');
  console.log('  - Verify filters bar appears with Context/Category/Tags');
  console.log('  - Test Quick Search to filter results');
  console.log('  - Press F3 to focus filters bar');
  console.log('  - Press F2 to return to app selector');
  console.log('  - Measure filter response time (<100ms)\n');
  process.exit(0);
} else {
  console.log('❌ Some criteria failed. Please review the issues above.\n');
  process.exit(1);
}
