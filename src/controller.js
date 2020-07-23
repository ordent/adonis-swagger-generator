const fs = require("fs").promises;
const glob = require("glob");
const path = require("path");
const handlebars = require("handlebars");

module.exports = async function index() {
  // console.log(__dirname, __filename);
  const promise = new Promise(async (resolve, reject) => {
    let routes = await fs
      .readFile(path.resolve("./start/routes.js"), "utf8")
      .catch((e) => {
        console.error("start/routes.js not found");
      });
    if (routes) {
      // regex clean comment
      routes = routes
        .replace(/\"/g, "'")
        .replace(/\/\/.+\n/g, "")
        .replace(/\s/g, "");

      // console.log(routes);
      routes = routes.split("constRoute=use('Route')")[1];
      routes = routes.replace(/\'/g, "").split("Route").slice(1);
      const data = {};
      for (const iterator of routes) {
        const temp = {};
        const i = iterator.split(",");
        const first = i[0].split("(");
        temp.method = first[0].replace(".", "");
        temp.routes = first[1];
        if (temp.routes.includes(":")) {
          const regex = /\:(.*?)\//;
          let path = regex.exec(temp.routes);
          if (path) {
            temp.routes = temp.routes.replace(/\:(.*?)\//, `{${path[1]}}/`);
          } else {
            temp.routes = temp.routes.replace(":", "{") + "}";
          }
        }

        temp.controller = i[1].replace(")", "");
        const tempSplit = temp.controller.split(".");
        temp.activity = tempSplit[1];
        if (tempSplit && tempSplit.length > 1) {
          temp.controller = tempSplit[0];
        }
        temp.tags = temp.controller.replace("Controller", "");

        if (temp.controller.includes("Controller") && !data[temp.controller]) {
          data[temp.controller] = [];
          data[temp.controller].push(temp);
        } else if (data[temp.controller]) {
          data[temp.controller].push(temp);
        }
      }
      // console.log('data', data)
      //
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const element = data[key];
          const endpoints = [];
          for (const iterator of element) {
            let ep = null;
            if (iterator.method != "resource") {
              ep = endpoints.find((e) => e.routes === iterator.routes);
              // console.log(ep, endpoints, iterator.routes);
              if (!ep) {
                ep = {};
                ep.routes = iterator.routes.replace(":", "{");
                ep.method = [];
                endpoints.push(ep);
              }
              const method = {};
              method.method = iterator.method;
              method.description = iterator.description;
              method.tags = iterator.tags;
              // console.log(iterator.routes, iterator.routes.includes(':'))
              if (iterator.routes.includes("{")) {
                method.path = [];
                let regex = /\{(.*?)\}/;
                let path = regex.exec(iterator.routes);
                if (path) {
                  method.path.push(path[1]);
                }
              }
              ep.method.push(method);
            } else {
              ["get", "getById", "post", "put", "delete"].forEach((x) => {
                // console.log(x + 'start')
                let routes = iterator.routes;
                if (x === "post") {
                  routes = routes + "/create";
                }
                if (x === "getById" || x === "put" || x === "delete") {
                  routes = routes + "/{id}";
                }
                ep = endpoints.find((e) => e.routes === routes);
                // console.log(ep, routes, x)
                if (!ep) {
                  ep = {};
                  ep.routes = routes;
                  ep.method = [];
                  endpoints.push(ep);
                  // console.log('push endpoints')
                  // console.log(endpoints)
                }
                const method = {};
                method.method = x === "getById" ? "get" : x;
                method.description = iterator.description;
                method.tags = iterator.tags;
                if (routes.includes("{")) {
                  method.path = [];
                  let regex = /\{(.*?)\}/;
                  let path = regex.exec(routes);
                  if (path) {
                    method.path.push(path[1]);
                  }
                }
                ep.method.push(method);
              });
            }
            // endpoints.push(ep)
          }
          // console.log(endpoints[0])
          //endpoints
          handlebars.registerHelper("state", function (aString) {
            return aString ? aString : "sample";
          });
          const source = await fs.readFile(
            path.resolve(`${__dirname}/controller.yaml`),
            "utf8"
          );
          const template = handlebars.compile(source);
          const contents = template({ endpoints: endpoints });
          const exist = await fs
            .readdir("docs_generated/Controllers")
            .catch(async (e) => {
              // console.log('folder created')
              await fs.mkdir("docs_generated/Controllers", { recursive: true });
            });
          // console.log(key);
          await fs
            .writeFile(`docs_generated/Controllers/${key}.yaml`, contents)
            .catch((e) => {
              // console.log(e);
            });
          // console.log(`${key} success`);
        }
      }
      resolve(true);
    }
  });
  return promise;
};
