export interface OneBuildContext {
  /**
   * The root path of the project
   */
  root: string;
}

export interface OnePlugin {
  prebuild: (context: OneBuildContext) => Promise<void>;
}
