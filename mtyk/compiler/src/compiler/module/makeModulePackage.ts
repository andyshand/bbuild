import { getNativeDependencies } from "@/compiler/native-dependency";
import { projectPath } from "@/compiler/path";
import deleteDirectoryWithRetry from "@/util/deleteDirectoryWithRetry";
import { debug } from "@/util/log";
import fse, { copy, remove } from "fs-extra";
import _ from "lodash";
import path from "path";
import barrelify from "../barrelify";
import { getPackageOrg } from "../constants";
import { getBuildContext } from "../context/buildContext";
import { PackageBuildContext } from "../context/packageBuildContext";
import { addSourceRootToMaps } from "../file/addSourceRootToMaps";
import { copyChangedFilesOnly } from "../file/copyChangedFilesOnly";
import { readJSON } from "../json";
import makeExports from "../package/exports";
import getModuleInfo from "./getModuleInfo";

export default async function makeModulePackage(
  context: PackageBuildContext,
  name: string
) {
  const packageOrg = await getPackageOrg();
  const fullPackageName = `${packageOrg}/${name}`;
  const moduleFolder = projectPath("modules", name);
  const makePath = (p: string) => path.join(moduleFolder, p);

  await barrelify(`${moduleFolder}/src`);

  // Ensure src folder exists, otherwise we will confuse top-level source files
  // wiht output files
  const srcFolder = path.join(moduleFolder, "src");
  if (!fse.existsSync(srcFolder)) {
    throw new Error(`No src folder found in ${moduleFolder}`);
  }

  debug(`Making package for ${fullPackageName}`);

  const packageFolder = projectPath(`.universe/build/packages/${name}`);

  // Delete existing package folder, starting fresh
  if (await fse.pathExists(packageFolder)) {
    await deleteDirectoryWithRetry(packageFolder);
  }
  await fse.ensureDir(packageFolder);

  const makePackagePath = (p: string) => path.join(packageFolder, p);

  // Make package/dist folder
  await fse.ensureDir(path.join(packageFolder, "dist/cjs"));
  // await fse.ensureDir(path.join(packageFolder, "/cjs"));

  context.setMessage(`Creating package/dist/cjs`);

  const moduleInfo = await getModuleInfo(name, moduleFolder);
  const packageJSON = await readJSON(makePath("package.json"));
  // console.log({ path: makePath('package.json'), packageJSON })
  const packagePackage = {
    ...packageJSON,
    dependencies: {
      ...packageJSON.dependencies,
      ..._(moduleInfo.requiredOneModules)
        .map((mod) => [`${packageOrg}/${mod}`, `workspace:^`])
        .fromPairs()
        .value(),
    },
  };
  await makeExports(
    context,
    name,
    moduleFolder,
    {
      private: true,
      initialPackageJSON: packagePackage,
    },
    packageFolder
  );

  const dirDir = makePath(`dist`);
  if (!fse.existsSync(dirDir)) {
    // No dist folder available yet
    throw new Error(`${name} - No dist folder available yet`);
  }

  const builtModuleDir = projectPath("built-modules");
  const builtModuleModulePath = path.join(builtModuleDir, name);

  // Copy all files from dist to package
  {
    // if package has native dependency, include the universal dependency as a symlink
    const nativeDependency = getNativeDependencies(name);
    if (nativeDependency != undefined) {
      console.log("Making symlink for native dependency");
      await fse.ensureSymlink(
        nativeDependency.universalPath,
        makePackagePath("native"),
        "dir"
      );
    }

    context.setMessage(`Copying dist files to package/`);
    if (!fse.existsSync(makePath("dist"))) {
      console.log(`No dist folder available yet, `, makePath("dist"));
      return;
    }
    await copy(makePath("dist"), packageFolder);
    if (!fse.existsSync(makePackagePath("cjs"))) {
      throw new Error(`Module ${name} is not compiled yet`);
    }
    await copy(makePackagePath("cjs"), makePackagePath("dist/cjs"));
    await remove(makePackagePath("cjs"));
    await fse.ensureDir(builtModuleModulePath);

    await copyChangedFilesOnly(
      packageFolder,
      builtModuleModulePath,
      {
        ignore: ["**/*.tsbuildinfo", "**/touch.js"],
      },
      true
    );

    if (getBuildContext().isWatchMode) {
      addSourceRootToMaps(name, builtModuleDir, projectPath("modules"));
    }
  }

  // Instead of running yarn again, manually copy over to node_modules
  {
    let nodeModulesModulePath = path.join(
      projectPath(),
      "node_modules",
      fullPackageName
    );

    // Check if symlink, if so, yarn has linked it elsewhere in the tree. Follow the link and copy files there, instead

    if (fse.existsSync(nodeModulesModulePath)) {
      const nodeModulesStats = await fse.lstat(nodeModulesModulePath);
      if (nodeModulesStats.isSymbolicLink()) {
        const realPath = await fse.realpath(nodeModulesModulePath);
        nodeModulesModulePath = realPath;
        // Ensure real path is still inside the same node_modules root
        if (!nodeModulesModulePath.startsWith(projectPath("node_modules"))) {
          throw new Error(
            `Real path of ${nodeModulesModulePath} is not inside node_modules?`
          );
        }
      }
    }

    await fse.ensureDir(nodeModulesModulePath);
    context.setMessage("Copying to node_modules");

    try {
      await copyChangedFilesOnly(builtModuleModulePath, nodeModulesModulePath);
    } catch {
      console.log("Failed to copy to node_modules");
    }
  }
}
