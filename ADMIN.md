# Katasumi Admin Guide

This guide documents administrative procedures for managing Katasumi users, including manual user provisioning until payment integration is implemented.

## Table of Contents

- [User Provisioning](#user-provisioning)
- [Premium User Management](#premium-user-management)
- [Trial Accounts](#trial-accounts)
- [User Upgrades](#user-upgrades)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

---

## User Provisioning

### Overview

Until the payment integration is implemented, premium users must be provisioned manually through direct database access. Only administrators with database access should perform these operations.

### Prerequisites

- PostgreSQL database access
- `psql` command-line tool or database GUI (e.g., pgAdmin, DBeaver)
- Database connection string (available in `.env` file as `DATABASE_URL`)

### Database Connection

```bash
# Using psql with DATABASE_URL from environment
psql $DATABASE_URL

# Or connect directly
psql -h localhost -U postgres -d katasumi
```

---

## Premium User Management

### Creating a New Premium User

Use this SQL script to create a new premium user with a 1-year subscription:

```sql
-- Create new premium user
-- Note: Password hash should be generated using bcrypt with cost factor 10+
INSERT INTO users (
  id,
  email,
  password_hash,
  tier,
  subscription_status,
  subscription_expires_at,
  ai_key_mode,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'user@example.com',                    -- Replace with actual email
  '$2b$10$...',                           -- Replace with bcrypt hash
  'pro',
  'premium',
  NOW() + INTERVAL '1 year',
  'builtin',                              -- Premium users get built-in AI
  NOW(),
  NOW()
);
```

### Generating Password Hash

To generate a bcrypt password hash, you can use:

**Node.js:**
```javascript
// Using bcrypt package
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('password123', 10);
console.log(hash);
```

**Python:**
```python
# Using bcrypt package
import bcrypt
password = b"password123"
hash = bcrypt.hashpw(password, bcrypt.gensalt(rounds=10))
print(hash.decode('utf-8'))
```

**Online (for testing only):**
Use https://bcrypt-generator.com/ with cost factor 10.

---

## Trial Accounts

### Creating a 30-Day Trial User

Create a premium user with a 30-day trial period:

```sql
-- Create trial user (30 days)
INSERT INTO users (
  id,
  email,
  password_hash,
  tier,
  subscription_status,
  subscription_expires_at,
  ai_key_mode,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'trial@example.com',
  '$2b$10$...',
  'pro',
  'premium',
  NOW() + INTERVAL '30 days',            -- 30-day trial
  'builtin',
  NOW(),
  NOW()
);
```

### Custom Trial Periods

For custom trial durations, modify the `INTERVAL` clause:

```sql
-- 7-day trial
subscription_expires_at = NOW() + INTERVAL '7 days'

-- 90-day trial
subscription_expires_at = NOW() + INTERVAL '90 days'

-- Specific end date
subscription_expires_at = '2026-03-15 23:59:59'
```

---

## User Upgrades

### Upgrading Existing Free User to Premium

To upgrade an existing free user to premium:

```sql
-- Upgrade user to premium (1 year)
UPDATE users 
SET 
  tier = 'pro',
  subscription_status = 'premium',
  subscription_expires_at = NOW() + INTERVAL '1 year',
  ai_key_mode = 'builtin',
  updated_at = NOW()
WHERE email = 'user@example.com';
```

### Downgrading Premium User to Free

To downgrade a premium user back to free tier:

```sql
-- Downgrade user to free
UPDATE users 
SET 
  tier = 'free',
  subscription_status = 'free',
  subscription_expires_at = NULL,
  ai_key_mode = 'personal',
  updated_at = NOW()
WHERE email = 'user@example.com';
```

### Extending Subscription

To extend an existing premium subscription:

```sql
-- Extend subscription by 1 year from current expiration
UPDATE users 
SET 
  subscription_expires_at = subscription_expires_at + INTERVAL '1 year',
  updated_at = NOW()
WHERE email = 'user@example.com';

-- Extend subscription by 1 year from today
UPDATE users 
SET 
  subscription_expires_at = NOW() + INTERVAL '1 year',
  updated_at = NOW()
WHERE email = 'user@example.com';
```

---

## Subscription Expiration Management

### Checking Expired Subscriptions

```sql
-- List all expired premium subscriptions
SELECT 
  id,
  email,
  subscription_status,
  subscription_expires_at,
  tier
FROM users
WHERE 
  subscription_status = 'premium' 
  AND subscription_expires_at < NOW()
ORDER BY subscription_expires_at DESC;
```

### Manual Expiration Processing

To manually expire subscriptions (normally handled by automated job):

```sql
-- Downgrade expired premium subscriptions to free
UPDATE users 
SET 
  subscription_status = 'free',
  tier = 'free',
  ai_key_mode = 'personal',
  updated_at = NOW()
WHERE 
  subscription_expires_at < NOW() 
  AND subscription_status = 'premium';
```

### Automated Expiration (Cron Job)

For production, set up a cron job to automatically expire subscriptions:

```sql
-- This query should run daily via cron
UPDATE users 
SET 
  subscription_status = 'free',
  tier = 'free',
  ai_key_mode = 'personal',
  updated_at = NOW()
WHERE 
  subscription_expires_at < NOW() 
  AND subscription_status IN ('premium', 'enterprise');
```

**Example cron configuration:**
```bash
# Run daily at 2 AM
0 2 * * * psql $DATABASE_URL -c "UPDATE users SET subscription_status = 'free', tier = 'free', ai_key_mode = 'personal', updated_at = NOW() WHERE subscription_expires_at < NOW() AND subscription_status = 'premium';"
```

---

## Verification Steps

### Verify Premium User Creation

After creating a premium user, verify the setup:

```sql
-- Check user details
SELECT 
  id,
  email,
  tier,
  subscription_status,
  subscription_expires_at,
  ai_key_mode,
  created_at
FROM users 
WHERE email = 'user@example.com';
```

Expected output:
- `tier`: `'pro'`
- `subscription_status`: `'premium'`
- `subscription_expires_at`: Future date (1 year from creation)
- `ai_key_mode`: `'builtin'`

### Testing Premium Features

1. **Login Test**: Log in with the created credentials via the web interface
2. **Sync Test**: Use the TUI to sync shortcuts (should succeed without 403 errors)
3. **AI Test**: Use AI-powered search in TUI (should work with built-in AI key)
4. **API Test**: Test sync endpoints with the user's API token

```bash
# Test sync endpoint (replace TOKEN with actual user API token)
curl -H "Authorization: Bearer TOKEN" \
     https://katasumi.app/api/sync/shortcuts
```

---

## Security Considerations

### Access Control

⚠️ **IMPORTANT**: Only administrators with database access can provision premium accounts.

- Use strong, randomly generated passwords for admin accounts
- Never commit database credentials to version control
- Use environment variables for database connection strings
- Rotate database passwords regularly
- Audit database access logs periodically

### Password Security

- Always use bcrypt with cost factor 10 or higher
- Never store plaintext passwords
- Generate strong random passwords for initial user setup
- Enforce password reset on first login (implement in future)

### Audit Trail

For accountability, consider logging manual user provisioning:

```sql
-- Create an admin_logs table (optional)
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  target_user_email VARCHAR(255) NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Log manual provisioning
INSERT INTO admin_logs (admin_email, action, target_user_email, details)
VALUES (
  'admin@katasumi.app',
  'create_premium_user',
  'newuser@example.com',
  '{"subscription_days": 365, "reason": "early adopter"}'::jsonb
);
```

---

## Troubleshooting

### User Cannot Login

1. Verify password hash is correct format (starts with `$2b$10$` or similar)
2. Check email is unique (no duplicate entries)
3. Verify user exists in database

```sql
SELECT * FROM users WHERE email = 'user@example.com';
```

### Premium Features Not Working

1. Verify `subscription_status = 'premium'` and `tier = 'pro'`
2. Check `subscription_expires_at` is in the future
3. Verify `ai_key_mode = 'builtin'` for built-in AI access
4. Check API token is set correctly

```sql
UPDATE users 
SET ai_key_mode = 'builtin' 
WHERE email = 'user@example.com' AND subscription_status = 'premium';
```

### Subscription Expired Unexpectedly

Check the `subscription_expires_at` date:

```sql
SELECT 
  email, 
  subscription_expires_at, 
  subscription_status,
  NOW() as current_time
FROM users 
WHERE email = 'user@example.com';
```

To fix, extend the subscription:

```sql
UPDATE users 
SET subscription_expires_at = NOW() + INTERVAL '1 year',
    subscription_status = 'premium',
    tier = 'pro'
WHERE email = 'user@example.com';
```

---

## Quick Reference

### Common SQL Queries

```sql
-- List all premium users
SELECT email, subscription_status, subscription_expires_at 
FROM users 
WHERE subscription_status = 'premium'
ORDER BY subscription_expires_at DESC;

-- Count users by tier
SELECT tier, COUNT(*) 
FROM users 
GROUP BY tier;

-- Find users expiring soon (within 30 days)
SELECT email, subscription_expires_at 
FROM users 
WHERE subscription_expires_at BETWEEN NOW() AND NOW() + INTERVAL '30 days'
  AND subscription_status = 'premium'
ORDER BY subscription_expires_at ASC;

-- Reset user password
UPDATE users 
SET password_hash = '$2b$10$...', 
    updated_at = NOW()
WHERE email = 'user@example.com';
```

---

## Future Enhancements

This manual provisioning process is temporary. Future improvements will include:

- [ ] Stripe payment integration for automated billing
- [ ] Self-service subscription management portal
- [ ] Automated trial creation flow
- [ ] Email notifications for subscription events
- [ ] Admin dashboard for user management
- [ ] Webhook handlers for payment events
- [ ] Subscription analytics and reporting

---

## Support

For questions or issues with user provisioning:

1. Check the troubleshooting section above
2. Review Prisma schema in `packages/web/prisma/schema.prisma`
3. Check application logs for sync/auth errors
4. Contact the development team

---

**Last Updated**: 2026-02-08  
**Version**: 1.0 (Manual Provisioning Phase)
