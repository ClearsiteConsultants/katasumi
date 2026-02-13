/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@katasumi/core'],
  serverComponentsExternalPackages: [
    '@libsql/client',
    'libsql',
    '@prisma/adapter-libsql',
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude SQLite-related modules from server bundle
      config.externals = config.externals || [];
      config.externals.push({
        '@libsql/client': 'commonjs @libsql/client',
        'libsql': 'commonjs libsql',
        '@prisma/adapter-libsql': 'commonjs @prisma/adapter-libsql',
      });
    }
    return config;
  },
}

module.exports = nextConfig
