const fs = require("fs").promises;
const swaggerJSDoc = require("swagger-jsdoc");
const path = require("path");
module.exports = async function index() {
  let options = null;
  try {
    options = require(path.resolve("./config/swagger.js"));
  } catch (e) {
    options = require(path.resolve(__dirname + "../config/swagger.js"));
  }

  const swaggerSpec = swaggerJSDoc(options.options);
  await fs.writeFile(
    `docs_generated/swagger.json`,
    JSON.stringify(swaggerSpec, null, 2),
    "utf8"
  );
};
