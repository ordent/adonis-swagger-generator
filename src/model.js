const fs = require("fs").promises;
const glob = require("glob");
const path = require("path");
const handlebars = require("handlebars");
module.exports = async function index() {
  const promise = new Promise(async (resolve, reject) => {
    await glob("app/Models/*.js", async (er, files) => {
      if (files.length > 0) {
        const models = [];
        for (const iterator of files) {
          // read properties
          let modelName = iterator.replace(".js", "").split("/");
          modelName = modelName[modelName.length - 1];
          models.push(modelName);

          const model = await fs.readFile(path.resolve(iterator), "utf8");

          let properties = getProperties(model);
          let relations = getRelations(model);

          if (properties) {
            // // write model yaml
            let source = await fs.readFile(
              path.resolve(`${__dirname}/model.yaml`),
              "utf8"
            );
            let template = handlebars.compile(source);
            let contents = template({
              model: modelName,
              properties: properties,
              relations: relations ? relations : null,
            });
            let minContents = template({
              model: "_" + modelName,
              properties: makeMinimumProperty(properties),
              relations: relations ? relations : null,
            });
            await writeModel(modelName, contents);
            await writeModel("_" + modelName, minContents);
            source = await fs.readFile(
              path.resolve(`${__dirname}/tags.yaml`),
              "utf8"
            );
            template = handlebars.compile(source);
            contents = template({ models: models });
            await fs.writeFile(`docs_generated/tags.yaml`, contents);
            console.log(`${modelName} success`);
          } else {
            console.log(`${modelName} skipped`);
          }
        }
      } else {
        console.error("app/models not found");
      }
      resolve(true);
    });
  });
  return promise;
};

async function writeModel(modelName, contents) {
  const exist = await fs.readdir("docs_generated/Models").catch(async (e) => {
    await fs.mkdir("docs_generated/Models", { recursive: true });
    console.log("folder created");
  });
  await fs.writeFile(`docs_generated/Models/${modelName}.yaml`, contents);
}

function getProperties(model) {
  const temp = model.split("static get properties() {");
  if (temp && temp.length > 1) {
    const content = temp[1].split("}");
    let arr = content[0].replace(/\s/g, "").split("return");
    arr = arr[1].replace(/'/g, '"').replace('",]', '"]');
    return JSON.parse(arr).map((val) => {
      return getType(val);
    });
  }
  return null;
}

function getRelations(model) {
  const temp = model.split("static get relations() {");
  if (temp && temp.length > 1) {
    const content = temp[1].split("}\n");
    let arr = content[0].replace(/\s/g, "").split("return");
    if (arr[1]) {
      arr[1] = arr[1].indexOf("}]") === -1 ? arr[1] + "}]" : arr[1];
    }
    arr = arr[1].replace(/'/g, '"').replace('",]', '"]');
    arr = arr.replace("[", "").replace("]", "");
    arr = arr.replace(",", "\\n");
    return arr;
    // const result = JSON.parse(arr)
  }
  return null;
}

function getType(name) {
  const property = {
    name,
  };
  const switchName = name.indexOf("_id") !== -1 ? "id" : name;
  switch (switchName) {
    case "id":
      property.type = "integer";
      property.description =
        "this property is generated, type may be not integer";
      break;
    case "created_at":
      (property.type = "string"),
        (property.format = "date-time"),
        (property.description =
          "this property is generated, type may be not string");
      break;
    case "updated_at":
      (property.type = "string"),
        (property.format = "date-time"),
        (property.description =
          "this property is generated, type may be not string");
      break;
    default:
      (property.type = "string"),
        (property.description =
          "this property is generated, type may be not string");
  }
  return property;
}

function makeMinimumProperty(props) {
  return props.filter((val) => {
    return !(
      val.name === "id" ||
      val.name === "created_at" ||
      val.name === "updated_at"
    );
  });
}
