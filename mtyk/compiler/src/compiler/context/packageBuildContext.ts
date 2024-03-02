export enum PackageBuildState {
  Watching,
  GeneratingExports,
  CopyingFiles,
}

const contexts: { [path: string]: PackageBuildContext } = {};

export class PackageBuildContext {
  public readonly path: string;
  progress: number = 0;
  state: PackageBuildState = PackageBuildState.Watching;
  message: string = "";

  constructor(path: string) {
    this.path = path;
  }

  setMessage(message: string) {
    this.message = message;
  }
}

export function getModuleBuildContext(moduleName: string) {
  if (!(moduleName in contexts)) {
    const context = new PackageBuildContext(moduleName);
    contexts[moduleName] = context;
    return context;
  }
  return contexts[moduleName];
}
