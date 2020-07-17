#!/usr/bin/env node
const controller = require("./src/controller.js");
const model = require("./src/model.js");
const compile = require("./src/compile.js");

async function index() {
  await controller();
  console.log("routes crawled");
  await model();
  console.log("model crawled");
  await compile();
  console.log("swagger json created");
}
index();
