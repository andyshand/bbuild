import fse from "fs-extra";
import glob from "glob";
import { hasCacheChanged } from "../cache";

export function addSourceRootToMaps(
  moduleName: string,
  builtModuleDir: string,
  sourceModulesAbsoluteDir: string
) {
  // console.log(`Updating source roots for ${moduleName}`)
  function addSourceRoot(sourceMapJSON: any) {
    let absoluteDir = sourceModulesAbsoluteDir;
    if (process.env.BBUILD_REAL_PATH && absoluteDir.startsWith("/mtyk/app")) {
      absoluteDir = absoluteDir.replace(
        "/mtyk/app",
        process.env.BBUILD_REAL_PATH
      );
    }

    sourceMapJSON.sourceRoot = `${absoluteDir}/${moduleName}/src`;
    // sourceMapJSON.sourceRoot = `../../modules/${moduleName}/src`
    delete sourceMapJSON.names;
    sourceMapJSON.sources = sourceMapJSON.sources.map((source: string) =>
      source
        .replace(/^\.\.\//, "")
        .replace(/^\.\.\//, "")
        .replace(/^\.\.\//, "")
        .replace(/^\.\.\//, "")
        .replace(/^\.\.\//, "")
        .replace(/^\.\.\//, "")
        .replace(/^\.\.\//, "")
        .replace(/^\.\.\//, "")
        .replace(/^\.\.\//, "")
        .replace(/^\.\.\//, "")
        .replace(/^\.\.\//, "")
        .replace(/^\.\.\//, "")
        .replace(/^\.\.\//, "")
        .replace(/^\.\.\//, "")
        .replace(/^[/]/, "")
        .replace(/^src\//, "")
    );
    // console.log({ sourceMapJSON })
    return sourceMapJSON;
  }
  const globber = `${builtModuleDir}/${moduleName}/**/*.map`;
  if (!hasCacheChanged(globber)) {
    return;
  }
  glob.sync(globber).forEach((file) => {
    try {
      // console.log(`Adding sourceRoot to ${file}`)
      const asJSON = fse.readJSONSync(file);
      fse.writeJSON(file, addSourceRoot(asJSON));
    } catch (e) {
      console.error(`Error modifying source mapf ro ${file}`, e);
    }
  });
  // Update cache key so we don't do this again
  hasCacheChanged(globber);
}

export function modifyAndWrite(
  src: string,
  destination: string,
  fn: (src: any) => any
) {
  const file = fse.readFileSync(src);
  const modified = fn(file);
  fse.writeFileSync(destination, modified);
}
