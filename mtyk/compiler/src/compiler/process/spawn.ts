import execa from "execa";
import { Logger } from "../logging";

interface SpawnStoppableProcessOptions extends execa.Options {
  label?: string;
  onFinish?: () => void;
}

/* used from watch.ts */
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
