import path from "path";
import { readJSON } from "../json";
import { projectPath } from "../path";

export function getModulePath(moduleName: string) {
  return path.join(projectPath("modules"), moduleName);
}

export async function getModulePackageJSON(moduleName: string) {
  const p = path.join(getModulePath(moduleName), "package.json");
  const json = await readJSON(p);
  return json;
}
