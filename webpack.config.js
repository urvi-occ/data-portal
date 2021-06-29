const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const path = require('path');

const basename = process.env.BASENAME || '/';
const pathPrefix = basename.endsWith('/') ? basename.slice(0, basename.length - 1) : basename;
const app = process.env.APP || 'dev';
const title = {
  acct: 'ACCOuNT Data Commons',
  bhc: 'Brain Commons',
  bpa: 'BPA Data Commons',
  dcf: 'National Cancer Institue Data Commons Framework',
  gtex: 'GTEx & TOPMed Data Commons Submission Portal',
  dev: 'Generic Data Commons',
  edc: 'Environmental Data Commons',
  gdc: 'Jamboree Data Access',
  kf: 'Kids First Data Coordinating Center Portal',
  ndh: 'NIAID Data Hub',
}[app];

const configFileName = (app === 'dev') ? 'default' : app;
// eslint-disable-next-line import/no-dynamic-require
const configFile = require(`./data/config/${configFileName}.json`);
const DAPTrackingURL = configFile.DAPTrackingURL;
const scriptSrcURLs = [];
const connectSrcURLs = [];
if (DAPTrackingURL) {
  scriptSrcURLs.push(DAPTrackingURL);
  connectSrcURLs.push(DAPTrackingURL);
}
const iFrameApplicationURLs = [];
if (configFile && configFile.analysisTools) {
  configFile.analysisTools.forEach((e) => {
    if (e.applicationUrl) {
      iFrameApplicationURLs.push(e.applicationUrl);
    }
  });
}

const plugins = [
  new webpack.EnvironmentPlugin(['NODE_ENV']),
  new webpack.EnvironmentPlugin({ MOCK_STORE: null }),
  new webpack.EnvironmentPlugin(['APP']),
  new webpack.EnvironmentPlugin({ BASENAME: '/' }),
  new webpack.EnvironmentPlugin(['LOGOUT_INACTIVE_USERS']),
  new webpack.EnvironmentPlugin(['WORKSPACE_TIMEOUT_IN_MINUTES']),
  new webpack.EnvironmentPlugin(['REACT_APP_PROJECT_ID']),
  new webpack.EnvironmentPlugin(['REACT_APP_DISABLE_SOCKET']),
  new webpack.EnvironmentPlugin(['TIER_ACCESS_LEVEL']),
  new webpack.EnvironmentPlugin(['TIER_ACCESS_LIMIT']),
  new webpack.EnvironmentPlugin(['FENCE_URL']),
  new webpack.EnvironmentPlugin(['INDEXD_URL']),
  new webpack.EnvironmentPlugin(['USE_INDEXD_AUTHZ']),
  new webpack.EnvironmentPlugin(['WORKSPACE_URL']),
  new webpack.EnvironmentPlugin(['WTS_URL']),
  new webpack.EnvironmentPlugin(['MANIFEST_SERVICE_URL']),
  new webpack.EnvironmentPlugin(['MAPBOX_API_TOKEN']),
  new webpack.DefinePlugin({ // <-- key to reducing React's size
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'dev'),
      LOGOUT_INACTIVE_USERS: !(process.env.LOGOUT_INACTIVE_USERS === 'false'),
      WORKSPACE_TIMEOUT_IN_MINUTES: process.env.WORKSPACE_TIMEOUT_IN_MINUTES || 480,
      REACT_APP_PROJECT_ID: JSON.stringify(process.env.REACT_APP_PROJECT_ID || 'search'),
      REACT_APP_DISABLE_SOCKET: JSON.stringify(process.env.REACT_APP_DISABLE_SOCKET || 'true'),
    },
  }),
  new HtmlWebpackPlugin({
    title,
    basename: pathPrefix,
    template: 'src/index.ejs',
    connect_src: (function () {
      const rv = {};
      if (typeof process.env.FENCE_URL !== 'undefined') {
        rv[(new URL(process.env.FENCE_URL)).origin] = true;
      }
      if (typeof process.env.INDEXD_URL !== 'undefined') {
        rv[(new URL(process.env.INDEXD_URL)).origin] = true;
      }
      if (typeof process.env.WORKSPACE_URL !== 'undefined') {
        rv[(new URL(process.env.WORKSPACE_URL)).origin] = true;
      }
      if (typeof process.env.WTS_URL !== 'undefined') {
        rv[(new URL(process.env.WTS_URL)).origin] = true;
      }
      if (typeof process.env.MANIFEST_SERVICE_URL !== 'undefined') {
        rv[(new URL(process.env.MANIFEST_SERVICE_URL)).origin] = true;
      }
      if (iFrameApplicationURLs.length > 0) {
        iFrameApplicationURLs.forEach((url) => {
          rv[(new URL(url)).origin] = true;
        });
      }
      if (connectSrcURLs.length > 0) {
        connectSrcURLs.forEach((url) => {
          rv[(new URL(url)).origin] = true;
        });
      }
      return Object.keys(rv).join(' ');
    }()),
    dap_url: DAPTrackingURL,
    script_src: (function () {
      const rv = {};
      if (scriptSrcURLs.length > 0) {
        scriptSrcURLs.forEach((url) => {
          rv[(new URL(url)).origin] = true;
        });
      }
      return Object.keys(rv).join(' ');
    }()),
    hash: true,
    chunks: ['vendors~bundle', 'bundle'],
  }),
  /*
  Can do this kind of thing to deploy multi-page apps in the future ...

  new HtmlWebpackPlugin({
    title: "Gen3 Workspaces",
    filename: "workspaces.html",
    template: 'src/index.ejs',
    hash: true,
    chunks: ['vendors~bundle~workspaceBundle', 'workspaceBundle']
  }),
  */
  new webpack.optimize.AggressiveMergingPlugin(), // Merge chunks
];

