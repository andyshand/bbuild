import { ChildProcess } from "child_process";
import { ExecaChildProcess } from "execa";
import fs from "fs";
import path from "path";
import { EMPTY, merge, Observable, of, Subject } from "rxjs";
import {
  catchError,
  debounceTime,
  startWith,
  switchMap,
  tap,
} from "rxjs/operators";
import getUniverseConfig from "./config/universe";
import { watchFiles } from "./file/watchFiles";
import getModuleInfo from "./module/getModuleInfo";
import { projectPath } from "./path";
import { spawnProcess } from "./process/spawn";
import { spawnToObservable } from "./process/spawnToObservable";
import { DevConfig, DevJSON } from "./processes/dev";
import processFilesForBbuildImports from "./watch/findAllBbuildImports";

export async function getTaskStream(
  task: DevJSON["tasks"][0],
  config: DevConfig
) {
  const { filter } = config;
  const { name, watch: _watch, watchModules, config: taskConfig } = task;
  const watch = _watch ? (Array.isArray(_watch) ? _watch : [_watch]) : [];

  const { cmd, args } = parseTaskCmd(task);

  const cwd = task.cwd ?? projectPath();
  const env = { ...process.env, ...task.env };

  const color = getColorForTag(name ?? cmd);
  let latestSpawnedChild: ExecaChildProcess | null;
  const _spawnIt = () => {
    latestSpawnedChild = spawnProcess(cmd, args, cwd, watch, env, name, task);
    return latestSpawnedChild;
  };
  const restartTrigger = new Subject<void>();
  const watchFilesObservable1 = watchFiles(watch, cwd) as Observable<any>;

  let observables = [watchFilesObservable1, restartTrigger];

  const lastArg = args[args.length - 1];
  console.log({ lastArg, hello: 2 });

  if (lastArg?.endsWith(".js")) {
    const modulesToWatchSet = new Set(
      processFilesForBbuildImports(cwd, lastArg)
    );

    for (const m of modulesToWatchSet) {
      const result = await getModuleInfo(m, path.join(cwd, "modules", m));
      result.requiredOneModules.forEach((r) => modulesToWatchSet.add(r));
    }

    const modulesToWatchArray = Array.from(modulesToWatchSet);
    observables.push(watchFiles(modulesToWatchArray, "./built-modules"));
    console.log(`Task ${name} is watching modules - ${modulesToWatchArray}`);
  }

  const obs = merge(...observables).pipe(
    debounceTime(1000),
    tap((maybeFile) => {
      if (typeof maybeFile === "string") {
        console.log(`Restart because file changed: ${maybeFile}`);
      }
    }),
    startWith(null),
    switchMap((_) => {
      if (latestSpawnedChild && latestSpawnedChild.exitCode !== null) {
        console.log(`Process ${name ?? cmd} has already exited.`);
        // Process has already exited, no need to kill, directly spawn a new one
        return of(_spawnIt());
      } else if (latestSpawnedChild) {
        // Process is still running, need to kill it first
        return new Observable<ChildProcess>((observer) => {
          latestSpawnedChild.on("exit", () => {
            observer.next(_spawnIt()); // Respawn the process
            observer.complete(); // Complete the observable
          });
          latestSpawnedChild.kill("SIGTERM");
        });
      } else {
        // No child process exists, spawn a new one
        return of(_spawnIt());
      }
    }),
    switchMap((newChild) => {
      // console.log(`Spawning ${name ?? cmd}`);

      const childWithOnData = {
        onData: (cb: (data: string) => void) => {
          newChild.stdout?.on("data", (data) => {
            cb(data.toString());
          });
        },
      };

      return spawnToObservable(
        childWithOnData,
        filter,
        color,
        name,
        cmd,
        task.quiet
      );
    }),
    catchError((error) => {
      console.error("Error in process stream:", error);
      return EMPTY;
    })
  );
  return {
    obs,
    getLatestSpawnedChild: () => latestSpawnedChild,
    restart: () => {
      restartTrigger.next();
    },
  };
}

function randomColor(str: string) {
  const hash = Array.from(str).reduce((a, b) => {
    a = (a + b.charCodeAt(0)) % 255;
    return a;
  }, 0);
  return `hsl(${hash}, 100%, 20%)`;
}

export function getColorForTag(client: string) {
  if (client === "error") {
    return "red";
  } else if (client === "info") {
    return "blue";
  } else if (client === "warning" || client === "warn") {
    return "orange";
  } else if (client === "log") {
    return "#ccc";
  }
  return randomColor(client);
}

export function parseTaskCmd(task: DevJSON["tasks"][0]) {
  let cmd = task.cmd.trim().split(" ")[0];
  let args = task.cmd
    .trim()
    .split(" ")
    .slice(1)
    .concat(task.args)
    .filter((s) => !!s && !!s.trim().length);

  const nodeBins = [`yarn`, `tsx`, `ts-node`, "pnpm"];

  if (nodeBins.includes(cmd)) {
    // See if it exists at /usr/local/bin/${cmd}
    const binLocation1 = path.join(`/usr/bin/${cmd}`);
    if (fs.existsSync(binLocation1)) {
      cmd = binLocation1;
    } else {
      // Curr node version
      const { nodeBinPath } = getUniverseConfig();
      const binLocation = path.join(nodeBinPath, cmd);
      cmd = "node";
      args = [binLocation, "--", ...args];
    }
  }

  return { cmd, args };
}
