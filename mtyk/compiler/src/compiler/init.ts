import fs from "fs";
import fsp from "fs/promises";
import * as path from "path";
import { addDevDependency } from "./package/package";
import { readJSON, writeJSON } from "./json";
import { getPackageConfig } from "./config/workflow";

import { PackageJson } from "type-fest";
import { TS_CONFIG } from "./ts/tsconfig";
import { isEqual } from "@/util/dash";
export type InitTSConfig = (tsconfig: any) => void;
export type InitPackageJSON = (packageJSON: Partial<PackageJson>) => void;

export interface InitOptions {
  gitignore?: boolean;
  prettier?: boolean;
  packageJSON?: boolean | InitPackageJSON;
  scripts?: boolean;
  dependencies?: boolean;
  npmIgnore?: boolean;
  private?: boolean;
  vscode?: boolean;
  tsconfig?: boolean | InitTSConfig;
}
const defaultOptions = {
  gitignore: true,
  prettier: true,
  packageJSON: true,
  private: true,
  scripts: true,
  dependencies: true,
  npmIgnore: true,
  vscode: true,
  tsconfig: true,
};

export default async function initProject(
  folder: string,
  opts: InitOptions = defaultOptions
) {
  opts = Object.assign(defaultOptions, opts);

  const config = await getPackageConfig(folder);
  const makePath = (...paths: string[]) => path.join(folder, ...paths);

  // Edit package.json
  const packageJson: PackageJson = {
    name: config.name,
    version: "0.0.1",
  };
  try {
    Object.assign(packageJson, await readJSON(makePath("package.json")));
  } catch (e) {
    // Ignore
  }

  // Deps
  addDevDependency(packageJson, "@tsconfig/node16", "^1.0.3");
  addDevDependency(packageJson, "typescript", "4.9.5");

  // Add all subpaths as exports to package.json
  const rootFolder = fs.existsSync(path.join(folder, "src")) ? "src" : ".";

  async function iterateDirs(forFolder: string, isTopLevel = false) {
    const subpaths = await fsp.readdir(forFolder);
    for (const subpath of subpaths) {
      const subpathPath = path.join(forFolder, subpath);
      if (
        subpath === "node_modules" ||
        subpath === "dist" ||
        subpath.startsWith(".")
      ) {
        continue;
      }
      const isDir = fs.statSync(subpathPath).isDirectory();
      if (
        isDir ||
        (isTopLevel && /\.tsx?$/.test(subpath) && !/\.d\.ts$/.test(subpath))
      ) {
        if (isDir) {
          await iterateDirs(subpathPath);
        }
        // Remove prefix from path
        const relativePath = subpathPath.replace(
          path.join(folder, rootFolder),
          ""
        );
        const relativeSubpath = relativePath.replace(
          path.join(folder, rootFolder),
          ""
        );
        const esmRoot = ".";
        const cjsRoot = "./dist/cjs";

        if (isDir) {
          packageJson.exports["." + relativePath + "/*"] = {
            import: `${esmRoot}${relativeSubpath}/*.js`,
            require: `${cjsRoot}${relativeSubpath}/*.js`,
          };

          // If it has an index.js
          if (
            true ||
            fs.existsSync(path.join(subpathPath, "index.ts")) ||
            fs.existsSync(path.join(subpathPath, "index.tsx"))
          ) {
            packageJson.exports["." + relativePath] = {
              import: `${esmRoot}${relativeSubpath}/index.js`,
              require: `${cjsRoot}${relativeSubpath}/index.js`,
            };
          }
        } else {
          const jsPath = relativeSubpath.replace(".ts", ".js");
          packageJson.exports["." + relativePath.replace(/\.ts$/, "")] = {
            import: `${esmRoot}${jsPath}`,
            require: `${cjsRoot}${jsPath}`,
          };
        }
      }
    }
  }

  if (config.export !== false) {
    // CJS, ESM setup
    delete packageJson.type;
    delete packageJson.index;
    Object.assign(packageJson, {
      main: `dist/cjs/index.js`,
      index: `dist/cjs/index.js`,
      module: `index.js`,
    });
    Object.assign(packageJson, {
      exports: {
        ".": {
          import: "./index.js",
          require: "./dist/cjs/index.js",
        },
        "./package.json": "./package.json",
      },
    });
    await iterateDirs(path.join(folder, rootFolder), true);

    if (!opts.private) {
      // Assign publish config
      Object.assign(packageJson, {
        publishConfig: {
          access: "public",
          registry: "https://registry.npmjs.org/",
        },
      });
    }
  }

  // Give config chance to edit package.json
  if (config.packageJSON) {
    await config.packageJSON?.(packageJson);
  }

  // Give config chance to edit package.json
  if (typeof opts.packageJSON === "function") {
    await opts.packageJSON(packageJson);
  }

  // Update package.json
  await writeJSON(makePath("package.json"), packageJson);

  const sharedIgnore = [
    `.DS_Store`,
    "*.env",
    "*.env.*",
    "node_modules",

    // Keys/Certs
    "*.key",
    "*.key.*",
    "*.pem",
    "*.pem.*",
    "*.crt",
    "*.crt.*",
    "*.cer",
    "*.cer.*",
  ];

  if (opts.gitignore) {
    // Add .gitignore
    await fsp.writeFile(
      makePath(".gitignore"),
      [
        "*.js",
        "*.jsx",
        "*.d.ts",
        "*.d.ts.map",
        "*.js.map",
        "dist",
        ...sharedIgnore,
      ].join("\n") + "\n"
    );
  }
  if (opts.npmIgnore) {
    // Add .npmignore
    await fsp.writeFile(
      makePath(".npmignore"),
      [...sharedIgnore].join("\n") + "\n"
    );
  }

  if (opts.tsconfig) {
    if (config.overrides?.tsconfig !== true) {
      // Exclude all source files from compilation
      // const { compiledFiles } = await getSourceFiles(folder)
      // tsConfig.exclude = uniq([
      //   ...tsConfig.exclude,
      //   ...compiledFiles.map(f => './' + projectRelative(f)),
      // ])

      // Give config chance to edit tsconfig.json
      if (config.tsConfig) {
        await config.tsConfig?.(TS_CONFIG);
      }
      if (typeof opts.tsconfig === "function") {
        await opts.tsconfig?.(TS_CONFIG);
      }

      let currentTsConfig;
      if (fs.existsSync(makePath("tsconfig.json"))) {
        currentTsConfig = await readJSON(makePath("tsconfig.json"));
      }

      // Compare and write if different or if the file doesn't exist
      if (!currentTsConfig || !isEqual(currentTsConfig, TS_CONFIG)) {
        await writeJSON(makePath("tsconfig.json"), TS_CONFIG);
      }
    }
  }
}
