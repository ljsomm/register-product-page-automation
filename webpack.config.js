const path = require("path");
const nodeExternals = require("webpack-node-externals");
console.log(path.resolve(__dirname, "sample-product-register-cms"))

module.exports = {
  entry: "./src/index.ts",
  mode: process.env.WEBPACK_MODE ?? "production",
  target: "node",
  externals: [nodeExternals()],
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [{ test: /\.ts$/, use: "ts-loader" }],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
};
