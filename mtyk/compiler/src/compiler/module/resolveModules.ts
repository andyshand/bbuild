import { projectPath } from "@/compiler/path";
import fse from "fs-extra";
import path from "path";
import { filter } from "modern-async";
import { makeGitignore } from "../git";
import { OneConfig } from "../one/loadOneConfig";
import { resolveModule } from "./resolveModule";
import { Logger } from "../logging";

export async function resolveModules(config: OneConfig) {
  const resolvedAlready = new Set<string>();
  await Logger.withLogGroup("resolveModules", async () => {
    const { modules } = config;
    await fse.ensureDir(projectPath("modules"));

    for (const module of modules) {
      await resolveModule(module, resolvedAlready);
    }

    // Get all symlinked files in modules dir
    const symlinkedFiles = await filter<string>(
      await fse.readdir(projectPath("modules")),
      async (f) => {
        const fullPath = projectPath(path.join("modules", f));
        const stat = await fse.lstat(fullPath);
        return stat.isSymbolicLink();
      }
    );

    // For all symlinked, add to a gitignore
    makeGitignore(
      symlinkedFiles.map((f) => `/${f}`),
      projectPath("modules")
    );
  });

  return resolvedAlready;
}
