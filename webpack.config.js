const { join } = require("path")
const buildPath = join(__dirname, "built")

const frontend = {
  entry: "./frontend/main.ts",
  output: {
    filename: "frontend.js",
    path: buildPath
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /(node_modules)|(server)|(tests)/,
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  }
}

module.exports = [ frontend ]