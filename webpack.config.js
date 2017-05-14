const { join, resolve } = require("path")
const { sync } = require("glob")
const { ContextReplacementPlugin } = require("webpack")
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

const tests = {
  entry: sync("./tests/**/*.ts"),
  output: {
    filename: "tests.js",
    path: buildPath
  },
  node: {
    fs: "empty"
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /(node_modules)|(server)/,
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  }
}

module.exports = [ frontend, tests]