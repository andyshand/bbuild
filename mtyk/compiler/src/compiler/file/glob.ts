import glob from "glob";
import fse from "fs-extra";
import fs from "fs/promises";
import { promisify } from "util";
import { fastFileHash } from "./hash";

const globAsync = promisify(glob);

export function removeGlob(globber: string, options = {}) {
  try {
    glob
      .sync(globber, {
        follow: true,
        ignore: ["**/node_modules/**"],
        ...options,
      })
      .forEach((f) => {
        fse.removeSync(f);
      });
  } catch (error) {
    console.error(`Error in removeGlob: ${error}`);
  }
}

export async function removeGlobAsync(globber: string, options = {}) {
  try {
    const files = await globAsync(globber, {
      follow: true,
      ignore: ["**/node_modules/**"],
      ...options,
    });

    await Promise.all(
      files.map(async (f) => {
        try {
          await fs.rm(f, { recursive: true });
          if (f.includes("dist")) {
            await fse.ensureDir(f);
          }
        } catch (innerError) {
          console.error(`Error removing file ${f}: ${innerError}`);
        }
      })
    );
  } catch (error) {
    console.error(`Error in removeGlobAsync: ${error}`);
  }
}

export function makeCacheHashFromGlob(g: string, options = {}) {
  try {
    return glob.sync(g, options).map(fastFileHash).join(",");
  } catch (error) {
    console.error(`Error in makeCacheHashFromGlob: ${error}`);
    return "";
  }
}
