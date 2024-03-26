import { projectPath } from "@/compiler/path";
import assert from "@/util/assert";
import dotenv from "dotenv-flow";
import fs from "fs-extra";
import InfisicalClient from "infisical-node";
import { parse } from "yaml";
import { readJSON } from "../json";

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
    /**
     * Either key-value pairs or a path to a .env file
     */
    env?: { [key: string]: string } | string;
  }[];

  docker: {
    name: string;
    image: string;
    args: { [key: string]: string };
    env?: { [key: string]: string } | string;
    dockerfile?: string;
    ports?: string[];
  }[];
}

export interface DevConfig {
  group?: string;
  filter?: RegExp[];
}

async function processEnv(tEnv: DevJSON["tasks"][0]["env"], name: string) {
  let envVars: Record<string, string> = {};
  if (tEnv) {
    if (typeof tEnv === "string") {
      const envPath = projectPath(tEnv);
      assert(await fs.pathExists(envPath), `env file not found at ${envPath}`);
      const env = dotenv.parse(envPath);
      envVars = env;
    }

    envVars = await getInfisicalFromEnv(envVars, name);
  }

  return envVars;
}

export async function getDevInfo() {
  dotenv.config({});

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
    devJSON.tasks.map(async (t) => {
      const envVars = await processEnv(t.env, t.name);
      return {
        ...t,
        env: envVars,
      };
    })
  );
  return tasks;
}

export async function getDockerInfo() {
  dotenv.config({});

  const devJSONPath = projectPath(".universe", "dev.json");
  const devJSONExists = await fs.pathExists(devJSONPath);

  const devYmlPath = projectPath(".universe", "dev.yml");
  const devYmlExists = await fs.pathExists(devYmlPath);

  assert(devJSONExists || devYmlExists, "No dev.json/yml found");
  const devJSON: DevJSON = devJSONExists
    ? await readJSON(devJSONPath)
    : parse(fs.readFileSync(devYmlPath, "utf-8"));

  if (!devJSON.tasks?.length) {
    throw new Error(`No tasks found in dev.yml`);
  }
  const tasks = await Promise.all(
    devJSON.docker.map(async (t) => {
      const envVars = await processEnv(t.env, t.name);

      return {
        ...t,
        env: envVars,
      };
    })
  );
  return tasks;
}

async function getInfisicalFromEnv(
  envVars: Record<string, string>,
  taskName: string
): Promise<Record<string, string>> {
  if ("INFISICAL_TOKEN" in envVars) {
    console.log(
      `Found INFISICAL_TOKEN for task ${taskName}, fetching secrets...`
    );
    try {
      const client = new InfisicalClient({
        token: envVars.INFISICAL_TOKEN,
      });
      // const env = process.env.INFISICAL_ENV || "dev";
      const environment = process.env.INFISICAL_ENV || "prod";
      const results = await client.getAllSecrets({
        environment,
        path: "/",
        includeImports: false,
        attachToProcessEnv: false,
      });
      console.log(
        `Fetched ${results.length} secrets for task ${taskName} in environment ${environment}`
      );
      for (const result of results) {
        console.log(
          `Loaded secret ${result.secretName} from workspace "${result.workspace} v${result.version}" in environment "${result.environment}" for task ${taskName}`
        );
        envVars[result.createdAt] = result.secretValue;
      }
    } catch (e) {
      console.error(`Error fetching secrets for task ${taskName}`, e);
    }
  } else {
    console.log(
      `No INFISICAL_TOKEN found for task ${taskName}, skipping secrets...`
    );
  }
  return envVars;
}
