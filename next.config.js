/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure CSS appropriately (cssModules is not a valid Next.js config option)
  images: {
    domains: [],
  },
  webpack: (config, { isServer }) => {
    // Frontend-compatible SQLite with better-sqlite3
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
    
    // Fix for Plotly.js/React-Plotly.js
    if (isServer) {
      // Don't load plotly on server
      config.externals = [...config.externals, 'plotly.js', 'react-plotly.js'];
    }
    
    return config;
  },
}

module.exports = nextConfig 