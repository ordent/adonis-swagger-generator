#!/usr/bin/env node
const controller = require("./src/controller.js");
const model = require("./src/model.js");
const path = require("path");
async function index() {
  await controller();
  await model();
}
index();
