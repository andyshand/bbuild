import fs from "fs";
import path from "path";
import { z } from "zod";
import { projectName } from "../path";

const packageConfigSchema = z.object({
  name: z.string(),
  overrides: z.any().optional(),
  packageManager: z.enum(["npm", "yarn", "pnpm"]),
  packageJSON: z.function(z.tuple([z.any()])).optional(),
  export: z.boolean().default(true),
  plugins: z.array(z.tuple([z.string(), z.any()]).or(z.string())).default([]),
  tsConfig: z.function(z.tuple([z.any()])).optional(),
});

export type MTYKPackageConfig = z.infer<typeof packageConfigSchema>;
let cachedReadConfig: MTYKPackageConfig | undefined;

export default function workflowConfig(config: MTYKPackageConfig) {
  cachedReadConfig = config;
  return cachedReadConfig;
}

async function tryAssignConfig(folder?: string, required = true) {
  if (!cachedReadConfig) {
    const configPath = path.join(folder ?? process.cwd(), "mtyk.config.cjs");

    // Check config path exists
    if (!fs.existsSync(configPath)) {
      const error = `${`mtyk.config.cjs`} not found for project ${projectName()} in ${configPath}`;
      if (required) {
        // Assume this isn't a mtyk project, not really an error
        console.info(error);
        process.exit(0);
      }

      throw new Error(error);
    }
    try {
      const config = await import(configPath);
      cachedReadConfig = {
        ...config.default,
        ...packageConfigSchema.parse(config.default),
      };
    } catch (e) {
      console.error(`Invalid configuration`, e);
      process.exit(1);
    }
  }
}

export async function getPackageConfig(
  folder?: string,
  required = true
): Promise<MTYKPackageConfig> {
  await tryAssignConfig(folder, required);
  if (!cachedReadConfig) {
    throw new Error("No config has been set");
  }
  return cachedReadConfig;
}
