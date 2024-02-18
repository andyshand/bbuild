import { flattenDeep } from "@/util/dash";
import fs from "fs-extra";

export default function findFileImports(filePath: string) {
  const fileContents = fs.readFileSync(filePath, "utf-8");

  const importRegex =
    /import[\s\w,]+{?[\s\w,]+}?[\s\w,]+from\s+['"]([^'"]+)['"]/g;
  const simpleImportRegex = /import[\w\s\n*]+['"]([@a-zA-Z0-9-/]+)['"]/g;
  // Match typescipt only 'import type' syntax
  const typeImportRegex =
    /import\s+type\s+{?[\s\w,]+}?[\s\w,]+from\s+['"]([^'"]+)['"]/g;

  // Find all captured groups for both regex
  const imports = flattenDeep([
    ...[...fileContents.matchAll(importRegex)].map((m) => m[1]),
    ...[...fileContents.matchAll(simpleImportRegex)].map((m) => m[1]),
    ...[...fileContents.matchAll(typeImportRegex)].map((m) => m[1]),
  ]);

  return imports
    .map((i: string) => i.trim())
    .filter((i: string) => !i.startsWith(".") && !i.startsWith("/"));
}
