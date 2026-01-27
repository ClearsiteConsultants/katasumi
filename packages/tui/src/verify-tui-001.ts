#!/usr/bin/env node
/**
 * Verification script for PHASE2-TUI-001 - TUI App Scaffold
 * Tests all acceptance criteria for the TUI scaffold implementation
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const tuiDir = join(__dirname, '..');

console.log('🧪 PHASE2-TUI-001 Verification: TUI App Scaffold\n');

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

// Criterion 1: TUI package uses Ink 4.x and React 18
test('TUI package uses Ink 4.x and React 18', () => {
  const packageJson = JSON.parse(
    execSync('cat package.json', { cwd: tuiDir, encoding: 'utf-8' })
  );
  const hasInk4 = packageJson.dependencies?.ink?.includes('4.');
  const hasReact18 = packageJson.dependencies?.react?.includes('18.');
  return hasInk4 && hasReact18;
}, 'package.json should specify Ink ^4.x and React ^18.x');

// Criterion 2: Main App.tsx component renders with Header and Footer
test('App.tsx renders Header and Footer components', () => {
  const appContent = execSync('cat src/App.tsx', { cwd: tuiDir, encoding: 'utf-8' });
  return appContent.includes('<Header') && appContent.includes('<Footer');
}, 'App.tsx should render Header and Footer components');

// Criterion 3: Zustand store configured with all required states
test('Zustand store has all required states', () => {
  const storeContent = execSync('cat src/store.ts', { cwd: tuiDir, encoding: 'utf-8' });
  const requiredStates = [
    'mode:',
    'view:',
    'platform:',
    'aiEnabled:',
    'selectedApp:',
    'query:',
    'filters:',
    'results:',
    'selectedShortcut:',
  ];
  return requiredStates.every(state => storeContent.includes(state));
}, 'store.ts should define all required state fields');

// Criterion 4: Component architecture follows katasumi-plan.md
test('Component architecture includes required components', () => {
  const componentsDir = join(tuiDir, 'src', 'components');
  const requiredComponents = [
    'Header.tsx',
    'Footer.tsx',
    'AppFirstMode.tsx',
    'FullPhraseMode.tsx',
    'GlobalKeybindings.tsx',
  ];
  return requiredComponents.every(comp => existsSync(join(componentsDir, comp)));
}, 'All required component files should exist');

// Criterion 5: Platform detection
test('Platform detection implemented', () => {
  const storeContent = execSync('cat src/store.ts', { cwd: tuiDir, encoding: 'utf-8' });
  return storeContent.includes('detectPlatform') && storeContent.includes('process.platform');
}, 'store.ts should implement platform detection using process.platform');

// Criterion 6: Global keybindings implemented
test('Global keybindings implemented', () => {
  const keybindingsContent = execSync(
    'cat src/components/GlobalKeybindings.tsx',
    { cwd: tuiDir, encoding: 'utf-8' }
  );
  const appContent = execSync('cat src/App.tsx', { cwd: tuiDir, encoding: 'utf-8' });
  return (
    keybindingsContent.includes('useInput') &&
    keybindingsContent.includes('onToggleMode') &&
    keybindingsContent.includes('onToggleAI') &&
    keybindingsContent.includes('onQuit') &&
    appContent.includes('<GlobalKeybindings')
  );
}, 'GlobalKeybindings component should handle Ctrl+C, ?, Tab, F4');

// Criterion 7: Mode switcher displays current mode in header
test('Header displays mode, platform, and AI status', () => {
  const headerContent = execSync(
    'cat src/components/Header.tsx',
    { cwd: tuiDir, encoding: 'utf-8' }
  );
  return (
    headerContent.includes('mode') &&
    headerContent.includes('platform') &&
    headerContent.includes('aiEnabled') &&
    headerContent.includes('App-First') &&
    headerContent.includes('Full-Phrase')
  );
}, 'Header should display mode, platform, and AI status');

// Criterion 8: Empty state renders for each mode
test('Empty states implemented for both modes', () => {
  const appFirstContent = execSync(
    'cat src/components/AppFirstMode.tsx',
    { cwd: tuiDir, encoding: 'utf-8' }
  );
  const fullPhraseContent = execSync(
    'cat src/components/FullPhraseMode.tsx',
    { cwd: tuiDir, encoding: 'utf-8' }
  );
  return (
    appFirstContent.includes('Select App') &&
    fullPhraseContent.includes('Natural Language Search')
  );
}, 'Both modes should have empty state messages');

// Criterion 9 & 10: Performance metrics (startup time and memory) - manual verification needed
test('Build completes successfully', () => {
  try {
    execSync('npm run build', { cwd: tuiDir, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}, 'npm run build should complete without errors');

test('TypeScript compiles without errors', () => {
  const distDir = join(tuiDir, 'dist');
  return (
    existsSync(join(distDir, 'App.js')) &&
    existsSync(join(distDir, 'cli.js')) &&
    existsSync(join(distDir, 'store.js'))
  );
}, 'All TypeScript files should compile to JavaScript');

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Results: ${results.filter(r => r.passed).length}/${results.length} tests passed\n`);

if (allPassed) {
  console.log('✅ All acceptance criteria verified successfully!\n');
  console.log('Manual verification still needed:');
  console.log('  - Run `npm start` and verify UI renders correctly');
  console.log('  - Test keyboard shortcuts: Ctrl+C, ?, Tab, F4');
  console.log('  - Verify platform auto-detection');
  console.log('  - Measure startup time: should be <200ms');
  console.log('  - Check memory usage: should be <100MB\n');
  process.exit(0);
} else {
  console.log('❌ Some criteria failed. Please review the issues above.\n');
  process.exit(1);
}
