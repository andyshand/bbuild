import path from "path";
import fs from "fs";
import type { PackageJson } from "type-fest";

export async function makeModule(
  modulePath: string,
  fileMap: Map<string, string>,
  packageJSON: PackageJson
) {
  // Create module directory if it doesn't exist
  await fs.promises.mkdir(modulePath, { recursive: true });

  // Write files
  for (const [filename, content] of fileMap) {
    const filePath = path.join(modulePath, filename);
    await fs.promises.writeFile(filePath, content);
  }

  // Generate exports field in package.json based on files in fileMap
  const packageExports = {
    ".": {
      import: "./index.js",
      require: "./index.cjs",
    },
    "./package.json": "./package.json",
  };
  for (const filename of fileMap.keys()) {
    if (filename !== "package.json") {
      packageExports[`./${filename}`] = `./${filename}`;
    }
  }
  packageJSON.exports = packageExports;

  // Write package.json file
  const packageJSONPath = path.join(modulePath, "package.json");
  await fs.promises.writeFile(
    packageJSONPath,
    JSON.stringify(packageJSON, null, 2)
  );
}
