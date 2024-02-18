import assert from "@/util/assert";
import { OneConfig } from "../one/loadOneConfig";

let globalBuildContext: BuildContext | undefined;

export class BuildContext {
  isWatchMode: boolean;
  config: OneConfig;
  command?: string;
  isDevMode: boolean = false;

  constructor(opts: any) {
    Object.assign(this, opts);
  }
}

export function setupBuildContext(context: BuildContext) {
  assert(!globalBuildContext, "Build context already set up");
  globalBuildContext = context;
  return context;
}

export function getBuildContext() {
  assert(!!globalBuildContext, "Build context not set up");
  return globalBuildContext;
}
