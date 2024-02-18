import fse from "fs-extra";
import os from "os";
import path from "path";
import yaml from "yaml";
import z from "zod";
const homedir = os.homedir();

const filePath = path.join(homedir, `.config`, `universe.yml`);

const schema = z.object({
  repositories: z
    .array(z.string())
    .describe("List of local paths to repositories to resolve modules from")
    .optional(),
  nodeBinPath: z
    .string()
    .describe(`Path to node bin folder, e.g. ~/.nvm/../16.15.0/bin`),
});

export type UniverseConfig = z.infer<typeof schema>;

/**
 * Retreives the universe config from ~/.config/universe.yml
 * or throws an error if it doesn't exist/invalid
 */
export default function getUniverseConfig(): UniverseConfig {
  try {
    const readd = yaml.parse(fse.readFileSync(filePath, "utf8") ?? "");
    const parsed = schema.parse(readd);
    return { ...parsed, repositories: parsed.repositories ?? [] };
  } catch (e) {
    console.log(`Error reading universe config at path ${filePath}`, e);
    process.exit(1);
  }
}
