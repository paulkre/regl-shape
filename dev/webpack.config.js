const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = {
  entry: path.join(__dirname, "index.js"),
  mode: "development",
  module: {
    rules: [
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        use: [require.resolve("raw-loader"), require.resolve("glslify-loader")],
      },
      {
        test: /\.ts$/,
        loader: require.resolve("ts-loader"),
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        loader: require.resolve("babel-loader"),
        options: {
          babelrc: false,
          configFile: false,
          compact: false,
          presets: [require.resolve("@babel/preset-env")],
          cacheDirectory: true,
          cacheCompression: false,
          sourceMaps: false,
          inputSourceMap: false,
        },
      },
    ],
  },
  plugins: [new HtmlWebpackPlugin()],
  resolve: {
    extensions: [".ts", ".js"],
  },
  devServer: { port: 9000 },
};
