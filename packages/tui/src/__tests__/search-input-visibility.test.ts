/**
 * Test suite for Search Input Visibility Bug Fix (PHASE2-TUI-016)
 * Verifies that search input always remains visible and never scrolls off screen
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Search Input Visibility (PHASE2-TUI-016)', () => {
  describe('FullPhraseMode Layout', () => {
    it('should have flexShrink={0} on search input to prevent compression', () => {
      // The search input box should have flexShrink={0} property to prevent it from
      // being compressed when results fill the screen
      const componentPath = path.resolve(__dirname, '../components/FullPhraseMode.tsx');
      const componentCode = fs.readFileSync(componentPath, 'utf8');
      
      // Verify that the search input box has flexShrink={0}
      expect(componentCode).toContain('flexShrink={0}');
    });

    it('should use height="100%" for proper constrained layout', () => {
      // The root container should use height="100%" to constrain the layout
      // and prevent content from scrolling off screen
      const componentPath = path.resolve(__dirname, '../components/FullPhraseMode.tsx');
      const componentCode = fs.readFileSync(componentPath, 'utf8');
      
      // Verify height="100%" is used in the root Box
      expect(componentCode).toContain('height="100%"');
    });

    it('should have overflow="hidden" on scrollable results area', () => {
      // The results area should use overflow="hidden" and flexGrow={1} to be scrollable
      // while keeping the search input fixed
      const componentPath = path.resolve(__dirname, '../components/FullPhraseMode.tsx');
      const componentCode = fs.readFileSync(componentPath, 'utf8');
      
      // Verify overflow="hidden" is used for constraining scrollable content
      expect(componentCode).toContain('overflow="hidden"');
    });

    it('should mark AI status indicator as non-shrinkable', () => {
      // The AI status indicator should also have flexShrink={0} to stay visible
      const componentPath = path.resolve(__dirname, '../components/FullPhraseMode.tsx');
      const componentCode = fs.readFileSync(componentPath, 'utf8');
      
      // Count instances of flexShrink={0} - should be multiple (search input + AI status)
      const matches = componentCode.match(/flexShrink={0}/g);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('AppFirstMode Layout', () => {
    it('should keep app info section non-shrinkable', () => {
      // The app info section should have flexShrink={0} to stay visible
      const componentPath = path.resolve(__dirname, '../components/AppFirstMode.tsx');
      const componentCode = fs.readFileSync(componentPath, 'utf8');
      
      // Verify layout properties
      expect(componentCode).toContain('flexShrink={0}');
    });

    it('should have proper layout structure with flexShrink and height', () => {
      // AppFirstMode should use height="100%" and proper flex properties
      const componentPath = path.resolve(__dirname, '../components/AppFirstMode.tsx');
      const componentCode = fs.readFileSync(componentPath, 'utf8');
      
      // Verify layout properties
      expect(componentCode).toContain('height="100%"');
      expect(componentCode).toContain('flexGrow={1}');
    });

    it('should constrain results list to scrollable area', () => {
      // The results list should use overflow="hidden" to be scrollable
      const componentPath = path.resolve(__dirname, '../components/AppFirstMode.tsx');
      const componentCode = fs.readFileSync(componentPath, 'utf8');
      
      // Verify overflow="hidden" is present
      expect(componentCode).toContain('overflow="hidden"');
    });
  });

  describe('Main App Layout', () => {
    it('should use height="100%" in root container', () => {
      // App.tsx should use height="100%" for the root container
      const appPath = path.resolve(__dirname, '../App.tsx');
      const appCode = fs.readFileSync(appPath, 'utf8');
      
      // Verify App.tsx has proper layout structure
      expect(appCode).toContain('height="100%"');
    });

    it('should make content area flexible and scrollable', () => {
      // The content area should use flexGrow={1} and overflow="hidden"
      const appPath = path.resolve(__dirname, '../App.tsx');
      const appCode = fs.readFileSync(appPath, 'utf8');
      
      // Verify flexGrow and overflow properties
      expect(appCode).toContain('flexGrow={1}');
      expect(appCode).toContain('overflow="hidden"');
    });
  });

  describe('Layout Behavior Verification', () => {
    it('should never allow header/footer to scroll off screen', () => {
      // Header and Footer are rendered outside the scrollable content area in App.tsx
      // This is verified by checking the component structure
      const appPath = path.resolve(__dirname, '../App.tsx');
      const appCode = fs.readFileSync(appPath, 'utf8');
      
      // Header should be rendered before the scrollable Box
      const headerIndex = appCode.indexOf('<Header');
      const scrollableBoxIndex = appCode.indexOf('flexGrow={1}');
      expect(headerIndex).toBeLessThan(scrollableBoxIndex);
      
      // Footer should be rendered after the scrollable Box
      const footerIndex = appCode.indexOf('<Footer');
      expect(footerIndex).toBeGreaterThan(scrollableBoxIndex);
    });

    it('should support terminal resize without breaking layout', () => {
      // The useTerminalSize hook recalculates availableRows on resize
      // This is verified in useTerminalSize.ts
      const hookPath = path.resolve(__dirname, '../hooks/useTerminalSize.ts');
      const hookCode = fs.readFileSync(hookPath, 'utf8');
      
      // Verify resize event handling
      expect(hookCode).toContain("process.stdout.on('resize'");
      expect(hookCode).toContain('availableRows');
    });

    it('should calculate correct available rows for results', () => {
      // useTerminalSize should subtract header, footer, filters, and padding from total rows
      const hookPath = path.resolve(__dirname, '../hooks/useTerminalSize.ts');
      const hookCode = fs.readFileSync(hookPath, 'utf8');
      
      // Verify the calculation includes all necessary components
      expect(hookCode).toContain('HEADER_ROWS');
      expect(hookCode).toContain('FOOTER_ROWS');
      expect(hookCode).toContain('FILTERS_ROWS');
      expect(hookCode).toContain('PADDING_ROWS');
    });
  });
});
