import * as fs from "fs";
import fse from "fs-extra";
import path from "path";

import { identity, isEqual, uniqBy } from "@/util/dash";
import { TsConfigJson } from "type-fest";
import { getPackageOrg } from "../constants";
import { getBuildContext } from "../context/buildContext";
import init from "../init";
import { readJSON, writeJSON } from "../json";
import { OneModuleConfig, OneModuleConfigSchema } from "../one/OneModuleConfig";
import require from "../require";
import { getRealPath } from "../symfs";
import getModuleInfo from "./getModuleInfo";

export async function initModule(module: {
  name: string;
  path: string;
}): Promise<OneModuleConfig> {
  const realPath = getRealPath(module.path);
  const mtykConfigNewPath = path.join(realPath, "mtyk.config.cjs");

  if (!fs.existsSync(mtykConfigNewPath)) {
    fs.writeFileSync(
      mtykConfigNewPath,
      `module.exports = {
        name: ${JSON.stringify(module.name)},
        packageManager: 'yarn'
      }`
    );
  }

  const oneConfigPath = getRealPath(path.join(realPath, "one.config.js"));
  let oneConfig: OneModuleConfig = {
    clientImports: [],
    serverImports: [],
    plugins: [],
  };

  const packageOrg = await getPackageOrg();
  // If server.ts , add server.ts to serverImports
  if (fs.existsSync(path.join(realPath, "src/server.ts"))) {
    oneConfig.serverImports.push(`${packageOrg}/${module.name}/server`);
  }

  // same with client.ts or client.tsx
  if (
    fs.existsSync(path.join(realPath, "src/client.ts")) ||
    fs.existsSync(path.join(realPath, "src/client.tsx"))
  ) {
    oneConfig.clientImports.push(`${packageOrg}/${module.name}/client`);
  }

  const org = await getPackageOrg();
  if (fs.existsSync(oneConfigPath)) {
    const file = OneModuleConfigSchema.parse(require(oneConfigPath));
    for (const env of ["client", "server"]) {
      const key = env + "Imports";
      const imports = ((file as any)[key] ?? []) as string[];
      (oneConfig as any)[key] = imports.map(
        (i) => `${org}/${module.name}/${i}`
      ) as any;
    }
    oneConfig.platforms = file.platforms;
  }
  oneConfig.plugins = oneConfig.plugins ?? [];

  // If there isn't a react plugin the plugins array and name of plugin ends in -react
  // add react plugin
  if (
    !oneConfig.plugins.find((p) => p.name === "react") &&
    module.name.endsWith("-react")
  ) {
    oneConfig.plugins.push({
      name: "react",
    });
  }

  let { requiredOneModules: requiredModules, hasReact } = await getModuleInfo(
    module.name,
    realPath
  );

  // every module should have a src/_deps.ts file which, at a minimum, has a dep
  // for its own exported module type (typeof index.ts).
  // unless module is deps itself! also avoid modules that import deps

  const depsTsPath = path.join(realPath, "src/_deps.ts");
  if (
    module.name !== "deps" &&
    module.name !== "errors" &&
    module.name !== "types" &&
    module.name !== "schema" &&
    module.name !== "format-terminal" &&
    module.name !== "dash" &&
    module.name !== "profile"
  ) {
    const depsTs = `import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + '${module.name}'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

`;
    // Actual value of this is registered on client/server, if it makes sense e.g.
    // See server.ts or client.ts if exists
    // globalDepContext.add({ token: tokenName, value: moduleDep })
    //
    // This can then be used safely in dep injection contexts client/server
    // e.g.
    // import vmDep from 'module5/vm/_deps'
    // export default depFn({ vm: vmDep })
    fs.writeFileSync(depsTsPath, depsTs);
    requiredModules = uniqBy(requiredModules.concat(["deps"]), identity);
  } else {
    // Remove _deps incase it was there before
    try {
      fs.unlinkSync(depsTsPath);
    } catch {}
  }

  let currentTsConfig: TsConfigJson | null = null;

  try {
    currentTsConfig = await readJSON(
      path.join("modules", module.name, "tsconfig.json")
    );
  } catch {}

  // Find all imported modules in files
  await init(realPath, {
    tsconfig: (config) => {
      config.extends = "../../tsconfig.json";
      // Add other module references
      config.references = requiredModules.map((m) => ({
        path: `../${m}/tsconfig.json`,
      }));

      config.references = uniqBy(config.references, (r: any) => r.path);

      const paths: any = {
        // ...(currentTsConfig?.compilerOptions?.paths ?? []),
      };
      for (const m of requiredModules) {
        paths[`modules/${m}/*`] = [`../${m}/src/*`];
        paths[`modules/${m}`] = [`../${m}/src/index`];
      }

      config.compilerOptions = {
        tsBuildInfoFile: `../${module.name}.tsbuildinfo`,
        outDir: "./dist",
        rootDir: "./src",
        allowJs: true,
        paths,
      };
      config.exclude = ["node_modules"];
      config.reflection = true;
      config.composite = true;

      // if (hasReact) {

      config.compilerOptions.jsx = getBuildContext().isDevMode
        ? "react-jsxdev"
        : "react-jsx";
      // }
      if (hasReact) {
        config.compilerOptions.lib = ["ESNext", "DOM"];
      }
      config.include = ["src"];
      delete config["ts-node"];
    },
    packageJSON: (json) => {
      json.name = `${org}-src/${module.name}`;

      for (const plugin of oneConfig.plugins) {
        if (plugin.name === "react") {
          // Add react types
          json.devDependencies["@types/react"] = "^18.0.0";
          json.devDependencies["@types/react-dom"] = "^18.0.0";
        }
      }

      // Remove all @bbuild/* dependencies
      for (const dep in json.dependencies) {
        if (dep.startsWith("@bbuild")) {
          delete json.dependencies[dep];
        }
      }

      // If there's a cli/index.ts, or cli.ts, add a bin
      if (
        fs.existsSync(path.join(realPath, "src/cli/index.ts")) ||
        fs.existsSync(path.join(realPath, "src/cli.ts"))
      ) {
        json.bin = {
          [module.name]: "dist/cjs/cli/index.js",
        };
      }
    },
    gitignore: false,
    npmIgnore: false,
    private: true,
    dependencies: true,
    prettier: false,
    vscode: false,
  });

  // Add gitignore
  const gitignorePath = path.join(realPath, ".gitignore");
  const gitignore = `node_modules
dist
package
tsconfig.json
*.tsbuildinfo
tsconfig.cjs.json`;
  fs.writeFileSync(gitignorePath, gitignore);

  const npmIgnore = `node_modules
src
*.env
*.env.*
tsconfig.json
tsconfig.*.json
*.tsbuildinfo`;
  const npmIgnorePath = path.join(realPath, ".npmignore");
  fs.writeFileSync(npmIgnorePath, npmIgnore);

  // Separate config for CJS
  const tsconfigPath = path.join(realPath, "tsconfig.json");
  const tsconfig = await fse.readJSON(tsconfigPath);
  tsconfig.compilerOptions.tsBuildInfoFile = `../${module.name}.cjs.tsbuildinfo`;
  tsconfig.compilerOptions.outDir = "./dist/cjs";
  tsconfig.extends = "../../tsconfig.cjs.json";

  let currentTsConfigCJS;
  if (fs.existsSync(tsconfigPath.replace(".json", ".cjs.json"))) {
    currentTsConfigCJS = await readJSON(
      path.join(tsconfigPath.replace(".json", ".cjs.json"))
    );
  }

  if (!currentTsConfigCJS || !isEqual(currentTsConfigCJS, tsconfig)) {
    await writeJSON(
      path.join(tsconfigPath.replace(".json", ".cjs.json")),
      tsconfig
    );
  }

  const injectedCodeStart = `// --- BEGIN INJECTED CODE ---`;
  const injectedCodeEnd = `// --- END INJECTED CODE ---`;
  const indexTsInject = `
// Inject some code to check if we've imported two different versions of any module. This is a common cause of bugs.
const globalObject: any = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}
const globalStore = globalObject?.__bbuild ?? {}
if (globalStore[${JSON.stringify(module.name)}]) {
console.warn(\`Duplicate module ${
    module.name
  } imported. This can lead to bugs.\`);
}
globalStore[${JSON.stringify(module.name)}] = true;
 `;

  const indexPath = path.join(realPath, "src/index.tsx");
  const indexTsPath = path.join(realPath, "src/index.ts");

  let indexContents = "";
  if (fs.existsSync(indexPath)) {
    indexContents = fs.readFileSync(indexPath).toString();
  } else if (fs.existsSync(indexTsPath)) {
    indexContents = fs.readFileSync(indexTsPath).toString();
  }

  const injectedCode = `${injectedCodeStart}\n${indexTsInject}\n${injectedCodeEnd}`;
  const injectedCodeStartIndex = indexContents.indexOf(injectedCodeStart);
  const injectedCodeEndIndex = indexContents.indexOf(injectedCodeEnd);

  if (injectedCodeStartIndex !== -1 && injectedCodeEndIndex !== -1) {
    const indexContentsWithoutInjectedCode =
      indexContents.slice(0, injectedCodeStartIndex) +
      indexContents.slice(injectedCodeEndIndex + injectedCodeEnd.length);
    const updatedContents = `${indexContentsWithoutInjectedCode.trim()}\n\n${injectedCode}`;
    if (fs.existsSync(indexPath)) {
      fs.writeFileSync(indexPath, updatedContents);
    } else {
      fs.writeFileSync(indexTsPath, updatedContents);
    }
  } else {
    const updatedContents = `${indexContents.trim()}\n\n${injectedCode}`;
    if (fs.existsSync(indexPath)) {
      fs.writeFileSync(indexPath, updatedContents);
    } else {
      fs.writeFileSync(indexTsPath, updatedContents);
    }
  }
  // Get imports
  return oneConfig;
}
