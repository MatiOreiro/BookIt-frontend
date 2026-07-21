import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  output: 'standalone',

  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-router/dom': path.resolve(__dirname, 'node_modules/react-router/dist/development/dom-export.js'),
      'react-router': path.resolve(__dirname, 'node_modules/react-router/dist/development/index.js'),
    };

    return config;
  },
};

export default nextConfig;
