import { uniq } from "@/util/dash";
import * as chokidar from "chokidar";
import { existsSync, readFileSync } from "fs";
import { default as fsExtra, default as fse } from "fs-extra";
import ignore from "ignore";
import path from "path";
import { Observable, fromEventPattern, map, scan, shareReplay } from "rxjs";
import type { PackageJson } from "type-fest";
import findFileImports from "../file/findFileImports";

export default function addScript(
  packageJson: any,
  scriptName: string,
  script: string
) {
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  if (
    packageJson.scripts[scriptName] &&
    packageJson.scripts[scriptName] !== script
  ) {
    console.warn(
      `${scriptName} "${packageJson.scripts[scriptName]}" was overwritten`
    );
  }
  packageJson.scripts[scriptName] = script;
}

export function addDependency(
  packageJson: PackageJson,
  dependency: string,
  version = "*"
) {
  removeDevDependency(packageJson, dependency);
  if (!packageJson.dependencies) {
    packageJson.dependencies = {};
  }
  packageJson.dependencies[dependency] = version;
}

export function removeDependency(packageJson: any, dependency: string) {
  if (!packageJson.dependencies) {
    packageJson.dependencies = {};
  }
  delete packageJson.dependencies[dependency];
}

export function removeDevDependency(packageJson: any, dependency: string) {
  if (!packageJson.devDependencies) {
    packageJson.devDependencies = {};
  }
  delete packageJson.devDependencies[dependency];
}

export function addDevDependency(
  packageJson: any,
  dependency: string,
  version = "*"
) {
  removeDependency(packageJson, dependency);
  if (!packageJson.devDependencies) {
    packageJson.devDependencies = {};
  }
  packageJson.devDependencies[dependency] = version;
}

export type RemoveUndefined<T> = T extends undefined ? never : T;

// A type that gets all the keys matching `substr` from an interface
export type KeysMatching<T, substr extends string> = RemoveUndefined<
  {
    [K in keyof T]: K extends string
      ? Lowercase<K> extends `${string}${Lowercase<substr>}${string}`
        ? K
        : never
      : never;
  }[keyof T]
>;

function mergeDependenciesObj<
  T extends KeysMatching<PackageJson, "dependencies">
>({
  source,
  target,
  key,
}: {
  source: PackageJson;
  target: PackageJson;
  key: any;
}) {
  if (key in source) {
    if (!target[key]) {
      target[key] = {};
    }
    for (const depKey of Object.keys(source[key]!)) {
      target[key]![depKey] = source[key]![depKey];
    }
  }
}

export function mergePackageJSON({
  target,
  source,
}: {
  target: PackageJson;
  source: PackageJson;
}) {
  for (const key of Object.keys(source)) {
    if (/dependencies/i.test(key)) {
      mergeDependenciesObj({ source, target, key: key as any });
    } else if (/resolutions/.test(key)) {
      // Treat same as dependencies
      mergeDependenciesObj({ source, target, key: key as any });
    } else if (key === "workspaces") {
      // Ensure a unique array
      if (!target[key] || Array.isArray(target[key])) {
        target[key] = uniq([
          ...((target[key] as any) ?? []),
          ...((source[key] as any) ?? []),
        ]);
      } else {
        throw new Error(`Not sure how to merge workspaces: ${target[key]}`);
      }
    } else {
      target[key] = source[key];
    }
  }

  return target;
}

/**
 * Copies all files from one package dir to the other, ignoring node_modules, other .npmignored files.
 * Like yarn install but faster and one package only
 *
 * @param src - The source package directory
 * @param destination - The destination package directory
 */
export async function copyNPMPackage(
  src: string,
  destination: string
): Promise<void> {
  const npmIgnorePath = path.join(src, ".npmignore");

  // Initialize the ignore instance with default pattern for node_modules
  const ig = ignore().add("**/node_modules/**/*");

  // Add .npmignore patterns to the ignore instance
  if (existsSync(npmIgnorePath)) {
    const ignoredFiles = readFileSync(npmIgnorePath, "utf8").toString();
    ig.add(ignoredFiles);
  }

  // Filter function based on the ignore patterns
  function filterFunc(srcPath: string): boolean {
    const relativePath = path.relative(src, srcPath);
    if (relativePath === "/" || relativePath === "." || relativePath === "") {
      return true;
    }
    const filterr = !ig.ignores(relativePath);
    // console.log({ relativePath, filterr })
    return filterr;
  }

  try {
    // console.log({ src, destination })
    // Use fs-extra.copy() to copy the files
    await fsExtra.copy(src, destination, { filter: filterFunc });
  } catch (err) {
    console.error(err);
  }
}

export function findRootPackageJSON(currDir: string): string {
  const lockPath = path.resolve(currDir, "yarn.lock");
  const pnpmLockPath = path.resolve(currDir, "pnpm-lock.yaml");
  if (fse.existsSync(lockPath) || fse.existsSync(pnpmLockPath)) {
    return path.join(currDir, "package.json");
  } else {
    const upDir = path.resolve(currDir, "..");
    if (upDir === currDir) {
      throw new Error("Could not find yarn.lock or pnpm-lock.yaml");
    }
    return findRootPackageJSON(upDir);
  }
}

const getNpmPackageImportsFromFile = (path: string): string[] => {
  return findFileImports(path);
};

export function getNpmPackageImports(dir: string): Observable<string[]> {
  const watcher = chokidar.watch(dir, {
    ignoreInitial: true,
    cwd: dir,
    awaitWriteFinish: true,
  });

  return fromEventPattern(
    (handler) => watcher.on("all", handler),
    (handler) => watcher.off("all", handler)
  ).pipe(
    scan((acc: Record<string, string[]>, [event, path]: [string, string]) => {
      if (event === "add" || event === "change") {
        const fileImports = getNpmPackageImportsFromFile(path);
        acc[path] = fileImports;
      } else if (event === "unlink") {
        acc[path] = [];
      }
      return acc;
    }, {}),
    map((acc) => {
      const imports = Object.values(acc).flat();
      return uniq(imports);
    }),
    shareReplay({
      refCount: true,
    })
  );
}
