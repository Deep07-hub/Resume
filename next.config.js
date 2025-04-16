/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  images: {
    domains: ['ui-resume.netlify.app'],
    unoptimized: true
  }
}

module.exports = nextConfig 