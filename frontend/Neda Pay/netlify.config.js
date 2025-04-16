// Special configuration for Netlify deployment of Next.js
module.exports = {
  // Disable server-side rendering for Netlify deployment
  // This will make the app work as a static site
  target: 'experimental-serverless-trace',
  
  // Configure the build output to work with Netlify
  distDir: '.next',
  
  // Configure the webpack to handle browser-specific modules
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        zlib: require.resolve('browserify-zlib'),
        path: require.resolve('path-browserify'),
        os: require.resolve('os-browserify/browser'),
      };
    }
    return config;
  },
  
  // Disable image optimization which can cause issues on Netlify
  images: {
    unoptimized: true,
  },
  
  // Ensure Next.js knows it's running on Netlify
  env: {
    NETLIFY: 'true',
  },
};
