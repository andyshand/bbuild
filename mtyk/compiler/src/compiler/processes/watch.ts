import assert from "@/util/assert";
import { debounce } from "@/util/dash";
import execa from "execa";
import { getBinLocation } from "../bin";
import { ModulesWatcher } from "../module/ModulesWatcher";
import watchModulesToPackage from "../module/watchModulesToPackage";
import { spawnStoppableProcess } from "../process/spawn";
import { cjs, esm, prebuild } from "./prebuild";
import { removeGlobAsync } from "../file/glob";
import { projectPath } from "../path";
import { Subject } from "rxjs";
import { getBuildContext } from "../context/buildContext";
import getModuleInfo from "../module/getModuleInfo";
import { readJSON } from "../json";
import path from "path";
import { initModule } from "../module/initModule";
import { findModules } from "../module/findModules";

export async function watch(): Promise<void> {
  let isFirstRun = true;
  const modulesChangeSubject = new Subject();

  const tsc = getBinLocation("tsc");
  assert(
    !!tsc,
    `Could not find tsc in node_modules/.bin. Is it installed in the workspace?`
  );

  const version = await execa(tsc, ["-v"]).catch((err) => {
    console.error("Error getting TypeScript version:", err);
    return { stdout: "unknown" };
  });
  console.log(`Running tsc ${version.stdout.toString()} from ${tsc}`);

  const spawnCompilationProcess = (isEsm) => {
    const format = isEsm ? "esm" : "cjs";
    const args = isEsm
      ? esm("-w", "--preserveWatchOutput").slice(1)
      : cjs("-w", "--preserveWatchOutput").slice(1);
    const label = `tsc-${format}`;
    return spawnStoppableProcess(tsc, args, { label });
  };
  await removeGlobAsync(projectPath("./node-modules/@bbuild"));
  let esmSpawn = spawnCompilationProcess(true);
  let cjsSpawn = spawnCompilationProcess(false);

  const stop = async () => {
    esmSpawn.stop();
    cjsSpawn.stop();
  };

  let moduleWatcher = new ModulesWatcher();

  return new Promise((resolve, reject) => {
    const onData = async (data) => {
      const message = data.toString();
      const regex = /Found (\d+) error/;
      if (regex.test(message)) {
        const numberOfErrors = message.match(regex)[1];
        if (parseInt(numberOfErrors) > 0 && isFirstRun) {
          try {
            const watcher = await watchModulesToPackage(modulesChangeSubject);
            watcher.stop();
            console.log(
              "Some modules are built. Fix errors and await for another compiling cycle..."
            );
          } catch (err) {
            console.log(
              "Some modules are built. Fix errors and await for another compiling cycle..."
            );
          }
        }

        if (message.includes("Found 0 errors. Watching for file changes.")) {
          if (!isFirstRun) {
            console.log("Modules changed. Rebuilding...");
            modulesChangeSubject.next(null);
            return;
          }

          try {
            await watchModulesToPackage(modulesChangeSubject);
            if (getBuildContext().isWatchMode) {
              console.log("All modules are built. Starting dev environment...");
              isFirstRun = false;
            } else {
              console.log("All modules are built.");
            }

            resolve();
          } catch (err) {
            throw err;
          }
        }
      }
    };

    cjsSpawn.proc.stdout.on("data", onData);

    const ignoredModules = new Set();

    moduleWatcher.on("changed", async (event) => {
      if ((event || "").includes("src")) {
        try {
          const modules = findModules();
          let currentCjsTsConfig = null;
          const module = (event || "").split("/").pop();
          const modulePath = projectPath("modules/" + module);
          const info = await getModuleInfo(module, modulePath);
          const uniqueRequiredOneModules = [
            ...new Set(info.requiredOneModules),
          ];

          currentCjsTsConfig = await readJSON(
            path.join(modulePath, "tsconfig.cjs.json")
          );

          if (currentCjsTsConfig && currentCjsTsConfig.references) {
            // Checking if the number of modules is the same
            const sameNumberOfModules =
              uniqueRequiredOneModules.length ===
              currentCjsTsConfig.references.length;

            const missingModules = uniqueRequiredOneModules.reduce(
              (accumulator, requiredModule) => {
                const isPresent = currentCjsTsConfig.references.some(
                  (reference) => reference.path.includes(requiredModule)
                );

                if (!isPresent) {
                  accumulator.push(requiredModule);
                }

                return accumulator;
              },
              []
            );

            if (sameNumberOfModules && missingModules.length === 0) {
              return;
            }

            if (
              missingModules.length > 0 &&
              missingModules.filter((m2) => !modules.some((m) => m2 === m.name))
                .length > 0
            ) {
              console.log(
                "Some required modules are missing in references and aren't in modules folder."
              );
              moduleWatcher.muteEvent("changed");
              await stop();
              await prebuild();
              esmSpawn = spawnCompilationProcess(true);
              cjsSpawn = spawnCompilationProcess(false);
              cjsSpawn.proc.stdout.on("data", onData);
              moduleWatcher.unmuteEvent("changed");
              return;
            }
            ignoredModules.add(module);
            console.log("Some required modules are missing in references.");
            await stop();
            await initModule({ name: module, path: modulePath });
            esmSpawn = spawnCompilationProcess(true);
            cjsSpawn = spawnCompilationProcess(false);
            cjsSpawn.proc.stdout.on("data", onData);

            setTimeout(() => {
              ignoredModules.delete(module);
            }, 500);
            return;
          }
          return;
        } catch (err) {
          console.log(err);
        }
      }
      if (!ignoredModules.has(event)) {
        stop();
        esmSpawn = spawnCompilationProcess(true);
        cjsSpawn = spawnCompilationProcess(false);
        cjsSpawn.proc.stdout.on("data", onData);
      }
    });
  });
}
