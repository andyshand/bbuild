import { BaseModuleInfo } from "../module/getModuleInfo";
import { makeImportModule } from "../module/makeImportModule";
import { OneModuleConfig } from "./OneModuleConfig";

export default async function createOneModules(
  modifierPath: (OneModuleConfig & BaseModuleInfo)[]
) {
  for (const env of ["client", "server"]) {
    const key = `${env}Imports` as any;
    const allImports = modifierPath.reduce(
      (acc, config: any) => [...acc, ...config[key]],
      [] as string[]
    );
    await makeImportModule(allImports, `${env}-modules`);
  }

  const allNextMods = modifierPath
    .reduce(
      (acc, config) => [
        ...acc,
        config.platforms?.next?.config
          ? `${config.name}/${config.platforms.next.config}`
          : undefined,
      ],
      [] as (string | undefined)[]
    )
    .filter(Boolean);
  const moduleContent = (makeImport: any, isCjs?: boolean) => `
${allNextMods.map((p, i) => `${makeImport(`@one/${p}`, `i${i}`)}`).join("\n")}
  
${
  isCjs ? `module.exports =` : `export default`
} function wrapNextConfig(config) {

  let out = config
${allNextMods
  .map((p, i) => {
    return `  out = i${i}(out)`;
  })
  .join("\n")}

  return out
}`;
  await makeImportModule([], "next", moduleContent);
}
