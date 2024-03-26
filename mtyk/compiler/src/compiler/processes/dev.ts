import assert from "@/util/assert";
import { switchMap, tap } from "rxjs";
import { Logger } from "../logging";
import { getTaskStream } from "../task";
import { DevConfig, getDevInfo } from "./DevConfig";

// This function is responsible for starting development tasks based on the configuration
// It looks for a .universe/dev.yml file and if it exists, it reads it and starts all tasks in parallel
// Each task is started as an observable and its output is piped to the console with a prefix
export default async function startDevTasks(
  config: DevConfig = {
    filter: [
      /Accessing non-existent property 'tracing' of module exports inside circular dependency/,
    ],
  }
) {
  // Get the development information and start all tasks
  const tasks = await Promise.all(
    (
      await getDevInfo()
    ).map(async (t) => {
      // For each task, get its stream and start it
      return {
        stream: await getTaskStream(t, config),
        task: t,
      };
    })
  );
  // Assert that there are tasks to start
  assert(tasks.length > 0, "No tasks found");

  let focused: string | null = null;
  // Set the encoding for the input stream
  process.stdin.setEncoding("utf8");

  let buffer = "";
  // Listen for data in the input stream
  process.stdin.on("data", (data) => {
    const char = data.toString();
    // If the character is a newline, carriage return, or end-of-transmission character
    if (char === "\n" || char === "\r" || char === "\u0004") {
      const cmd = buffer.trim();
      const parts = cmd.split(" ");
      const [cmdName, taskName] = parts;

      // If the command is 'rs' and a task name is provided, restart the task
      if (cmdName === "rs" && taskName) {
        const task = tasks.find((t) => t.task.name === taskName);
        console.log(`Restarting ${taskName}`);
        task?.stream.restart();
      }

      buffer = "";
    } else {
      buffer += char;
    }
  });

  // For each task, pipe its output to the console
  tasks
    .map((t) => {
      return t.stream.childObs.pipe(
        switchMap((obs) => {
          return obs;
        }),
        tap((strngs) => {
          // If the task is focused or quiet, do not log its output
          if ((focused && focused !== t.task.name) || t.task.quiet) {
            return;
          }
          const task = t.task.name ?? t.task.cmd;
          Logger.root.group(task).log(...strngs);
        })
      );
    })
    .forEach((obs) =>
      obs.subscribe({
        error: (e) => {
          // Handle any errors in the process stream
        },
        complete: () => {
          // Handle the completion of the process stream
        },
        next: (v) => {
          // Handle the next value in the process stream
        },
      })
    );

  return {
    stop: () => {
      // Stop all tasks
      for (const task of tasks) {
        task.stream.getChildHandle().kill();
      }
    },
  };
}
