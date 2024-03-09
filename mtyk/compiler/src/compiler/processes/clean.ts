import { projectPath } from "@/compiler/path";
import fse from "fs-extra";
import fs from "fs/promises";
import { removeGlobAsync } from "../file/glob";

export async function clean() {
  await removeGlobAsync(projectPath("./modules/**/package"));
  await removeGlobAsync(projectPath("./modules/**/dist"));
  await removeGlobAsync(projectPath("./modules/**/mtyk.config.js"));
  await removeGlobAsync(projectPath("./modules/**/.gitignore"));
  await removeGlobAsync(projectPath("./modules/**/.prettierrc.yaml"));
  await removeGlobAsync(projectPath("./modules/**/tsconfig.json"));
  await removeGlobAsync(projectPath("./modules/**/tsconfig.*.json"));
  await removeGlobAsync(projectPath("./modules/**/node_modules"));
  await removeGlobAsync(projectPath("./**/node_modules"));
  await removeGlobAsync(projectPath("./**/*.tsbuildinfo"));
  await removeGlobAsync(projectPath("./.universe/build"));
  await removeGlobAsync(projectPath("./built-modules"));
  await removeGlobAsync(projectPath("./node-modules/@bbuild"));

  // Remove all symlinks
  const dirs = await fs.readdir(projectPath("./modules"));
  for (const dir of dirs) {
    const link = projectPath(`./modules/${dir}`);
    const stat = await fse.lstat(link);

    if (stat.isSymbolicLink()) {
      await fse.remove(link);
    }
  }
}
