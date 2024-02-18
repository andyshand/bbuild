import fs from "fs";

export default async function deleteDirectoryWithRetry(
  directoryPath,
  maxRetries = 5,
  delay = 100
) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      if (await fs.promises.stat(directoryPath)) {
        await fs.promises.rm(directoryPath, { recursive: true, force: true });
      }
      return; // Success
    } catch (error) {
      if (error.code === "ENOTEMPTY" && retries < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        retries++;
      } else {
        throw error; // Rethrow if max retries reached or different error
      }
    }
  }
}
