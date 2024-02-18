import { depFn, keyDep } from "modules/deps";
import _ from "lodash";
import os from "os";
import path from "path";
const filePath = path.join(os.homedir(), ".universe", "ai-context.json");
import fsExtra from "fs-extra";

let contextObj: any = {};
try {
  contextObj = fsExtra.readJSONSync(filePath);
} catch (e) {
  console.log("no context file found or invalid");
}

export const addContext = depFn(
  {
    source: keyDep<string>("source"),
    path: keyDep<string>("path"),
    value: keyDep<any>("value"),
  },
  async function addContext({ source, path: p, value }) {
    _.set(contextObj, p, value);
    console.log("addContext", source, p, value);
    console.log("new contextObj", contextObj);

    fsExtra.ensureDirSync(path.join(os.homedir(), ".universe"));
    fsExtra.writeJSONSync(filePath, contextObj, { spaces: 2 });
  }
);

export const getContext = depFn({}, async function getContext() {
  return contextObj;
});
