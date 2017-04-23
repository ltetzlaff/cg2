"use strict"

const express = require("express")
const e = express()
const http = require("http").Server(e)

e.use(express.static("."))
e.set("view engine", "pug")
e.set("views", "frontend")
e.get("/", (req, res) => res.render("ex1"))
e.listen(3000)


module.exports = e