/**
 * Platform types supported by Katasumi
 */
export type Platform = 'mac' | 'windows' | 'linux';

/**
 * Source type indicating where the shortcut data originated
 */
export enum SourceType {
  OFFICIAL = 'official',
  COMMUNITY = 'community',
  AI_SCRAPED = 'ai-scraped',
  USER_ADDED = 'user-added'
}

/**
 * Keyboard shortcut keys for different platforms
 */
export interface Keys {
  /** macOS keyboard shortcut (e.g., "Cmd+C") */
  mac?: string;
  /** Windows keyboard shortcut (e.g., "Ctrl+C") */
  windows?: string;
  /** Linux keyboard shortcut (e.g., "Ctrl+C") */
  linux?: string;
}

/**
 * Source metadata for a shortcut
 */
export interface Source {
  /** Type of source */
  type: SourceType;
  /** URL where the shortcut was found */
  url: string;
  /** Timestamp when the shortcut was scraped */
  scrapedAt: Date;
  /** Confidence score (0-1) for AI-scraped shortcuts */
  confidence: number;
}

/**
 * Keyboard shortcut definition
 */
export interface Shortcut {
  /** Unique identifier for the shortcut */
  id: string;
  /** Application identifier */
  app: string;
  /** Action description (e.g., "Copy", "Paste") */
  action: string;
  /** Platform-specific keyboard shortcuts */
  keys: Keys;
  /** Context where the shortcut applies (e.g., "Editor", "Global") */
  context?: string;
  /** Category grouping (e.g., "Editing", "Navigation") */
  category?: string;
  /** Searchable tags */
  tags: string[];
  /** Source metadata */
  source?: Source;
}

/**
 * Application information
 */
export interface AppInfo {
  /** Unique identifier for the application */
  id: string;
  /** Application name (e.g., "vscode") */
  name: string;
  /** Display name (e.g., "Visual Studio Code") */
  displayName: string;
  /** Application category (e.g., "Code Editor") */
  category: string;
  /** Supported platforms */
  platforms: Platform[];
  /** Total number of shortcuts available */
  shortcutCount: number;
}
