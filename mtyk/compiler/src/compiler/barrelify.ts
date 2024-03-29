import * as fs from "fs";
import _ from "lodash";
import * as path from "path";
import { parse } from "yaml";
import { z } from "zod";
import { hasCacheChanged } from "./cache";

function toCamelCase(str: string, startCapital = false) {
  const out = _.startCase(str).replace(/\s(.)/g, (_, c) => c.toUpperCase());
  return startCapital ? out : out[0].toLowerCase() + out.slice(1);
}

function removeExtension(filename: string) {
  return filename.replace(/\.\w+$/, "");
}
const barrelConf = z.object({
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional().default([]),
  startCase: z.boolean().optional().default(false),
  all: z.boolean().optional().default(false),
  extensions: z
    .array(z.string())
    .optional()
    .default(["ts", "tsx", "js", "jsx", "json"])
    .describe("File extensions to include"),
  array: z
    .boolean()
    .optional()
    .default(false)
    .describe(`Export all files in the folder as an array`),
});

function barrelifyDir(dir: string, config: z.infer<typeof barrelConf>) {
  let barreled = [];
  const include = config.include ?? [];
  const exclude = config.exclude ?? [];
  const files = fs.readdirSync(dir);
  const indexPath = path.join(dir, "index.ts");
  if (
    !hasCacheChanged(
      `${dir}/*`,
      {
        ignore: [indexPath],
      },
      "barrel" + dir
    )
  ) {
    return;
  }

  let indexContent = `// Auto-generated by @mtyk/workflow\n\n`;
  for (const file of files) {
    const noExtension = removeExtension(file);
    if (file.startsWith("index")) {
      continue;
    }
    if (include.length > 0 && !include.includes(noExtension)) {
      // Ignore files not in include list
      continue;
    }
    if (exclude.includes(noExtension)) {
      // Ignore files in exclude list
      continue;
    }
    const matchesExtensions = config.extensions.some((ext) =>
      file.endsWith(ext)
    );
    if (!matchesExtensions) {
      // Ignore files not in extensions list
      continue;
    }

    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      continue;
    } else {
      const exportName = toCamelCase(removeExtension(file), config.startCase);
      barreled.push(exportName);
      if (config.array) {
        indexContent += `import ${exportName} from './${removeExtension(
          file
        )}'\n`;
      } else {
        const exportt = config.all ? `*` : `{ default as ${exportName} }`;
        indexContent += `export ${exportt} from './${removeExtension(file)}'\n`;
      }
    }
  }

  if (config.array) {
    indexContent += `export default [${barreled.join(", ")}]\n`;
  }

  fs.writeFileSync(indexPath, indexContent);
}

export default async function barrelify(srcFolder: string) {
  async function iterateDir(dir: string) {
    const files = fs.readdirSync(dir);
    const barrelConfig = files.find((file) => file === ".barrel.yml");
    if (barrelConfig) {
      const obj =
        parse(fs.readFileSync(path.join(dir, barrelConfig), "utf8")) ?? {};
      const config = barrelConf.parse(obj);

      try {
        barrelifyDir(dir, config);
      } catch (e) {
        console.error(e);
        return;
      }
    }
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        await iterateDir(fullPath);
      }
    }
  }

  await iterateDir(srcFolder);
}
