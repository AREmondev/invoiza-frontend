/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' because NextAuth requires server-side API routes
  // If you need static export, you'll need to use a different auth solution
  // or deploy to a platform that supports API routes (Vercel, Netlify, etc.)
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
