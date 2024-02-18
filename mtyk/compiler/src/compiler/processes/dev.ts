import { projectPath } from "@/compiler/path";
import assert from "@/util/assert";
import dotenv from "dotenv-flow";
import fs from "fs-extra";
import InfisicalClient from "infisical-node";
import { lastValueFrom, merge, tap } from "rxjs";
import { parse } from "yaml";
import { readJSON } from "../json";
import { getTaskStream } from "../task";

export interface DevJSON {
  tasks: {
    cmd: string;
    group?: string;
    watch?: string[] | string;
    watchModules?: string[] | string;
    name?: string;
    args: string[];
    /**
     * If true, will populate env from the config module.
     * In the future, we would like to support strings somehow?
     */
    config?: boolean;
    disabled?: boolean;
    quiet?: boolean;
    cwd?: string;
    env?: { [key: string]: string };
  }[];
}

export interface DevConfig {
  group?: string;
  filter?: RegExp[];
}

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
  dotenv.config({});

  if (process.env.INFISICAL_TOKEN) {
    console.log(`Found INFISICAL_TOKEN, fetching secrets...`);
    try {
      const client = new InfisicalClient({
        token: process.env.INFISICAL_TOKEN,
      });
      const env = process.env.INFISICAL_ENV || "dev";
      const results = await client.getAllSecrets({
        environment: env,
        path: "/",
        includeImports: false,
        attachToProcessEnv: true,
      });
      console.log(`Fetched ${results.length} secrets for environment ${env}`);
      for (const result of results) {
        console.log(
          `Loaded secret ${result.secretName} from workspace "${result.workspace} v${result.version}" in environment "${result.environment}"`
        );
      }
    } catch (e) {
      console.error(`Error fetching secrets`, e);
    }
  } else {
    console.log(`No INFISICAL_TOKEN found, skipping secrets...`);
  }

  const devJSONPath = projectPath(".universe", "dev.json");
  const devJSONExists = await fs.pathExists(devJSONPath);

  const devYmlPath = projectPath(".universe", "dev.yml");
  const devYmlExists = await fs.pathExists(devYmlPath);

  assert(devJSONExists || devYmlExists, "No dev.json/yml found");
  const devJSON: DevJSON = devJSONExists
    ? await readJSON(devJSONPath)
    : parse(fs.readFileSync(devYmlPath, "utf-8"));

  if (!devJSON.tasks?.length) {
    throw new Error(`No tasks found in dev.json/dev.yml`);
  }
  const tasks = await Promise.all(
    devJSON.tasks
      .filter((t) => {
        if (!config.group) return true;
        return t.group === config.group && !t.disabled;
      })
      .map(async (t) => {
        return {
          stream: await getTaskStream(t, config),
          task: t,
        };
      })
  );
  assert(tasks.length > 0, "No tasks found");

  let focused: string | null = null;
  // let focusedStdin: NodeJS.ReadStream | null = null
  // Listen for `rs <task>` to restart a task
  process.stdin.setEncoding("utf8");
  // if (typeof process.stdin.setRawMode === "function") {
  //   process.stdin.setRawMode(true);
  // }
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

  await lastValueFrom(
    merge(
      ...tasks.map((t) => {
        return t.stream.obs.pipe(
          tap((data) => {
            if ((focused && focused !== t.task.name) || t.task.quiet) {
              return;
            }
            console.log(data);
          })
        );
      })
    )
  );
}
