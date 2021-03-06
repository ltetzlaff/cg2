const { readFile } = require("fs")
const { join, resolve } = require("path")
const express = require("express")
const logger = require("morgan")

const e = express()

e.use(express.static("."))
e.use(logger("dev"))
e.set("view engine", "pug")
e.set("views", "frontend")

// Routes
e.get("/", (req, res) => res.render("ex4.pug"))

e.get("/models/:file", (req, res) => {
  readFile(join(".", "ex4", "obj_data", req.params.file), "utf8", (err, data) => {
    if (err) {
      console.error(err)
      res.sendStatus(500).end(err.toString())
    } else {
      res.send(data)
    }
  })
})

e.get("/tests", (req, res) => {
  res.sendFile(resolve(".", "tests", "results.html"))
})

// Start
e.listen(3000)

module.exports = e