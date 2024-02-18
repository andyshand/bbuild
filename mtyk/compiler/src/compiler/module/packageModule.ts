import { getModuleBuildContext } from "../context/packageBuildContext";
import makeModulePackage from "./makeModulePackage";

export async function packageModule(modulePath: string, moduleName: string) {
  await makeModulePackage(getModuleBuildContext(modulePath), moduleName);
}
