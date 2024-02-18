import path from "path";
import fs from "fs";
import { projectPath } from "../path";
import fse from "fs-extra";

export function findModules() {
  const modulesPath = projectPath("modules");
  fse.ensureDirSync(modulesPath);

  const isDirOrSymlink = (d: string) => {
    return (
      fs.statSync(path.join(modulesPath, d)).isDirectory() ||
      fs.lstatSync(path.join(modulesPath, d)).isSymbolicLink()
    );
  };
  const modules = fs
    .readdirSync(modulesPath)
    .filter((d) => isDirOrSymlink(d) && !d.startsWith("."));
  return modules.map((name) => ({ name, path: path.join(modulesPath, name) }));
}
