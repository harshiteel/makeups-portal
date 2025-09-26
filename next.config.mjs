/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: '/makeups',
    assetPrefix: '/makeups',
    output: 'standalone',
    env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL
    },
    // Enable trailing slash for better reverse proxy compatibility
    trailingSlash: true,
};
  
export default nextConfig;
  