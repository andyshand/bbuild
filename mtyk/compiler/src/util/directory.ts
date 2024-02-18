import fse from "fs-extra";

/**
 * Utility methods for working with directories
 */



/*
  Return all file paths from directory.
  If directory is missing, return an empty array instead of throwing an exception.
  Default behaviour on `fs.readdir` is to throw an error if the provided directory is missing.
 */
export async function getFilesFromOptionalDirectory(directoryPath: string): Promise<string[]> {

  if(!await fse.exists(directoryPath)) {
    return [];
  }

  return fse.readdir(directoryPath);
}



