import path from "path";
import { projectPath } from "../path";

export const BUILT_MODULES = "built-modules/@bbuild";
export function getBuiltModulesPath(moduleDir?: string) {
  // nested @bbuild folder so that, when using built-modules as a webpack resolve target,
  // it traverses it in the same way as it would node_modules. otherwise, it won't work
  return projectPath(
    path.join(...["built-modules/@bbuild", ...(moduleDir ? [moduleDir] : [])])
  );
}
