import { execSync } from "child_process";
import { findModules } from "../module/findModules";
import { cjs, esm } from "./prebuild";
import { packageModule } from "../module/packageModule";

export async function build() {
  for (const module of [cjs, esm]) {
    try {
      console.log("Building: ", module.name);
      const command = module().join(" ");
      console.log(`Running: ${command}`);
      const output = execSync(command);
      console.log(output.toString());
    } catch (e) {
      console.error(e.stdout.toString());
      throw e;
    }
  }

  for (const module of findModules()) {
    console.log("Packaging: ", module.name);
    await packageModule(module.path, module.name);
  }
}
