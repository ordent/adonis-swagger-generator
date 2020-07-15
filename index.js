#!/usr/bin/env node
const controller = require("./src/controller.js");
const model = require("./src/model.js");

async function index() {
  await controller();
  await model();
}
index();
