/**
 * Migration: Add OAuth provider fields to users table
 * Created: 2026-03-15
 *
 * Changes:
 * - Makes password_hash nullable (OAuth users have no password)
 * - Adds oauth_provider column ('google' | 'github')
 * - Adds oauth_id column (provider's user ID)
 */

exports.up = async function up(db, dbType = 'sqlite') {
  if (dbType !== 'postgres') {
    console.log('SQLite: OAuth fields not applicable, skipping migration');
    return;
  }

  // Make password_hash nullable for OAuth users
  await db.$executeRawUnsafe(`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`);

  // Add OAuth provider columns
  await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider TEXT`);
  await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id TEXT`);

  // Index for efficient OAuth lookups
  await db.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS users_oauth_idx ON users(oauth_provider, oauth_id)`
  );

  console.log('Migration 20260315_120000_add_oauth_fields: done');
};

exports.down = async function down(db, dbType = 'sqlite') {
  if (dbType !== 'postgres') return;

  await db.$executeRawUnsafe(`DROP INDEX IF EXISTS users_oauth_idx`);
  await db.$executeRawUnsafe(`ALTER TABLE users DROP COLUMN IF EXISTS oauth_id`);
  await db.$executeRawUnsafe(`ALTER TABLE users DROP COLUMN IF EXISTS oauth_provider`);
  // Re-add NOT NULL constraint (sets empty string default to avoid breaking existing rows)
  await db.$executeRawUnsafe(`UPDATE users SET password_hash = '' WHERE password_hash IS NULL`);
  await db.$executeRawUnsafe(`ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL`);
};
