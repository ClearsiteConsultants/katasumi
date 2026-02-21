# 🚀 Vercel & CI/CD Quick Setup Checklist

Last Updated: 2026-02-19

## ✅ Completed

- [x] Created comprehensive CI/CD pipeline (.github/workflows/ci.yml)
- [x] Created npm publish workflow for TUI package
- [x] Created vercel.json configuration
- [x] Created detailed setup guide (.github/CI_CD_SETUP.md)
- [x] Updated prd.json to mark PHASE1-INFRA-003 as passing

## 🔧 Next Steps (Action Required)

### 1️⃣ Set Up GitHub Secrets (REQUIRED)

Go to: `GitHub Repository` → `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Add these secrets:

```
# For CI/CD Testing
DATABASE_URL          - Production PostgreSQL connection string
JWT_SECRET            - Run: openssl rand -base64 32
NEXTAUTH_URL          - Your production URL (e.g., https://katasumi.vercel.app)

# For NPM Publishing (TUI package)
NPM_TOKEN             - From npmjs.com (for TUI package publishing)
```

**Note:** You do NOT need `VERCEL_TOKEN`, `VERCEL_ORG_ID`, or `VERCEL_PROJECT_ID` because Vercel handles deployments automatically through Git integration.

### 2️⃣ Set Up Vercel Project (REQUIRED)

1. **Go to [vercel.com/new](https://vercel.com/new)**
   
2. **Import your GitHub repository**

3. **Configure project settings:**
   ```
   Framework Preset: Next.js
   Root Directory: packages/web
   Build Command: cd ../.. && pnpm install && pnpm build --filter=@katasumi/web
   Install Command: cd ../.. && pnpm install
   Node Version: 20.x
   ```

4. **Add Environment Variables in Vercel:**
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `JWT_SECRET` - Same as GitHub secret
   - `NEXTAUTH_URL` - Your production domain

5. **Configure Git Integration (Automatic!):**
   - ✅ Production Branch: `main` → Auto-deploys on push
   - ✅ Deploy Previews: Enabled → Auto-creates preview for each PR
   - ✅ PR Comments: Enabled → Vercel comments preview URL on PRs

**That's it!** Vercel will automatically:
- Deploy to production when you push to `main`
- Create preview deployments for every PR
- Comment preview URLs on your PRs

No GitHub Actions workflows needed for deployment! 🎉

### 3️⃣ Test the Pipeline

**Test CI Workflow:**
```bash
# Create test branch
git checkout -b test-ci-pipeline

# Make a small change
echo "// CI test" >> packages/core/src/types.ts

# Commit and push
git add .
git commit -m "test: verify CI pipeline"
git push origin test-ci-pipeline

# Create PR and watch Actions tab
```

**Vercel Deployments (Automatic!):**
- **Preview**: Create any PR → Vercel auto-deploys and comments URL
- **Production**: Merge to `main` → Vercel auto-deploys to production
- No manual steps needed!

**Test NPM Publish:**
```bash
# Create and push a tag
git tag v1.0.0
git push origin v1.0.0

# Watch GitHub Actions for publish workflow
# Check npmjs.com for published package
```

## 📁 Files Created

```
.github/
├── workflows/
│   ├── ci.yml                 # Main CI/CD pipeline (testing & building)
│   └── publish-npm.yml        # npm package publishing
├── CI_CD_SETUP.md             # Detailed setup guide
└── QUICK_SETUP.md             # This file

packages/web/
└── vercel.json                # Vercel configuration
```

**Note:** Vercel handles all deployments automatically via Git integration. No separate GitHub Actions workflows needed!

## 🔍 Verify Everything Works

Run these commands to verify your setup:

```bash
# Verify pnpm workspace
pnpm install

# Run all tests
pnpm test

# Run linting
pnpm lint

# Run type checking
pnpm typecheck

# Build all packages
pnpm build

# Verify web build specifically
pnpm --filter=@katasumi/web build
```

## 📚 Documentation

For detailed information, see:
- **[.github/CI_CD_SETUP.md](.github/CI_CD_SETUP.md)** - Comprehensive setup guide
- **[Vercel Deployment Docs](https://vercel.com/docs)** - Vercel-specific help
- **[GitHub Actions Docs](https://docs.github.com/en/actions)** - GitHub Actions help

## 🆘 Troubleshooting

### Common Issues:

**"Vercel build failed"**
- Check environment variables are set in Vercel dashboard
- Verify DATABASE_URL is accessible from Vercel
- Check build logs in Vercel deployment details

**"CI tests failing"**
- Review GitHub Actions logs
- Ensure all dependencies are in pnpm-lock.yaml
- Check PostgreSQL service is healthy

**"NPM publish failed"**
- Verify NPM_TOKEN is valid on npmjs.com
- Check package name is available
- Ensure you're authenticated: `npm login`

## ✨ Next Steps After Setup

1. Set up branch protection rules (require CI to pass)
2. Configure status badges for README.md
3. Set up Dependabot for dependency updates
4. Consider adding performance monitoring
5. Set up error tracking (e.g., Sentry)

---

**Need Help?** Check `.github/CI_CD_SETUP.md` for detailed troubleshooting steps.
