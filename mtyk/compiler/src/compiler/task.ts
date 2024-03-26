import fs from "fs";
import path from "path";
import { merge, Observable, Subject } from "rxjs";
import { debounceTime, map } from "rxjs/operators";
import getUniverseConfig from "./config/universe";
import { watchFiles } from "./file/watchFiles";
import { projectPath } from "./path";
import { spawnProcess as spawnRestartableProcess } from "./process/spawnProcess";
import { observableFromSpawn } from "./process/spawnToObservable";
import { DevConfig, DevJSON } from "./processes/DevConfig";

export async function getTaskStream(
  task: Omit<DevJSON["tasks"][0], "env"> & {
    env: Record<string, string>;
  },
  config: DevConfig
) {
  const { filter } = config;
  const { name, watch: _watch, watchModules, config: taskConfig } = task;
  const watch = _watch ? (Array.isArray(_watch) ? _watch : [_watch]) : [];

  const { cmd, args } = parseTaskCmd(task);

  const cwd = task.cwd ?? projectPath();
  const env = { ...process.env, ...task.env };

  const color = getColorForTag(name ?? cmd);
  const childHandle = spawnRestartableProcess(
    cmd,
    args,
    cwd,
    watch,
    env,
    name,
    task
  );
  const restartTrigger = new Subject<void>();
  const watchFilesObservable1 = watchFiles(watch, cwd) as Observable<any>;

  const childObs = childHandle.getChildProcessObs();
  let observables = [watchFilesObservable1, restartTrigger];

  const fileChangeListener = merge(...observables).pipe(debounceTime(1000));
  fileChangeListener.subscribe({
    next: (maybeFile) => {
      if (typeof maybeFile === "string") {
        console.log(`Restart because file changed: ${maybeFile}`);
        childHandle.killAndRestart();
      }
    },
  });

  return {
    childObs: childObs.pipe(
      map((child) => {
        const childWithOnData = {
          onData: (cb: (data: string) => void) => {
            child.stdout?.on("data", (data) => {
              cb(data.toString());
            });
          },
        };

        return observableFromSpawn(childWithOnData);
      })
    ),
    getChildHandle: () => childHandle,
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
