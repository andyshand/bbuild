declare const GIT_COMMIT_HASH: string; // added by git-transformer
import { execSync } from "child_process";
import * as commander from "commander";
import fs from "fs";
import path from "path";
import { BuildContext, setupBuildContext } from "./context/buildContext";
import "./logging/index";
import { loadOneConfig } from "./one/loadOneConfig";
import { clean } from "./processes/clean";
import dev from "./processes/dev";
import { prebuild } from "./processes/prebuild";
import { watch } from "./processes/watch";
import { exit } from "process";
const isAlex = fs.existsSync("/home/alex");
const __dirname = path.dirname(new URL(import.meta.url).pathname);

function monitorMemoryUsage(intervalSeconds = 5) {
  let previousUsage = process.memoryUsage().heapUsed;
  const intervalMilliseconds = intervalSeconds * 1000;

  setInterval(() => {
    const currentUsage = process.memoryUsage().heapUsed;

    const increaseBytes = currentUsage - previousUsage;
    const increasePercent = (increaseBytes / previousUsage) * 100;
    const currentUsageGB = (currentUsage / (1024 * 1024 * 1024)).toFixed(2);

    console.log(
      `Memory usage: ${currentUsageGB} GB (+${increasePercent.toFixed(2)}%)`
    );

    previousUsage = currentUsage;
  }, intervalMilliseconds);
}

// if (isAlex) {
//   monitorMemoryUsage(); // Monitor every 10 seconds
// }

const getGitHash = () => {
  return execSync("git rev-parse HEAD", {
    cwd: __dirname,
  })
    .toString()
    .trim();
};

const hash = getGitHash();

if (hash !== GIT_COMMIT_HASH) {
  throw new Error(
    `Git commit hash mismatch. You may need to compile mtyk/compiler (bbuild) again.
    
Compiled with: ${GIT_COMMIT_HASH}
Current (@ ${__dirname}): ${hash}
    `
  );
}

const main = async () => {
  // Initialize the commander program
  const program = new commander.Command();
  const config = await loadOneConfig();

  // Define the "build" command
  program
    .command("build")
    .description("Build modules")
    .action(async (opts) => {
      setupBuildContext(
        new BuildContext({
          isWatchMode: false,
          config,
        })
      );

      try {
        await prebuild();
        console.log("Starting to build modules in build mode...");
        await watch();
        console.log("Done.");
        exit(0);
      } catch (e) {
        console.log(e);
        exit(1);
      }
    });

  // Define the "clean" command
  program
    .command("clean")
    .description("Clean up")
    .action(async (opts) => {
      setupBuildContext(
        new BuildContext({
          isWatchMode: false,
          config,
        })
      );
      await clean();
      process.exit(0);
    });

  // Define the "dev" command
  program
    .command("dev")
    .addOption(new commander.Option("-g, --group <group>", "Group to run"))
    .description("Run dev mode")
    .action(async (opts) => {
      setupBuildContext(
        new BuildContext({
          isWatchMode: true,
          config,
        })
      );
      await prebuild();
      await watch();
      await dev(opts);
    });

  // Parse the command line arguments
  program.parse(process.argv);
};

main();
