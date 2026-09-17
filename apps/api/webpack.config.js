const { composePlugins, withNx } = require('@nx/webpack');
const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = composePlugins(
  withNx({
    target: 'node',
    generatePackageJson: true,
  }),
  (config) => {
    // Dependencies stay in node_modules rather than being bundled; the image
    // ships node_modules alongside dist.
    config.externals = [nodeExternals()];

    // Resolve @app/shared to the TypeScript sources rather than to a built
    // package, so the library does not need publishing to build the API.
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        '@app/shared$': path.resolve(
          __dirname,
          '../../libs/shared/src/index.ts',
        ),
        '@app/shared': path.resolve(__dirname, '../../libs/shared/src'),
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      mainFields: ['main', 'module'],
    };

    config.target = 'node';
    config.node = false;

    // Migrations are not bundled: `nx run api:build:migrations` compiles them
    // to plain CommonJS next to the compiled data source, which is what the
    // TypeORM CLI runs at container start. Copying the raw .ts sources into
    // dist as well, as this config used to, only produced files nothing read.
    return config;
  },
);
