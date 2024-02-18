import { projectPath } from "@/compiler/path";
import * as fs from "fs";
import { readJSON } from "../json";
import path from "path";

export class OneConfig {
  name: string;
  modules: string[];
  repositories: string[];
}

function firstThatExists(...files: string[]) {
  for (const file of files) {
    if (fs.existsSync(file)) {
      return file;
    }
  }
  return null;
}

export async function loadOneConfig(): Promise<OneConfig> {
  const file = firstThatExists(projectPath("one.config.json"));

  if (!file) {
    throw new Error("No one.config.js or one.config.json found");
  }

  let currentDir = path.dirname(file);
  while (currentDir !== path.dirname(currentDir)) {
    currentDir = path.dirname(currentDir);
    if (fs.existsSync(path.join(currentDir, "one.config.json"))) {
      throw new Error("one.config.json should not exist in a child project");
    }
  }

  const json = await readJSON(file);
  const config = new OneConfig();
  Object.assign(config, json);
  return config;
}
