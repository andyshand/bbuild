declare const GIT_COMMIT_HASH: string; // added by git-transformer
import * as commander from "commander";
import debounce from "lodash/debounce";
import path from "path";
import { exit } from "process";
import { BuildContext, setupBuildContext } from "./context/buildContext";
import docker from "./docker";
import "./logging/index";
import { loadOneConfig } from "./one/loadOneConfig";
import { clean } from "./processes/clean";
import dev from "./processes/dev";
import { prebuild } from "./processes/prebuild";
import { watchOrBuild } from "./processes/watch";
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
        await watchOrBuild({});
        console.log("Done.");
        exit(0);
      } catch (e) {
        console.log(e);
        exit(1);
      }
    });

  // Define the "build" command
  program
    .command("docker")
    .description("Run docker")
    .action(async (opts) => {
      await docker();
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

      let devHandle: Awaited<ReturnType<typeof dev>> | null = null;
      let alreadyPrebuildingAgain = false;

      await watchOrBuild({
        onNeedsPrebuild: debounce(async () => {
          if (alreadyPrebuildingAgain) {
            return;
          }
          try {
            alreadyPrebuildingAgain = true;
            if (devHandle) {
              devHandle.stop();
            }
            await prebuild();
            devHandle = await dev(opts);
            alreadyPrebuildingAgain = false;
          } catch (e) {
            console.error(e);
            process.exit(1);
          }
        }, 500),
      });

      devHandle = await dev(opts);

      // keep it running
      return new Promise((res) => {
        // never resolve
      });
    });

  // Parse the command line arguments
  program.parse(process.argv);
};

main();
