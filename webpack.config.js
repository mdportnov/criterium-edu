const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (options, webpack) => {
  return {
    ...options,
    entry: {
      main: './apps/api/src/main.ts',
    },
    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100'],
      }),
    ],
    output: {
      path: path.resolve(__dirname, 'dist/apps/api'),
      filename: '[name].js',
    },
    plugins: [
      ...options.plugins,
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'apps/api/src/database/migrations',
            to: 'src/database/migrations',
            globOptions: {
              ignore: ['**/*.spec.ts'],
            },
          },
          {
            from: 'apps/api/src/database/data-source*.ts',
            to: 'src/database/[name][ext]',
          },
        ],
      }),
      new webpack.IgnorePlugin({
        checkResource(resource) {
          const lazyImports = [
            '@nestjs/microservices',
            '@nestjs/platform-express',
            'cache-manager',
            'class-validator',
            'class-transformer',
          ];
          if (!lazyImports.includes(resource)) {
            return false;
          }
          try {
            require.resolve(resource);
          } catch (err) {
            return true;
          }
          return false;
        },
      }),
    ],
  };
};
