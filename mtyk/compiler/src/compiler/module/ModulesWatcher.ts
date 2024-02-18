import { projectPath } from "@/compiler/path";
import { EventRouter } from "@/util/events";
import glob from "glob";
import watch from "node-watch";

export type ModuleEvents = {
  changed: undefined;
  added: string;
};

export class ModulesWatcher extends EventRouter<ModuleEvents> {
  watcher;
  constructor() {
    super();

    const paths = [
      projectPath("modules"),
      ...glob.sync(projectPath("modules/*/package.json")),
      ...glob.sync(projectPath("modules/*/one.config.js")),
      ...glob.sync(projectPath("modules/*/src/")),
    ];

    this.watcher = watch(paths, { recursive: true, delay: 0 });

    this.watcher.on("change", (event, path) => {
      if (event === "update" || event === "remove") {
        const splittedPath = path.split("/");
        const modulesIndex = splittedPath.indexOf("modules");
        let module = null;

        if (modulesIndex !== -1 && modulesIndex < splittedPath.length - 1) {
          module = splittedPath[modulesIndex + 1];
        }
        if (path.includes("src")) {
          if (path.includes("_deps.ts")) return;

          this.emit("changed", "src/" + module);
          return;
        }
        const pathIsDirectModule =
          path.split("/modules/")[1]?.split("/").length === 0;
        const isTopLevelModuleFile =
          path.split("/modules/")[1]?.split("/").length === 2;
        const isPackageJSON =
          path.split("/").pop() === "package.json" && isTopLevelModuleFile;
        const isOneConfig =
          path.split("/").pop() === "one.config.js" && isTopLevelModuleFile;
        if (pathIsDirectModule || isPackageJSON || isOneConfig) {
          //@ts-ignore
          this.emit("changed", module);
        }
      }
    });
  }

  async stop() {
    if (this.watcher) {
      this.watcher.close();
    }
  }
}
