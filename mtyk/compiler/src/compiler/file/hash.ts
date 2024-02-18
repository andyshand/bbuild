import fc from "filecompare";
import fse from "fs-extra";

export function fastFileHash(file: string) {
  const isNotDirectory = /\.[a-z]+$/.test(file);
  if (isNotDirectory) {
    return fse.statSync(file).mtimeMs;
  } else {
    // Meaningless hash of directory
    return "";
  }
}

export async function slowFilehash(file: string, file2: string) {
  const isNotDirectory = /\.[a-z]+$/.test(file) && /\.[a-z]+$/.test(file2);
  if (isNotDirectory) {
    return new Promise((resolve) => fc(file, file2, (equal) => resolve(equal)));
  } else {
    // Meaningless
    return "";
  }
}
