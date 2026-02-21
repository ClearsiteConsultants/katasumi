# CI/CD Pipeline Setup Guide

This guide covers setting up the complete CI/CD pipeline for Katasumi, including GitHub Actions and Vercel deployment.

## 📋 Table of Contents

- [GitHub Secrets Configuration](#github-secrets-configuration)
- [Vercel Project Setup](#vercel-project-setup)
- [CI Workflow Overview](#ci-workflow-overview)
- [Deployment Workflows](#deployment-workflows)
- [Testing the Pipeline](#testing-the-pipeline)
- [Troubleshooting](#troubleshooting)

## 🔐 GitHub Secrets Configuration

Configure these secrets in your GitHub repository settings (`Settings` → `Secrets and variables` → `Actions` → `New repository secret`):

### Required for CI/CD Testing:

1. **`DATABASE_URL`** (Production)
   - PostgreSQL connection string for production
   - Format: `postgresql://user:password@host:port/database`
   - Used by CI to test database connectivity

2. **`JWT_SECRET`**
   - Generate with: `openssl rand -base64 32`
   - Used for JWT token signing in tests

3. **`NEXTAUTH_URL`** (Production)
   - Your production domain: `https://katasumi.vercel.app`
   - Used in CI tests

### Required for NPM Publishing (TUI package):

4. **`NPM_TOKEN`**
   - Go to [npmjs.com](https://npmjs.com) → Account → Access Tokens
   - Create a new "Automation" token
   - Copy and paste into GitHub secrets

### NOT NEEDED (Vercel handles deployments automatically):

~`VERCEL_TOKEN`~, ~`VERCEL_ORG_ID`~, ~`VERCEL_PROJECT_ID`~, ~`PREVIEW_DATABASE_URL`~, ~`PREVIEW_NEXTAUTH_URL`~

**Vercel's Git integration automatically handles all deployments without needing GitHub Actions workflows or secrets.**

## 🚀 Vercel Project Setup

### 1. Initial Project Creation

1. Visit [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure the following settings:

```
Framework Preset: Next.js
Root Directory: packages/web
Build Command: cd ../.. && pnpm install && pnpm build --filter=@katasumi/web
Output Directory: .next
Install Command: cd ../.. && pnpm install
Node Version: 20.x
```

### 2. Environment Variables in Vercel Dashboard

Add these in Vercel Project Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | Your PostgreSQL URL | Production, Preview |
| `JWT_SECRET` | Your JWT secret | Production, Preview |
| `NEXTAUTH_URL` | Your domain | Production |

### 3. Git Integration Settings

- ✅ Enable "Automatically deploy from GitHub"
- ✅ Enable "Deploy Previews" for all branches
- ✅ Set Production Branch: `main`

### 4. Link Vercel CLI (Optional but Recommended)

```bash
# Install Vercel CLI globally
pnpm add -g vercel

# Link your project
cd packages/web
vercel link

# Pull environment variables locally for development
vercel env pull .env.local
```

## 🔄 CI Workflow Overview

The main CI workflow (`.github/workflows/ci.yml`) runs on every push and PR to `main` or `develop`:

### Jobs:

1. **lint-and-typecheck** - ESLint + TypeScript type checking
2. **test-core** - Unit tests for core package
3. **test-tui** - Unit tests for TUI package
4. **test-web** - Unit tests for web package (with PostgreSQL)
5. **e2e-tests** - Playwright E2E tests (with PostgreSQL)
6. **build** - Build all packages and verify artifacts
7. **all-checks-passed** - Gate that ensures all jobs passed

### Pipeline Features:

- ✅ Parallel job execution for faster feedback
- ✅ PostgreSQL service containers for database testing
- ✅ Caching of pnpm store for faster installs
- ✅ Upload test artifacts (coverage, Playwright reports)
- ✅ Fails on any check failure (prevents merge)

## 📦 Deployment Workflows

### Vercel Deployments (Automatic via Git Integration)

Vercel automatically handles all deployments through Git integration. **No GitHub Actions workflows needed!**

**Preview Deployments:**
- **Trigger**: Any pull request to `main`
- **Automatic**: Vercel builds and deploys preview automatically
- **PR Comment**: Vercel comments the preview URL on your PR
- **Database**: Configure `DATABASE_URL` in Vercel dashboard (can use same as production or separate preview DB)

**Production Deployments:**
- **Trigger**: Push to `main` branch
- **Automatic**: Vercel builds and deploys to production automatically
- **Domain**: Uses your configured production domain
- **Database**: Uses `DATABASE_URL` from Vercel environment variables

**Deployment Configuration**: See `packages/web/vercel.json` for build commands and settings.

### NPM Publishing Workflow (`publish-npm.yml`)

- **Trigger**: Git tags matching `v*.*.*` (e.g., `v1.0.0`)
- **Builds**: TUI package
- **Tests**: Runs all tests before publishing
- **Publishes**: To npm with public access
- **Creates**: GitHub release with installation instructions

## 🧪 Testing the Pipeline

### Test the CI Workflow:

```bash
# Create a feature branch
git checkout -b test-ci-pipeline

# Make a small change (e.g., add a comment)
echo "// Test change" >> packages/core/src/types.ts

# Commit and push
git add .
git commit -m "test: verify CI pipeline"
git push origin test-ci-pipeline

# Create a PR and watch the CI run in GitHub Actions tab
```

### Test Vercel Deployments:

**Preview Deployment:**
1. Create a PR with any changes
2. Vercel automatically builds and deploys
3. Check PR comments for preview URL (Vercel bot comments automatically)
4. Verify the preview deployment works

**Production Deployment:**
1. Merge PR to `main`
2. Vercel automatically deploys to production
3. Check Vercel dashboard for deployment status
4. Verify live site at your production URL

### Test NPM Publishing:

```bash
# Create a version tag
git tag v1.0.0

# Push the tag
git push origin v1.0.0

# Watch GitHub Actions tab for publish workflow
# After success, check npmjs.com for your published package
```

## 🐛 Troubleshooting

### CI Failures

#### "pnpm: command not found"
- **Cause**: pnpm not installed in CI
- **Fix**: Workflow already has `pnpm/action-setup@v2` - check version compatibility

#### "Tests failed with database connection error"
- **Cause**: PostgreSQL service not ready
- **Fix**: Workflow includes health checks - may need to increase timeout

#### "Build artifacts not found"
- **Cause**: Build failed silently
- **Fix**: Check build logs, ensure dependencies are installed

### Vercel Deployment Failures

#### "Build Command failed"
- **Cause**: Missing dependencies or build errors
- **Fix**: Verify build works locally: `cd packages/web && pnpm build`

#### "Environment variables not set"
- **Cause**: Missing Vercel environment variables
- **Fix**: Check Vercel dashboard → Settings → Environment Variables

#### "Database connection timeout"
- **Cause**: DATABASE_URL not accessible from Vercel
- **Fix**: Ensure your database allows connections from Vercel IPs (or use connection pooling)

### Common Issues

#### Cache Issues
```bash
# Clear pnpm cache locally
pnpm store prune

# In CI, cache will auto-refresh if pnpm-lock.yaml changes
```

#### Playwright Installation
```bash
# Ensure all browsers installed
pnpm --filter=@katasumi/web exec playwright install --with-deps
```

## 📊 Monitoring and Notifications

### GitHub Actions

- View all workflow runs: `Actions` tab in GitHub
- Set up status checks: `Settings` → `Branches` → `Branch protection rules`
- Require CI to pass before merge: Enable "Require status checks to pass"

### Vercel Deployments

- View all deployments: [Vercel Dashboard](https://vercel.com/dashboard)
- Set up notifications: Vercel → Project Settings → Notifications
- Monitor performance: Vercel → Project → Analytics

## 🔒 Security Best Practices

1. **Never commit secrets** - Use GitHub Secrets and Vercel Environment Variables
2. **Rotate tokens regularly** - Update VERCEL_TOKEN and JWT_SECRET periodically
3. **Use separate databases** - Different DATABASE_URL for preview and production
4. **Review PR deployments** - Check preview deployments before merging
5. **Enable branch protection** - Require PR reviews and CI to pass

## 📈 Next Steps

- [ ] Set up status badges in README.md
- [ ] Configure Dependabot for dependency updates
- [ ] Add deployment status notifications (Slack, Discord, etc.)
- [ ] Set up performance monitoring (Vercel Analytics, Sentry)
- [ ] Create staging environment for more thorough testing

## 🆘 Support

If you encounter issues not covered here:

1. Check workflow logs in GitHub Actions tab
2. Review Vercel deployment logs in dashboard
3. Consult [GitHub Actions docs](https://docs.github.com/en/actions)
4. Consult [Vercel docs](https://vercel.com/docs)
