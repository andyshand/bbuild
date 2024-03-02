import execa, { ExecaChildProcess } from "execa";
import { Logger } from "../logging";
import { DevJSON } from "../processes/dev";
import require from "../require";

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
      `Task "${name}" exited with code ${exitCode} and signal ${signal}`
    );
  });
  childProcess
    .then(() => {})
    .catch((error) => {
      console.error(error);
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
  const logger = Logger.root.group(label);
  subprocess.all?.on("data", (data) => {
    logger.log(data.toString());
  });

  subprocess
    .then(() => {
      onFinish?.();
    })
    .catch((error) => {
      logger.error(error);
      if (error.signal === "SIGTERM") {
        logger.log(
          `Task "${label}" exited with code ${error.code} and signal ${error.signal}`
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
