/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: '/makeups',
    output: 'standalone',
    env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL
     },
    // rewrites: async () => {
    //     return [{
    //         source: '/api/:path*',
    //         destination: '/makeups/api/:path*',
    //     },
    //     ];
    // },
};
  
export default nextConfig;
  