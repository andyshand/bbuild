import assert from "@/util/assert";
import execa from "execa";
import { getBinLocation } from "../bin";
import { removeGlobAsync } from "../file/glob";
import { ModulesWatcher } from "../module/ModulesWatcher";
import { findModules } from "../module/findModules";
import getModuleInfo from "../module/getModuleInfo";
import watchModulesToPackage from "../module/watchModulesToPackage";
import { projectPath } from "../path";
import { spawnStoppableProcess } from "../process/spawn";
import { cjs, esm, prebuild } from "./prebuild";

/**
 * Resolves once initial watch/compilation step has completed, then continues to run indefinitely
 */
export async function watch({
  onNeedsPrebuild,
}: {
  onNeedsPrebuild?: () => Promise<void>;
}): Promise<void> {
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

  let watchState: {
    esmSpawn: ReturnType<typeof spawnStoppableProcess> | null;
    cjsSpawn: ReturnType<typeof spawnStoppableProcess> | null;
    moduleWatcher: ModulesWatcher;
    waitingForInitialSuccess: boolean;
    initialRun: boolean;
    watcherHandle: Awaited<ReturnType<typeof watchModulesToPackage>> | null;
    restarting: boolean;
    moduleRebuild: Record<string, { hash: string }>;
  } = {
    esmSpawn: null,
    cjsSpawn: null,
    moduleWatcher: new ModulesWatcher(),
    waitingForInitialSuccess: true,
    initialRun: true,
    watcherHandle: null,
    restarting: false,
    moduleRebuild: {},
  };

  /**
   * Restarts the package watcher if it's not already restarting.
   */
  const restartPackageWatcher = async () => {
    if (watchState.restarting) {
      return;
    }
    watchState.restarting = true;
    if (watchState.watcherHandle) {
      watchState.watcherHandle.restart();
    } else {
      // Initialise the watcher handle
      watchState.watcherHandle = await watchModulesToPackage();
    }
    watchState.restarting = false;
  };

  return new Promise(async (resolve, reject) => {
    /**
     * Handles data event from tsc process
     * @param {Buffer} data - Data received from tsc process
     */
    const onData = async (data) => {
      if (!watchState.waitingForInitialSuccess) {
        return;
      }

      const message = data.toString();
      if (message.includes("Found 0 errors. Watching for file changes.")) {
        watchState.waitingForInitialSuccess = false;
        restartPackageWatcher();
        resolve();
      }
    };

    /**
     * Starts the TypeScript compilation process
     */
    const startTSC = async () => {
      if (watchState.esmSpawn || watchState.cjsSpawn) {
        watchState.cjsSpawn.stop();
        watchState.esmSpawn.stop();
      }
      if (!watchState.initialRun) {
        prebuild();
      }
      watchState.esmSpawn = spawnCompilationProcess(true);
      watchState.cjsSpawn = spawnCompilationProcess(false);
      watchState.cjsSpawn.proc.stdout.on("data", onData);
      watchState.initialRun = false;
    };

    /**
     * Populates initial information for modules
     */
    const createModuleHash = (info) =>
      JSON.stringify({
        requiredOneModules: info.requiredOneModules,
        allDeps: info.allDeps ?? {},
      });

    const populateInitialInfo = async () => {
      for (const modulee of findModules()) {
        const modulePath = projectPath("modules/" + modulee.name);
        const info = await getModuleInfo(modulee.name, modulePath);

        watchState.moduleRebuild[modulee.name] = {
          hash: createModuleHash(info),
        };
      }
    };

    /**
     * Checks if a module requires a new prebuild based on changes
     * @param {string} moduleName - Name of the module to check
     */
    const checkModuleRequiresNewPrebuildd = async (moduleName: string) => {
      const modulePath = projectPath("modules/" + moduleName);
      const info = await getModuleInfo(moduleName, modulePath);

      const currentHash = createModuleHash(info);

      if (
        watchState.moduleRebuild[moduleName].hash &&
        watchState.moduleRebuild[moduleName].hash !== currentHash
      ) {
        watchState.moduleRebuild[moduleName].hash = currentHash;
        console.log("Rebuilding due to module change: ", moduleName);
        watchState.watcherHandle.pause();
        if (onNeedsPrebuild) {
          await onNeedsPrebuild();
        }
        watchState.watcherHandle.restart();
        return;
      }
    };

    await populateInitialInfo();
    watchState.moduleWatcher.on("changed", async (event) => {
      if ((event || "").includes("src")) {
        const module = (event || "").split("/").pop();
        checkModuleRequiresNewPrebuildd(module);
      }
    });

    startTSC();
  });
}
