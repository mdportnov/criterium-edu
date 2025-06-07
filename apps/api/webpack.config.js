const { composePlugins, withNx } = require('@nx/webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const path = require('path');

// Nx plugins for webpack.
module.exports = composePlugins(
  withNx({
    target: 'node',
    generatePackageJson: true,
  }),
  (config) => {
    // Set up node externals properly
    config.externals = [nodeExternals()];

    // CRITICAL: Override NX's automatic library resolution
    // Force webpack to use TypeScript source files instead of built JS
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        // Force exact path resolution to TypeScript source
        '@app/shared$': path.resolve(
          __dirname,
          '../../libs/shared/src/index.ts',
        ),
        '@app/shared': path.resolve(__dirname, '../../libs/shared/src'),
        '@shared$': path.resolve(__dirname, '../../libs/shared/src/index.ts'),
        '@shared': path.resolve(__dirname, '../../libs/shared/src'),
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      mainFields: ['main', 'module'],
    };

    // Add copy plugin for migrations with correct paths
    config.plugins = config.plugins || [];
    config.plugins.push(
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'src/database/migrations'),
            to: 'src/database/migrations',
            globOptions: {
              ignore: ['**/*.spec.ts'],
            },
          },
          {
            from: path.resolve(__dirname, 'src/database/data-source*.ts'),
            to: 'src/database/[name][ext]',
          },
        ],
      }),
    );

    // Ensure we're building for Node.js
    config.target = 'node';

    // Disable webpack's native node polyfills
    config.node = false;

    return config;
  },
);
