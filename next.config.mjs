const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'https://bookit-backend-es10.onrender.com/:path*',
      },
    ];
  },
};

export default nextConfig;