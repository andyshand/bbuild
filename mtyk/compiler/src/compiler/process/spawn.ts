import { DevJSON } from "../processes/dev";
import require from "../require";
import { getColorForTag } from "../task";
import { formatConsole } from "./spawnToObservable";
import execa, { ExecaChildProcess } from "execa";

export function spawnProcess<PTY extends boolean>(
  cmd: string,
  args: string[],
  cwd: string,
  watch: string[],
  env: { [x: string]: string; TZ?: string },
  name: string = cmd,
  task: DevJSON["tasks"][0]
): ExecaChildProcess {
  console.log(
    `Starting task "${cmd} ${args.join(" ")}" in ${cwd}, watching [${watch.join(
      ","
    )}]`
  );

  if (task?.config === true) {
    // populate env using config module
    try {
      const resolved = require.resolve("@bbuild/config", {
        paths: [cwd],
      });
      const config = require(resolved)._getEntireConfig();
      env = { ...env, ...config };
      console.log(
        `Populated env for ${name} from config module: ${JSON.stringify(
          config
        )}`
      );
    } catch (e) {
      console.log(`Error loading @bbuild/config module for ${name}`);
    }
  }

  // Resize the terminal window if needed
  process.stdout.write("\x1b[8;30;80t"); // Resize to 80 columns and 30 rows

  const childProcess = execa(cmd, args, {
    cwd,
    env,
    stdio: "pipe",
    maxBuffer: 104857600,
  });

  childProcess.on("exit", (exitCode, signal) => {
    console.log(
      formatConsole(
        [
          `[${new Date().toISOString()}] Task "${name}" exited with code ${exitCode} and signal ${signal}`,
        ],
        getColorForTag(name),
        name,
        cmd
      ).join("\n")
    );
  });
  childProcess
    .then(() => {})
    .catch((error) => {
      if (error.signal === "SIGTERM") return;
      console.log(
        formatConsole(
          [`[${new Date().toISOString()}] ${error.message}}`],
          getColorForTag(name),
          name,
          cmd
        ).join("\n")
      );
    });

  return childProcess;
}

interface SpawnStoppableProcessOptions extends execa.Options {
  label?: string;
  onFinish?: () => void;
}

export function spawnStoppableProcess(
  cmd: string,
  args: string[],
  opts: SpawnStoppableProcessOptions = {}
): { proc: execa.ExecaChildProcess; stop: () => void } {
  const { label = cmd.split("/").pop(), onFinish, ...execaOptions } = opts;
  if (cmd.includes("tsc")) {
    args.unshift(cmd);
    args.unshift("--max-old-space-size=4096");

    cmd = "node";
  }
  const subprocess = execa(cmd, args, {
    cwd: execaOptions.cwd || process.cwd(),
    all: true,
    maxBuffer: 104857600,
    ...execaOptions,
  });

  subprocess.all?.on("data", (data) => {
    console.log(
      formatConsole(
        data.toString()?.split("\n"),
        getColorForTag(label),
        label,
        cmd
      ).join("\n")
    );
  });

  subprocess
    .then(() => {
      onFinish?.();
    })
    .catch((error) => {
      // console.log(error.message);
      if (error.signal === "SIGTERM") {
        console.log(
          formatConsole(
            [
              `[${new Date().toISOString()}] Task "${label}" exited with code ${
                error.code
              } with signal ${error.signal}`,
            ],
            getColorForTag(label),
            label,
            cmd
          ).join("\n")
        );
      } else {
        console.log(
          formatConsole(
            [`[${new Date().toISOString()}] ${error.message}}`],
            getColorForTag(label),
            label,
            cmd
          ).join("\n")
        );
      }
    });

  return {
    proc: subprocess,
    stop() {
      if (subprocess && !subprocess.killed) {
        subprocess.kill(); // Send SIGTERM signal
      }
    },
  };
}
