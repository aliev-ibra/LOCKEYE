/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Any other valid experimental options can stay here
  },
  // Always use static export for Electron
  output: 'export',
  // Add basePath for file protocol in Electron
  assetPrefix: process.env.NODE_ENV === 'production' ? './' : undefined,
}

module.exports = nextConfig