/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Configure API proxy for development
  async rewrites() {
    console.log('Setting up API proxy to http://localhost:3005/api/');
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3005/api/:path*',
      },
    ];
  },
  // Allow importing TypeScript files
  webpack: (config, { isServer }) => {
    // Add TypeScript loader for .ts files
    config.module.rules.push({
      test: /\.ts$/,
      use: 'ts-loader',
    });

    return config;
  },
};

module.exports = nextConfig; 