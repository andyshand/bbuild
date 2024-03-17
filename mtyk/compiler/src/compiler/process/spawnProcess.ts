import execa, { ExecaChildProcess } from "execa";
import pidusage from "pidusage";
import { DevJSON } from "../processes/DevConfig";
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

  const monitorIntervalMS = 2000;
  // Monitor CPU and RAM usage
  const monitorInterval = setInterval(() => {
    pidusage(childProcess.pid, (err, stats) => {
      if (err) {
        console.error(`Error getting process stats: ${err}`);
        return;
      }

      // Log or handle high CPU/memory usage
      const cpuThreshold = 80;
      const memoryThreshold = 500 * 1024 * 1024;

      if (stats.cpu > cpuThreshold) {
        console.warn(`High CPU usage for ${name}: ${stats.cpu}%`);
      }
      if (stats.memory > memoryThreshold) {
        console.warn(
          `High memory usage for ${name}: ${stats.memory / 1024 / 1024} MB`
        );
      }
    });
  }, monitorIntervalMS); // Check every 2 seconds

  childProcess.on("exit", (exitCode, signal) => {
    clearInterval(monitorInterval);
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
