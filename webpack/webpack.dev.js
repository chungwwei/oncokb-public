const webpack = require('webpack');
const writeFilePlugin = require('write-file-webpack-plugin');
const webpackMerge = require('webpack-merge');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const SimpleProgressWebpackPlugin = require('simple-progress-webpack-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');
const path = require('path');

const utils = require('./utils.js');
const commonConfig = require('./webpack.common.js');

const ENV = 'development';

module.exports = options =>
  webpackMerge(
    commonConfig({
      env: ENV,
    }),
    {
      devtool: 'cheap-module-source-map', // https://reactjs.org/docs/cross-origin-errors.html
      mode: ENV,
      entry: ['./src/main/webapp/app/index'],
      output: {
        path: utils.root('target/classes/static/'),
        filename: 'app/[name].bundle.js',
        chunkFilename: 'app/[id].chunk.js',
      },
      module: {
        rules: [
          {
            test: /\.module\.scss$/,
            use: [
              'style-loader',
              {
                loader: 'css-loader',
                options: {
                  modules: {
                    localIdentName: '[name]__[local]__[hash:base64:5]',
                  },
                  importLoaders: 2,
                },
              },
              'sass-loader',
              utils.sassResourcesLoader,
            ],
          },
          {
            test: /\.(sa|sc|c)ss$/,
            exclude: /\.module\.scss$/,
            use: [
              'style-loader',
              'css-loader',
              'postcss-loader',
              {
                loader: 'sass-loader',
                options: { sourceMap: true },
              },
              utils.sassResourcesLoader,
            ],
          },
        ],
      },
      devServer: {
        stats: options.stats,
        hot: true,
        contentBase: './target/classes/static/',
        proxy: [
          {
            context: [
              '/api',
              '/services',
              '/management',
              '/swagger-resources',
              '/v2/api-docs',
              '/h2-console',
              '/auth',
            ],
            target: `http${options.tls ? 's' : ''}://localhost:9090`,
            secure: false,
            changeOrigin: options.tls,
          },
        ],
        watchOptions: {
          ignored: /node_modules/,
        },
        https: options.tls,
        historyApiFallback: {
          disableDotRule: true,
        },
      },
      stats: process.env.JHI_DISABLE_WEBPACK_LOGS ? 'none' : options.stats,
      plugins: [
        process.env.JHI_DISABLE_WEBPACK_LOGS
          ? null
          : new SimpleProgressWebpackPlugin({
              format: options.stats === 'minimal' ? 'compact' : 'expanded',
            }),
        new FriendlyErrorsWebpackPlugin(),
        new BrowserSyncPlugin(
          {
            https: options.tls,
            host: 'localhost',
            port: 9000,
            proxy: {
              target: `http${options.tls ? 's' : ''}://localhost:9060`,
              proxyOptions: {
                changeOrigin: false, //pass the Host header to the backend unchanged  https://github.com/Browsersync/browser-sync/issues/430
              },
            },
            socket: {
              clients: {
                heartbeatTimeout: 60000,
              },
            },
            /*
      ,ghostMode: { // uncomment this part to disable BrowserSync ghostMode; https://github.com/jhipster/generator-jhipster/issues/11116
        clicks: false,
        location: false,
        forms: false,
        scroll: false
      } */
          },
          {
            reload: false,
          }
        ),
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new writeFilePlugin(),
        new webpack.WatchIgnorePlugin([utils.root('src/test')]),
        new WebpackNotifierPlugin({
          title: 'OncoKB',
          contentImage: path.join(__dirname, 'logo-oncokb.png'),
        }),
      ].filter(Boolean),
    }
  );
