import fs from "fs";
import path from "path";
import { findNearestWorkspace } from "./workspace";

export function resolveFileName(fileName: string, pathh: string) {
  if (fs.existsSync(path.join(pathh, fileName))) {
    return path.join(pathh, fileName);
  }

  if (pathh === path.parse(pathh).root) {
    return null;
  }

  // Go up to parent
  return resolveFileName(fileName, path.join(pathh, ".."));
}

export function resolveFilenameWithPaths(fileName: string, paths: string[]) {
  for (const path of paths) {
    const res = resolveFileName(fileName, path);
    if (res) {
      return res;
    }
  }
}

export function getBinLocation(bin: string) {
  const nearestWorkspace = findNearestWorkspace(process.cwd());

  return resolveFilenameWithPaths(`node_modules/.bin/${bin}`, [
    process.cwd(),
    ...(nearestWorkspace ? [nearestWorkspace] : []),
  ]);
}
