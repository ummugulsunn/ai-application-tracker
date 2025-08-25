/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
  // Ensure proper routing
  trailingSlash: false,
  // Enable strict mode
  reactStrictMode: true,
}

module.exports = nextConfig