let optimization = {};
let devtool = false;

if (process.env.NODE_ENV !== 'dev' && process.env.NODE_ENV !== 'auto') {
  // optimization for production mode
  optimization = {
    splitChunks: {
      chunks: 'all',
    },
  };
} else {
  // add sourcemap tools for development mode
  devtool = 'eval-source-map';
}

const entry = {
  bundle: ['babel-polyfill', './src/index.jsx'],
  workspaceBundle: ['babel-polyfill', './src/workspaceIndex.jsx'],
  covid19Bundle: ['babel-polyfill', './src/covid19Index.jsx'],
  nctBundle: ['babel-polyfill', './src/nctIndex.jsx'],
  healBundle: ['babel-polyfill', './src/healIndex.jsx'],
};

// if GEN3_BUNDLE is set with a value
if (process.env.GEN3_BUNDLE) {
  switch (process.env.GEN3_BUNDLE) {
  case 'workspace':
    // Just build the workspace bundle as bundle.js
    entry.bundle = entry.workspaceBundle;
    delete entry.workspaceBundle;
    delete entry.covid19Bundle;
    delete entry.nctBundle;
    delete entry.healBundle;
    break;
  case 'covid19':
    entry.bundle = entry.covid19Bundle;
    delete entry.workspaceBundle;
    delete entry.covid19Bundle;
    delete entry.nctBundle;
    delete entry.healBundle;
    break;
  case 'nct':
    entry.bundle = entry.nctBundle;
    delete entry.workspaceBundle;
    delete entry.covid19Bundle;
    delete entry.nctBundle;
    delete entry.healBundle;
    break;
  case 'heal':
    entry.bundle = entry.healBundle;
    delete entry.workspaceBundle;
    delete entry.covid19Bundle;
    delete entry.nctBundle;
    delete entry.healBundle;
    break;
  default:
    // by default we build for commons bundle
    delete entry.workspaceBundle;
    delete entry.covid19Bundle;
    delete entry.nctBundle;
    delete entry.healBundle;
    break;
  }
}
// else - if GEN3_BUNDLE is NOT set then build all entry points
//    note that runWebpack ensures GEN3_BUNDLE is set,
//    and the Dockerfile leaves it unset ...

module.exports = {
  entry,
  target: 'web',
  externals: [nodeExternals({
    whitelist: ['graphiql', 'graphql-language-service-parser'],
  })],
  mode: process.env.NODE_ENV !== 'dev' && process.env.NODE_ENV !== 'auto' ? 'production' : 'development',
  output: {
    path: __dirname,
    filename: '[name].js',
    publicPath: basename,
  },
  optimization,
  devtool,
  devServer: {
    historyApiFallback: {
      index: 'dev.html',
    },
    disableHostCheck: true,
    compress: true,
    hot: true,
    port: 9443,
    https: true,
  },
  module: {
    rules: [{
    //   test: /\.tsx?$/,
    //   exclude: /node_modules\/(?!(graphiql|graphql-language-service-parser)\/).*/,
    //   use: {
    //     loader: 'ts-loader',
    //   },
    // },
    // {
      test: /\.jsx?$|\.tsx?$/,
      exclude: /node_modules\/(?!(graphiql|graphql-language-service-parser)\/).*/,
      use: {
        loader: 'babel-loader',
      },
    },
    {
      test: /\.less$/,
      loaders: [
        'style-loader',
        'css-loader',
        'less-loader',
      ],
    },
    {
      test: /\.css$/,
      loader: 'style-loader!css-loader',
    },
    {
      test: /\.svg$/,
      loaders: ['babel-loader', 'react-svg-loader'],
    },
    {
      test: /\.(png|jpg|gif|woff|ttf|eot)$/,
      loaders: 'url-loader',
      query: {
        limit: 8192,
      },
    },
    {
      test: /\.flow$/,
      loader: 'ignore-loader',
    },
    ],
  },
  resolve: {
    alias: {
      graphql: path.resolve('./node_modules/graphql'),
      react: path.resolve('./node_modules/react'), // Same issue.
      graphiql: path.resolve('./node_modules/graphiql'),
      'graphql-language-service-parser': path.resolve('./node_modules/graphql-language-service-parser'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
  },
  plugins,
  externals: [{
    xmlhttprequest: '{XMLHttpRequest:XMLHttpRequest}',
  }],
};
