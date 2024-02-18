import * as fs from "fs";
import * as path from "path";

const processBbuildImports = (imports: string[]): string[] => {
  const uniqueImports = new Set<string>();

  imports.forEach((importPath) => {
    if (importPath.startsWith("@bbuild/")) {
      const moduleName = importPath.split("/")[1];
      if (moduleName) {
        uniqueImports.add(moduleName);
      }
    }
  });

  return Array.from(uniqueImports);
};

const findAllBbuildImports = (
  filePath: string,
  processedFiles: Set<string> = new Set(),
  baseDir: string = path.dirname(filePath)
): string[] => {
  const fullPath = path.resolve(baseDir, filePath);

  if (processedFiles.has(fullPath)) return [];

  processedFiles.add(fullPath);

  let fileContent: string;
  try {
    fileContent = fs.readFileSync(fullPath, "utf8");
  } catch (error) {
    console.error(`Error reading file ${fullPath}: `, error);
    return [];
  }

  fileContent = fileContent.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "");

  const importRegex = /import ['"]([^'"]+)['"]/g;
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let allImports: string[] = [];
  let match: RegExpExecArray | null;

  const processImportPath = (importPath: string): void => {
    if (importPath.startsWith("@bbuild")) {
      allImports.push(importPath);
    } else if (!importPath.startsWith(".")) {
      return;
    } else {
      let resolvedPath = path.resolve(path.dirname(fullPath), importPath);
      if (!resolvedPath.endsWith(".js")) {
        resolvedPath += ".js";
      }
      if (fs.existsSync(resolvedPath) && !processedFiles.has(resolvedPath)) {
        allImports = allImports.concat(
          findAllBbuildImports(resolvedPath, processedFiles, baseDir)
        );
      }
    }
  };

  while ((match = importRegex.exec(fileContent)) !== null) {
    processImportPath(match[1]);
  }

  while ((match = requireRegex.exec(fileContent)) !== null) {
    processImportPath(match[1]);
  }

  return allImports;
};

const processFilesForBbuildImports = (
  baseDir: string,
  entryFile: string
): string[] => {
  const allImports = findAllBbuildImports(entryFile, new Set(), baseDir);
  const uniqueBbuildImports = processBbuildImports(allImports);
  return uniqueBbuildImports;
};

export default processFilesForBbuildImports;
