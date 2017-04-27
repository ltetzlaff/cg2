"use strict"

const { readFile } = require("fs")
const { join } = require("path")
const express = require("express")
const logger = require("morgan")
const e = express()
const http = require("http").Server(e)

e.use(express.static("."))
e.use(logger("dev"))
e.set("view engine", "pug")
e.set("views", ".")
e.get("/", (req, res) => res.render("ex1"))
e.get("/models/:file", (req, res) => {
  readFile(join("..", "ex1", "off_files", req.params.file), "utf8", (err, data) => {
    if (err) {
      console.error(err)
      res.sendStatus(500).end(err.toString())
    } else {
      res.send(data)
    }
  })
})
e.listen(3000)


module.exports = e