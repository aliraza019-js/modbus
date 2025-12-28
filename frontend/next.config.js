/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // For Docker deployment
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.ducorr.com',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || getApiUrl(),
  },
}

// Determine API URL based on environment
function getApiUrl() {
  const nodeEnv = process.env.NODE_ENV || 'local';
  
  if (nodeEnv === 'prod' || nodeEnv === 'production') {
    return 'https://ap-modbus.ducorr.com';
  }
  
  // Default to localhost for local development
  return 'http://localhost:3002';
}

module.exports = nextConfig

