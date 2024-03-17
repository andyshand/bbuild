import { getFilesFromOptionalDirectory } from "@/util/directory";
import fs from "fs";
import glob from "glob";
import uniq from "lodash/uniq";
import path from "path";
import findFileImports from "../file/findFileImports";
import { readJSON } from "../json";
import { projectPath } from "../path";

export async function getAppInfo() {
  const appDirs = await getFilesFromOptionalDirectory(projectPath("apps"));
  const appInfos: AppInfo[] = [];

  for (const appDir of appDirs) {
    if (appDir.startsWith(".")) {
      continue;
    }
    // Ensure it's a directory
    const stat = await fs.promises.stat(projectPath("apps", appDir));
    if (!stat.isDirectory()) {
      continue;
    }

    const appPath = path.join(projectPath("apps"), appDir);
    const packageJSONPath = path.join(appPath, "package.json");
    const packageJSON = await readJSON(packageJSONPath);

    const importedModules = new Set<string>();
    const isNextjs = await new Promise<boolean>((resolve, rej) =>
      glob(
        "./**/*.{js,jsx,ts,tsx}",
        {
          cwd: appPath,
          ignore: ["**/node_modules/**", "**/*.map", "**/*.d.ts"],
        },
        (err, files) => {
          if (err) {
            return rej(err);
          }

          for (const file of files.filter((f) => {
            // process ignore rules again? glob not working?
            return (
              !f.endsWith(".map") &&
              !f.endsWith(".d.ts") &&
              !f.includes("node_modules")
            );
          })) {
            const nodeModuleImports = findFileImports(path.join(appPath, file));
            for (const imp of nodeModuleImports) {
              importedModules.add(imp);
            }
          }

          resolve(files.some((file) => file.includes("next.config")));
        }
      )
    );

    appInfos.push({
      app: appDir,
      importedModules: uniq(Array.from(importedModules)).filter((imported) => {
        // don't include tsconfig path remappings
        if (
          imported.startsWith("@/") ||
          imported.startsWith("$/") ||
          imported.startsWith("modules")
        ) {
          return false;
        }
        return true;
      }),
      type: isNextjs ? "nextjs" : "other",
      packageJSONPath,
      packageJSON,
    });
  }

  return appInfos;
}
export type AppInfo = {
  app: string;
  importedModules: string[];
  type: "nextjs" | "other";
  packageJSONPath: string;
  packageJSON: any;
};
