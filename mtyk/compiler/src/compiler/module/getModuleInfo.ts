import chokidar from "chokidar";
import fs from "fs";
import glob from "glob";
import isBuiltinModule from "is-builtin-module";
import _ from "lodash";
import uniq from "lodash/uniq";
import path from "path";
import { COLORS } from "../constants";
import findFileImports from "../file/findFileImports";
import { readJSON, writeJSON } from "../json";
import { badPackages, safePackages } from "./safePackages";
import barrelify from "../barrelify";
export interface BaseModuleInfo {
  name: string;
  path: string;
}

interface ModuleInfo {
  info?: {
    requiredOneModules: string[];
    hasReact: boolean;
    allDeps?: Record<string, string>;
  } & BaseModuleInfo;
  watcher: chokidar.FSWatcher;
}

export let moduleInfoCache: Record<string, ModuleInfo> = {};
export let ignorePaths: string[] = ["**/package.json"];

export default async function getModuleInfo(
  moduleName: string,
  modulePath: string
) {
  if (moduleInfoCache[moduleName]?.info) {
    return moduleInfoCache[moduleName].info;
  }

  if (!moduleInfoCache[moduleName]?.watcher) {
    moduleInfoCache[moduleName] = {
      watcher: chokidar
        .watch(path.join(modulePath, "src"), {
          ignored: ignorePaths,
          persistent: true,
        })
        .on("all", () => {
          delete moduleInfoCache[moduleName].info;
          // console.log(`Module ${moduleName} changed, clearing cache`)
        }),
    };
  }

  await barrelify(`${modulePath}/src`);

  const _requiredModules = await new Promise<string[][]>((resolve, rej) =>
    glob("./src/**/*.{ts,tsx}", { cwd: modulePath }, (err, files) => {
      if (err) {
        return rej(err);
      }

      resolve(
        files.map((file): string[] => {
          const fullPath = path.join(modulePath, file);
          return findFileImports(fullPath);
        })
      );
    })
  );

  const requiredModules: string[] = _(_requiredModules)
    .flatten()
    .uniq()
    .value();
  const onlyOneModules = _(requiredModules)
    .filter((str: string) => str.startsWith("modules/"))
    .map((str: string) => str.split("/").slice(1, 2).join("/"))
    .filter((str: string) => str.trim().length > 0 && str !== "/")
    .value();

  const standardModules = _(requiredModules)
    .filter((str: string) => !str.startsWith("modules/"))
    .map((i) =>
      i.startsWith("@") ? i.split("/").slice(0, 2).join("/") : i.split("/")[0]
    )
    .uniq()
    .value();

  let allDeps = {};
  if (fs.existsSync(path.join(modulePath, "package.json"))) {
    const packageJSON = await readJSON(path.join(modulePath, "package.json"));
    const safe = safePackages;
    let isPackageJsonUpdated = false;

    // Ensure its somewhere in packageJSON, otherwise add it from safePackages
    const allDeps = {
      ...packageJSON.dependencies,
      ...packageJSON.devDependencies,
      ...packageJSON.peerDependencies,
    };

    const notAdded: string[] = [];

    standardModules.forEach((dep) => {
      if (
        !isBuiltinModule(dep) &&
        !dep.startsWith("modules/") &&
        dep !== "modules"
      ) {
        if (safe[dep] && allDeps[dep] !== safe[dep]) {
          allDeps[dep] = safe[dep];
          isPackageJsonUpdated = true;
        } else if (badPackages[dep]) {
          console.warn(
            `The dependency ${COLORS.yellow}${dep}${COLORS.reset} is discouraged: ${COLORS.yellow}${badPackages[dep].warning}${COLORS.reset}`
          );
        } else {
          notAdded.push(dep);
        }
      }
    });

    if (notAdded.length > 0) {
      console.warn(
        `The following dependencies are used in ${COLORS.yellow}${moduleName}${
          COLORS.reset
        } but are not listed in package.json: ${COLORS.yellow}${notAdded.join(
          ", "
        )}${COLORS.reset}`
      );
    }

    if (isPackageJsonUpdated) {
      await writeJSON(path.join(modulePath, "package.json"), {
        ...packageJSON,
        dependencies: allDeps,
      });
    }
  }

  const hasReact = await new Promise<boolean>((resolve, rej) =>
    glob("./src/**/*.tsx", { cwd: modulePath }, (err, files) => {
      if (err) {
        return rej(err);
      }
      return resolve(files.length > 0);
    })
  );

  moduleInfoCache[moduleName].info = {
    name: moduleName,
    path: modulePath,
    allDeps,
    requiredOneModules: uniq(onlyOneModules).sort(), // make sure in same order each time, don't confuse json.stringify
    hasReact,
  };
  return moduleInfoCache[moduleName].info;
}
