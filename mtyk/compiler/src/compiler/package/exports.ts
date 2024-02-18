import fse from "fs-extra";
import path from "path";
import { getPackageOrg } from "../constants";
import { PackageBuildContext } from "../context/packageBuildContext";
import { writeJSON } from "../json";

export default async function makeExports(
  context: PackageBuildContext,
  moduleName: string,
  moduleFolder: string,
  opts = { private: true, initialPackageJSON: undefined },
  packageOutputDir: string
) {
  const modulePackageJson =
    opts.initialPackageJSON ??
    (await fse.readJSON(path.join(moduleFolder, "package.json")));
  const packageOrg = await getPackageOrg();
  const distPackageJson = {
    name: `${packageOrg}/${moduleName}`,
    version: modulePackageJson.version,
    exports: {} as Record<string, any>,
    bin: modulePackageJson.bin,
    peerDependencies: modulePackageJson.peerDependencies,
    dependencies: modulePackageJson.dependencies,
    devDependencies: modulePackageJson.devDependencies,
    optionalDependencies: modulePackageJson.optionalDependencies,
  };
  const srcDir = "src";

  async function iterateDirs(forFolder: string, isTopLevel = false) {
    const subpaths = await fse.readdir(forFolder);
    for (const subpath of subpaths) {
      const subpathPath = path.join(forFolder, subpath);
      if (
        subpath === "node_modules" ||
        subpath === "dist" ||
        subpath.startsWith(".")
      ) {
        continue;
      }
      const isDir = fse.statSync(subpathPath).isDirectory();
      if (
        isDir ||
        (isTopLevel &&
          (/\.tsx?$/.test(subpath) ||
            /\.jsx?$/.test(subpath) ||
            /\.mjs$/.test(subpath)) &&
          !/\.d\.ts$/.test(subpath))
      ) {
        if (isDir) {
          await iterateDirs(subpathPath);
        }
        // Remove prefix from path
        const relativePath = subpathPath.replace(
          path.join(moduleFolder, srcDir),
          ""
        );
        const relativeSubpath = relativePath.replace(
          path.join(moduleFolder, srcDir),
          ""
        );
        const esmRoot = ".";
        const cjsRoot = "./dist/cjs";

        if (isDir) {
          distPackageJson.exports["." + relativePath + "/*"] = {
            import: `${esmRoot}${relativeSubpath}/*.js`,
            require: `${cjsRoot}${relativeSubpath}/*.js`,
          };

          // If it has an index.js
          if (
            fse.existsSync(path.join(subpathPath, "index.ts")) ||
            fse.existsSync(path.join(subpathPath, "index.tsx"))
          ) {
            distPackageJson.exports["." + relativePath] = {
              import: `${esmRoot}${relativeSubpath}/index.js`,
              require: `${cjsRoot}${relativeSubpath}/index.js`,
            };
          }
        } else {
          const jsPath = relativeSubpath
            .replace(/\.(j|t)sx?$/, ".js")
            .replace(".mjs$", ".js");
          distPackageJson.exports[
            "." + relativePath.replace(/\.(j|t)sx?$/, "")
          ] = {
            import: `${esmRoot}${jsPath}`,
            require: `${cjsRoot}${jsPath}`,
          };
        }
      }
    }
  }

  // CJS, ESM setup
  Object.assign(distPackageJson, {
    main: `dist/cjs/index.js`,
    index: `dist/cjs/index.js`,
    module: `index.js`,
  });

  Object.assign(distPackageJson, {
    exports: {
      ".": {
        import: "./index.js",
        require: "./dist/cjs/index.js",
      },
      "./package.json": "./package.json",
    },
  });

  await iterateDirs(path.join(moduleFolder, srcDir), true);

  if (!opts.private) {
    // Assign publish config
    Object.assign(distPackageJson, {
      publishConfig: {
        access: "public",
        registry: "https://registry.npmjs.org/",
      },
    });
  }

  // Write main package.json
  await writeJSON(path.join(packageOutputDir, "package.json"), distPackageJson);

  // Add a package.json to the cjs directory only
  const packageJSON = {
    type: "commonjs",
  };

  await writeJSON(
    path.join(packageOutputDir, "dist", "cjs", "package.json"),
    packageJSON
  );

  return {
    path: path.join(moduleFolder, "dist"),
    packageJson: distPackageJson,
  };
}
