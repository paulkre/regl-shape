const path = require("path");

module.exports = {
  entry: "./src/index.ts",
  mode: "production",
  target: "node",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "foo.bundle.js",
  },
  module: {
    rules: [
      // {
      //   loader: require.resolve("file-loader"),
      //   include: /\.(jpg|png|gif|txt|json)$/,
      //   options: {
      //     name: "static/media/[name].[hash:8].[ext]",
      //   },
      // },
      // {
      //   test: /\.m?js$/,
      //   exclude: /(node_modules|bower_components)/,
      //   loader: require.resolve("babel-loader"),
      //   options: {
      //     babelrc: false,
      //     configFile: false,
      //     compact: false,
      //     presets: [require.resolve("@babel/preset-env")],
      //     cacheDirectory: true,
      //     cacheCompression: false,
      //     sourceMaps: false,
      //     inputSourceMap: false,
      //   },
      // },
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        loader: require.resolve("raw-loader"),
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: require.resolve("ts-loader"),
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
};
