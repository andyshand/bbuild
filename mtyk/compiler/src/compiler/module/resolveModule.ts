import { projectPath } from "@/compiler/path";
import { uniq } from "@/util/dash";
import { debug } from "@/util/log";
import fs from "fs";
import fse from "fs-extra";
import path from "path";
import getUniverseConfig from "../config/universe";
import { getBuildContext } from "../context/buildContext";
import { cloneGithubFolder } from "../git";
import getModuleInfo from "./getModuleInfo";
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const isSymbolicLink = (src: string) => {
  return fs.statSync(src).isSymbolicLink();
};

const findFirstExistingSrc = (srcs: string[]) => {
  return srcs.find((s) => {
    const v = fs.existsSync(s) && !isSymbolicLink(s);
    return v;
  });
};

export async function resolveModule(
  module: string | any,
  resolvedAlready: Set<string>
) {
  debug(`Resolving module ${module}`);
  const { config } = getBuildContext();

  let moduleName: any = module;
  if (typeof moduleName === "object") {
    moduleName = module.name;
  }

  const defaultModulesFolderLocal = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "..",
    "default-modules"
  );

  // Below can be run in build/CI, but we always have local repo for now
  // Create symlink to local repo
  const srcs = [
    ...getUniverseConfig().repositories,
    defaultModulesFolderLocal,
  ].map((src) => path.join(src, moduleName));

  const dest = projectPath(path.join("modules", moduleName));

  // If destination exists and isn
  let copied = false;

  if (
    (await fse.pathExists(dest)) &&
    !(await fse.lstat(dest)).isSymbolicLink()
  ) {
    console.warn(
      `Using local module ${moduleName} instead of symlinking from core`
    );
  } else {
    let src = findFirstExistingSrc(srcs);
    // Check src exists
    if (!src || !(await fse.pathExists(src)) || process.env.CI) {
      // If not, try clone from remote repository
      let found = false;

      const defaultRepos = [
        "https://github.com/morethanyouknowltd/universe-core",
      ];
      for (const repository of uniq([
        ...(config.repositories ?? []),
        ...defaultRepos,
      ])) {
        try {
          src = await cloneGithubFolder(
            repository,
            path.join("modules", moduleName)
          );

          if (process.env.CI) {
            // If running in CI, we need to copy the files
            // to the destination instead of symlinking
            debug(`Copying ${src} to ${dest}`);
            fse.copySync(src, dest);
            copied = true;
            break;
          }
          found = true;
        } catch (e) {}
      }

      if (!found && !copied) {
        // Try to find in a remote repository
        throw new Error(
          `Couldn't find module called "${moduleName}" in "${src}"`
        );
      }
    }

    if (!copied && !fse.existsSync(dest)) {
      debug(`Symlinking ${src} to ${dest}`);
      await fse.ensureSymlink(src, dest, "dir");
    }
  }

  resolvedAlready.add(moduleName);

  const info = await getModuleInfo(moduleName, dest);
  for (const required of info.requiredOneModules) {
    if (!resolvedAlready.has(required)) {
      await resolveModule(required, resolvedAlready);
    }
  }
}
