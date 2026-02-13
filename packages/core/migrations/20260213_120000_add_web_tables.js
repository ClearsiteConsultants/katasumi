/**
 * Migration: Add web-only tables for PostgreSQL
 * Created: 2026-02-13
 */

exports.up = async function up(db, dbType = 'sqlite') {
  const isPostgres = dbType === 'postgres';

  if (!isPostgres) {
    console.log('SQLite: Web tables not required, skipping migration');
    return;
  }

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL DEFAULT '',
      tier TEXT NOT NULL DEFAULT 'free',
      subscription_status TEXT NOT NULL DEFAULT 'free',
      subscription_expires_at TIMESTAMP,
      api_token_hash TEXT,
      ai_key_mode TEXT NOT NULL DEFAULT 'personal',
      ai_provider TEXT,
      ai_api_key_encrypted TEXT,
      ai_model TEXT,
      ai_base_url TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT ''`);
  await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free'`);
  await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'free'`);
  await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP`);
  await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS api_token_hash TEXT`);
  await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_key_mode TEXT NOT NULL DEFAULT 'personal'`);
  await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_provider TEXT`);
  await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_api_key_encrypted TEXT`);
  await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_model TEXT`);
  await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_base_url TEXT`);
  await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`);
  await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`);

  await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users(email)`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS users_email_idx ON users(email)`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS users_tier_idx ON users(tier)`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS users_subscription_status_idx ON users(subscription_status)`);

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS user_shortcuts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      app TEXT NOT NULL,
      action TEXT NOT NULL,
      keys_mac TEXT,
      keys_windows TEXT,
      keys_linux TEXT,
      context TEXT,
      category TEXT,
      tags TEXT NOT NULL DEFAULT '',
      notes TEXT,
      source_type TEXT NOT NULL DEFAULT 'user-added',
      source_url TEXT,
      source_scraped_at TIMESTAMP,
      source_confidence REAL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.$executeRawUnsafe(`ALTER TABLE user_shortcuts ADD COLUMN IF NOT EXISTS tags TEXT NOT NULL DEFAULT ''`);
  await db.$executeRawUnsafe(`ALTER TABLE user_shortcuts ADD COLUMN IF NOT EXISTS notes TEXT`);
  await db.$executeRawUnsafe(`ALTER TABLE user_shortcuts ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'user-added'`);
  await db.$executeRawUnsafe(`ALTER TABLE user_shortcuts ADD COLUMN IF NOT EXISTS source_url TEXT`);
  await db.$executeRawUnsafe(`ALTER TABLE user_shortcuts ADD COLUMN IF NOT EXISTS source_scraped_at TIMESTAMP`);
  await db.$executeRawUnsafe(`ALTER TABLE user_shortcuts ADD COLUMN IF NOT EXISTS source_confidence REAL`);
  await db.$executeRawUnsafe(`ALTER TABLE user_shortcuts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`);
  await db.$executeRawUnsafe(`ALTER TABLE user_shortcuts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`);

  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS user_shortcuts_user_id_idx ON user_shortcuts(user_id)`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS user_shortcuts_app_idx ON user_shortcuts(app)`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS user_shortcuts_action_idx ON user_shortcuts(action)`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS user_shortcuts_category_idx ON user_shortcuts(category)`);

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_public BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS collections_user_id_name_key ON collections(user_id, name)`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS collections_user_id_idx ON collections(user_id)`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS collections_is_public_idx ON collections(is_public)`);

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS collection_shortcuts (
      id TEXT PRIMARY KEY,
      collection_id TEXT NOT NULL,
      shortcut_id TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
      FOREIGN KEY (shortcut_id) REFERENCES user_shortcuts(id) ON DELETE CASCADE
    )
  `);

  await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS collection_shortcuts_collection_id_shortcut_id_key ON collection_shortcuts(collection_id, shortcut_id)`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS collection_shortcuts_collection_id_idx ON collection_shortcuts(collection_id)`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS collection_shortcuts_shortcut_id_idx ON collection_shortcuts(shortcut_id)`);

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS sync_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      status TEXT NOT NULL,
      details TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.$executeRawUnsafe(`ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS operation TEXT NOT NULL DEFAULT 'push'`);
  await db.$executeRawUnsafe(`ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS details TEXT`);
  await db.$executeRawUnsafe(`ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`);

  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS sync_logs_user_id_idx ON sync_logs(user_id)`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS sync_logs_created_at_idx ON sync_logs(created_at)`);

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ai_usage (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      query TEXT NOT NULL,
      timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      tokens_used INTEGER,
      query_type TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.$executeRawUnsafe(`ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS query TEXT NOT NULL DEFAULT ''`);
  await db.$executeRawUnsafe(`ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`);
  await db.$executeRawUnsafe(`ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS tokens_used INTEGER`);
  await db.$executeRawUnsafe(`ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS query_type TEXT`);

  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS ai_usage_user_id_idx ON ai_usage(user_id)`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS ai_usage_user_id_timestamp_idx ON ai_usage(user_id, timestamp)`);

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      stripe_subscription_id TEXT,
      plan TEXT NOT NULL,
      status TEXT NOT NULL,
      current_period_start TIMESTAMP,
      current_period_end TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id)`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON subscriptions(stripe_subscription_id)`);

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS app_config (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL,
      encrypted_value TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS app_config_key_key ON app_config(key)`);

  console.log('Created/updated web-only tables for PostgreSQL');
};

exports.down = async function down(db, dbType = 'sqlite') {
  const isPostgres = dbType === 'postgres';

  if (!isPostgres) {
    console.log('SQLite: Web tables not required, skipping rollback');
    return;
  }

  await db.$executeRawUnsafe(`DROP TABLE IF EXISTS app_config`);
  await db.$executeRawUnsafe(`DROP TABLE IF EXISTS subscriptions`);
  await db.$executeRawUnsafe(`DROP TABLE IF EXISTS ai_usage`);
  await db.$executeRawUnsafe(`DROP TABLE IF EXISTS sync_logs`);
  await db.$executeRawUnsafe(`DROP TABLE IF EXISTS collection_shortcuts`);
  await db.$executeRawUnsafe(`DROP TABLE IF EXISTS collections`);
  await db.$executeRawUnsafe(`DROP TABLE IF EXISTS user_shortcuts`);
  await db.$executeRawUnsafe(`DROP TABLE IF EXISTS users`);

  console.log('Dropped web-only tables for PostgreSQL');
};
