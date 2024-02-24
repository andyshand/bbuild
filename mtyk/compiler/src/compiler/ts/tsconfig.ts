import { projectPath } from "@/compiler/path";
import { isEqual } from "@/util/dash";
import execa from "execa";
import * as fs from "fs";
import fse from "fs-extra";
import _ from "lodash";
import { map } from "modern-async";
import path from "path";
import { TsConfigJson } from "type-fest";
import { PluginConfig } from "typescript";
import { getBinLocation } from "../bin";
import { getBuildContext } from "../context/buildContext";
import { removeGlob } from "../file/glob";
import { readJSON, writeJSON } from "../json";
const { uniqBy } = _;
const __dirname = path.dirname(new URL(import.meta.url).pathname);

export async function createBaseTSConfigs(
  modules: { name: string; path: string }[]
) {
  let existing: any = {};
  try {
    existing = await readJSON(projectPath("tsconfig.json"));
  } catch (e) {}

  // Add ts transformer(s) under .universe/build/transformers
  const transformersPath = projectPath(".universe", "build", "transformers");
  await fse.ensureDir(transformersPath);

  // Get location of actual script file relative to this, ESM compatible, don't use CJS
  // const transfoermsPath = path.join(__dirname, "transformers");
  // const files = await fse.readdir(transfoermsPath);
  const files = [];
  let plugins = (existing.compilerOptions?.plugins ?? []).filter((e) => {
    // Remove any that are from bbuild, so we can start afresh. But keep any others
    return !e.transform.includes(".universe/build/transformers");
  });

  for (const filename of files) {
    const filePath = path.join(transformersPath, filename);
    const stat = await fse.stat(filePath);
    if (filePath.endsWith(".js")) {
      if (stat.isFile()) {
        // Copy file
        await fse.copy(filePath, path.join(transformersPath, filename));
        plugins.push({
          transform: path.join(transformersPath, filename),
        });
      }
    }
  }

  const baseExists = fs.existsSync(projectPath("tsconfig.base.json"));

  const base = {
    files: [] as string[],
    ...(baseExists ? { extends: "./tsconfig.base.json" } : {}),
    compilerOptions: {
      lib: ["ESNext", "DOM"],
      sourceMap: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      module: "ESNext",
      moduleResolution: "node",
      declaration: true,
      declarationMap: true,
      jsx: getBuildContext().isDevMode ? "react-jsxdev" : "react-jsx",
      target: "ESNext",
      preserveSymlinks: true,
      outDir: "dist",

      plugins: uniqBy(plugins, (p: PluginConfig) => p.transform),

      // Should probably remove these at some point
      skipDefaultLibCheck: true,
      skipLibCheck: true,

      strictNullChecks: getBuildContext().config.name === "design-cloud",

      // To support references, project build mode
      composite: true,

      paths: {
        "modules/*": ["./*/src"],
      },
    },
    exclude: ["node_modules"],
    reflection: true,
    references: modules.map((m) => ({
      path: `./modules/${m.name}/tsconfig.json`,
    })),
  };

  if (!isEqual(existing.references, base.references)) {
    // Cached tsbuildinfo files need to be regenerated when new projects
    // are added to avoid ts errors
    removeGlob(projectPath(`**/*.tsbuildinfo`));
  }

  if (!existing || !isEqual(existing, base)) {
    await writeJSON(projectPath("tsconfig.json"), base);
  }

  // Modify for CJS
  base.compilerOptions.module = "CommonJS";
  base.references = modules.map((m) => ({
    path: `./modules/${m.name}/tsconfig.cjs.json`,
  }));

  let currentTsConfigCJS;
  if (fs.existsSync(projectPath("tsconfig.cjs.json"))) {
    currentTsConfigCJS = await readJSON(projectPath("tsconfig.cjs.json"));
  }

  if (!currentTsConfigCJS || !isEqual(currentTsConfigCJS, base)) {
    await writeJSON(projectPath("tsconfig.cjs.json"), base);
  }
}

export const TS_CONFIG: TsConfigJson & { reflection: boolean; "ts-node": any } =
  {
    reflection: true,
    extends: "@tsconfig/node16/tsconfig.json",
    "ts-node": {
      transpileOnly: true,
      files: true,
      esm: true,
      compilerOptions: {},
      experimentalSpecifierResolution: "node",
    },
    compilerOptions: {
      lib: ["ESNext"],
      sourceMap: true,
      experimentalDecorators: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      module: "ESNext",
      moduleResolution: "node",
      declaration: true,
      declarationMap: true,
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist"],
  };

export async function makeConfigs(projectFolder: string = projectPath()) {
  const tsConfigPath = path.join(projectFolder, "tsconfig.json");

  const cjs = {
    extends: "./tsconfig.json",
    compilerOptions: {
      outDir: "./dist/cjs",
      module: "commonjs",
      target: "esnext",
    },
  };
  const esm = {
    extends: "./tsconfig.json",
    compilerOptions: {
      outDir: "./dist",
      module: "esnext",
      target: "esnext",
    },
  };

  // Ensure src folder exists, otherwise we will confuse top-level source files
  // wiht output files
  const srcFolder = path.join(projectFolder, "src");
  if (!fse.existsSync(srcFolder)) {
    console.error(`No src folder found in ${projectFolder}`);
    process.exit();
  }

  if (await fse.pathExists(path.join(projectFolder, "dist"))) {
    await fse.rm(projectPath("dist"), { recursive: true });
  }
  await fse.mkdirp(projectPath("dist/cjs"));

  return map([cjs, esm], async (thisConfig) => {
    const thisConfigPath = tsConfigPath.replace(
      ".json",
      `.${thisConfig.compilerOptions.module}.json`
    );
    await writeJSON(thisConfigPath, thisConfig);
    await fse.mkdirp(projectPath("dist/esm"));

    if (thisConfig === cjs) {
      // Add module-type-specific package.json to commonjs subdirectory only
      const packageJSON = {
        type: "commonjs",
      };

      await writeJSON(
        path.join(
          projectFolder,
          thisConfig.compilerOptions.outDir,
          "package.json"
        ),
        packageJSON
      );
    }
    return {
      tsConfig: thisConfig,
      isCjs: thisConfig === cjs,
      watchCommand: async () => {
        await execa(getBinLocation("tsc"), [
          "-w",
          "--project",
          thisConfigPath,
          "--preserveWatchOutput",
        ]);
      },
      buildCommand: async () => {
        await execa(getBinLocation("tsc"), ["--project", thisConfigPath]);
      },
    };
  });
}
