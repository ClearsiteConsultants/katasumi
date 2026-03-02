/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@katasumi/core'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Stub out SQLite-related modules so they are never required at runtime.
      // @katasumi/core re-exports SQLiteAdapter (a TUI-only class) which imports
      // these packages. Aliasing to `false` replaces them with empty modules at
      // build time, avoiding a MODULE_NOT_FOUND error in the Vercel environment
      // where these native packages are not present.
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        '@prisma/adapter-libsql': false,
        '@libsql/client': false,
        'libsql': false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
