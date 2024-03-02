import AsyncLock from "async-lock";
import debounce from "lodash/debounce";
import watch from "node-watch";
import path from "path";
import { getModuleBuildContext } from "../context/packageBuildContext";
import { findModules } from "./findModules";
import makeModulePackage from "./makeModulePackage";

export default async function watchModulesToPackage() {
  let paused = false;
  let moduleBuildPromises = [];
  let watchers = [];

  let builders = new Map<string, () => void>();
  const debouncedBuilderWithAsyncLock = (moduleName: string) => {
    let lock = new AsyncLock(moduleName);
    return debounce(async () => {
      await lock.acquire(moduleName, async () => {
        const moduleBuildContext = getModuleBuildContext(moduleName);
        await makeModulePackage(moduleBuildContext, moduleName);
      });
    }, 500);
  };

  async function initWatchersAndMakeInitialPackages() {
    const modules = findModules();
    for (const module of modules) {
      const moduleDistPath = path.join(module.path, "dist");
      const moduleName = module.name;
      if (!builders.has(moduleName)) {
        builders.set(moduleName, debouncedBuilderWithAsyncLock(moduleName));
      }
      const builder = builders.get(moduleName);

      moduleBuildPromises.push(builder());

      const handleFileChange = (e, filename) => {
        if (paused) return;
        console.log(`File ${filename} changed`);
        builder();
      };

      // Watch the 'dist' directory of each module
      const watcher = watch(
        moduleDistPath,
        { recursive: true },
        handleFileChange
      );
      watchers.push(watcher);
    }
  }

  // Initialise first time round
  await initWatchersAndMakeInitialPackages();

  // Wait for initial build of all modules
  await Promise.all(moduleBuildPromises);

  return {
    restart: () => {
      paused = false;
      // Close each watcher
      watchers.forEach((watcher) => watcher.close());
      watchers = [];
      moduleBuildPromises = [];

      initWatchersAndMakeInitialPackages();
    },
    pause: () => {
      paused = true;
    },
  };
}
