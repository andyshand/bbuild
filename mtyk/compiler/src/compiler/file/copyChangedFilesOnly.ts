import fse from "fs-extra";
import glob from "glob";
import path from "path";
import { promisify } from "util";
import { hasCacheChanged } from "../cache";
import { getPackageOrg } from "../constants";
import { modifyAndWrite } from "./addSourceRootToMaps";
import { slowFilehash as filesEqual } from "./hash";

const globAsync = promisify(glob);

export async function copyChangedFilesOnly(
  directory: string,
  destination: string,
  options = {},
  convertModules = false
) {
  try {
    const packageOrg = await getPackageOrg();
    const pattern = `${directory}/**/*`;

    if (!(await hasCacheChanged(pattern, options, directory + destination))) {
      return;
    }

    const files = await globAsync(pattern, options);
    const copyTasks = files.map((filePath) =>
      copyFileTask(filePath, directory, destination, convertModules, packageOrg)
    );
    await Promise.all(copyTasks);
  } catch (error) {
    console.error(`Error during file copy: ${error}`);
  }
}

async function copyFileTask(
  filePath,
  directory,
  destination,
  convertModules,
  packageOrg
) {
  try {
    const destinationFile = path.join(
      destination,
      filePath.slice(directory.length)
    );

    if (await isNativeModule(filePath)) {
      await createSymlinkIfNeeded(filePath, destinationFile);
      return;
    }

    const isDirectory = !/\.[a-z]+$/.test(filePath);
    if (isDirectory) {
      await fse.ensureDir(destinationFile);
    } else {
      await copyNonDirectoryFile(
        filePath,
        destinationFile,
        convertModules,
        packageOrg
      );
    }
  } catch (error) {
    console.error(`Error in copyFileTask for ${filePath}: ${error}`);
  }
}

async function isNativeModule(filePath) {
  const nativeModulePatterns = [
    /built-modules\/.*\/native/,
    /packages\/.*\/native/,
  ];
  return nativeModulePatterns.some((pattern) => pattern.test(filePath));
}

async function createSymlinkIfNeeded(filePath, destinationFile) {
  if (path.basename(filePath) === "native" && !filePath.includes("/native/")) {
    await fse.ensureSymlink(filePath, destinationFile);
  }
}

async function copyNonDirectoryFile(
  filePath,
  destinationFile,
  convertModules,
  packageOrg
) {
  const containerDir = path.dirname(destinationFile);
  await fse.ensureDir(containerDir);

  if (
    (await fse.pathExists(destinationFile)) &&
    (await filesEqual(filePath, destinationFile))
  ) {
    return;
  }

  if (!filePath.endsWith(".map") && convertModules) {
    await modifyAndWrite(filePath, destinationFile, (src) => {
      return src
        .toString()
        .replace(
          /['"]modules\/([^'"]+)['"]/g,
          (_match, moduleName) => `'${packageOrg}/${moduleName}'`
        );
    });
  } else {
    await fse.copyFile(filePath, destinationFile);
  }
}
