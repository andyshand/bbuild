import assert from "@/util/assert";
import { lastValueFrom, merge, tap } from "rxjs";
import { Logger } from "../logging";
import { getTaskStream } from "../task";
import { DevConfig, getDevInfo } from "./DevConfig";

// Look for .universe/dev.yml according to the config
// If it exists, read it and start all tasks in parallel
// Each task should be started as an observable, and output should be
// piped to the console with a prefix
export default async function dev(
  config: DevConfig = {
    filter: [
      /Accessing non-existent property 'tracing' of module exports inside circular dependency/,
    ],
  }
) {
  const tasks = await Promise.all(
    (
      await getDevInfo()
    ).map(async (t) => {
      return {
        stream: await getTaskStream(t, config),
        task: t,
      };
    })
  );
  assert(tasks.length > 0, "No tasks found");

  let focused: string | null = null;
  // Listen for `rs <task>` to restart a task
  process.stdin.setEncoding("utf8");

  let buffer = "";
  process.stdin.on("data", (data) => {
    const char = data.toString();
    if (char === "\n" || char === "\r" || char === "\u0004") {
      const cmd = buffer.trim();
      const parts = cmd.split(" ");
      const [cmdName, taskName] = parts;

      if (cmdName === "rs" && taskName) {
        const task = tasks.find((t) => t.task.name === taskName);
        console.log(`Restarting ${taskName}`);
        task?.stream.restart();
      } else if (cmdName === "focus") {
        const task = tasks.find((t) => t.task.name === taskName);
        if (task) {
          focused = taskName;
          console.log(`Focused on ${taskName}`);
        } else {
          if (focused) {
            // unpipe
            // const focusedT = tasks.find((t) => t.task.name === focused)
            // focusedT?.stream.getLatestSpawnedChild()?.pip
          }
          focused = null;
          console.log(`Unfocused`);
        }
      }

      if (focused) {
        const task = tasks.find((t) => t.task.name === focused);
        const child = task?.stream.getLatestSpawnedChild();

        if (child && child.stdin) {
          child.stdin.write(buffer);
          // Optionally, you can end the input stream
          child.stdin.end();
        }
      }
      buffer = "";
    } else {
      buffer += char;
    }
  });

  const promisee = lastValueFrom(
    merge(
      ...tasks.map((t) => {
        return t.stream.obs.pipe(
          tap((data) => {
            if ((focused && focused !== t.task.name) || t.task.quiet) {
              return;
            }
            const task = t.task.name ?? t.task.cmd;
            Logger.root.group(task).log(...data);
          })
        );
      })
    )
  );

  return {
    stop: () => {
      for (const task of tasks) {
        task.stream.getLatestSpawnedChild()?.kill("SIGTERM");
      }
    },
  };
}
