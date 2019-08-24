const webpack = require('webpack');
const mode = process.env.NODE_ENV || 'development';

module.exports = {
    entry: './index.js',
    devtool: 'source-map',
    target: 'web',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            [
                              "@babel/preset-env",
                              {
                                "targets": {
                                  "node": "current"
                                }
                              }
                            ]
                          ],
                        plugins: [ '@babel/plugin-transform-runtime' ],
                        sourceType: 'unambiguous',
                    }
                }
            }
        ]
    },
    node: { crypto: true, stream: true, fs: 'empty', net: 'empty' },
    resolve: {
        modules: [ '../../node_modules' ]
    },
    plugins: [
        new webpack.optimize.ModuleConcatenationPlugin(),
        new webpack.DefinePlugin({
            ENVIRONMENT: JSON.stringify(mode)
        })
    ],
    mode
};
