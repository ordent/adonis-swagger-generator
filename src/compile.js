const fs = require("fs").promises;
const options = require("../config/swagger.js");
const swaggerJSDoc = require("swagger-jsdoc");

module.exports = async function index() {
  const swaggerSpec = swaggerJSDoc(options.options);
  await fs.writeFile(
    `docs_generated/swagger.json`,
    JSON.stringify(swaggerSpec, null, 2),
    "utf8"
  );
};
