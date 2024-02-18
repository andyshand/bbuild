import watch from "node-watch";
import path from "path";
import {
  getModuleBuildContext,
  PackageBuildContext,
} from "../context/packageBuildContext";
import { Logger } from "../logging";
import { findModules } from "./findModules";
import makeModulePackage from "./makeModulePackage";
import { delay, Subject } from "rxjs";

export default async function watchModulesToPackage(
  modulesChangeSubject: Subject<unknown>
) {
  const changedModules = new Map<string, string>();

  const makeModuleInWatch = async function (
    context: PackageBuildContext,
    moduleName: string
  ) {
    await makeModulePackage(context, moduleName).catch((err) => {
      watchers.forEach((watcher) => watcher.close());
      console.error(`Error occurred making module ${moduleName}`);
      throw err;
    });
  };
  let moduleBuildPromises = [];
  let watchers = [];
  async function doIt() {
    const modules = findModules();
    modules.forEach((module) => {
      const moduleDistPath = path.join(module.path, "dist");
      const moduleName = module.name;
      const modulePath = module.path;

      moduleBuildPromises.push(
        makeModuleInWatch(getModuleBuildContext(modulePath), moduleName)
      );

      const handleFileChange = (filePath, event) => {
        if (!changedModules.has(moduleName))
          changedModules.set(moduleName, modulePath);
      };

      // Watch the 'dist' directory of each module
      const watcher = watch(
        moduleDistPath,
        { recursive: true },
        handleFileChange
      );
      watchers.push(watcher);
    });
  }

  const subscription = modulesChangeSubject
    .pipe(
      delay(500) // Delay each emission by 500ms
    )
    .subscribe(async () => {
      console.log(`Changed Modules: ${Array.from(changedModules.keys())}`);

      for (const [moduleName, modulePath] of changedModules) {
        Logger.withLogGroup(`watchModulesToPackage`, async () => {
          await makeModuleInWatch(
            getModuleBuildContext(modulePath),
            moduleName
          );
        });
      }

      changedModules.clear();
    });

  await doIt();
  await Promise.all(moduleBuildPromises);
  return {
    stop: () => {
      subscription.unsubscribe();
      // Close each watcher
      watchers.forEach((watcher) => watcher.close());
      watchers = [];
      moduleBuildPromises = [];
    },
  };
}
