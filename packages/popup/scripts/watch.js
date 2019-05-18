process.env.NODE_ENV = 'development';

const fs = require('fs-extra');
const paths = require('react-scripts/config/paths');
const webpack = require('webpack');
const configFunc = require('react-scripts/config/webpack.config.js');
const config = configFunc(process.env.NODE_ENV)

var entry = config.entry;
var plugins = config.plugins;
entry = entry.filter(fileName => !fileName.match(/webpackHotDevClient/));
plugins = plugins.filter(plugin => !(plugin instanceof webpack.HotModuleReplacementPlugin));

config.entry = entry;
config.plugins = plugins;

webpack(config).watch({}, (err, stats) => {
  if (err) {
    console.error(err);
  } else {
    copyPublicFolder();
  }
  console.error(stats.toString({
    chunks: false,
    colors: true
  }));
});
function copyPublicFolder() {
  fs.copySync(paths.appPath + "/public", paths.appPath + "/dist", {
    dereference: true,
    filter: file => file !== paths.appHtml
  });
}