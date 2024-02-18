type BuildType = {}

type SystemPluginResult = {}

type Idable = BuildType & {
  id: string
}

type Pluginn =
  | SystemPlugin
  | BeforeBuildPlugin
  | AfterBuildPlugin
  | SystemPlugin

type ProjectConfig = {
  plugins: Pluginn[]
}

type Project = Idable & {
  directory: string
  config: ProjectConfig
}

type BeforeBuildCtx = {}
type BeforeBuildPlugin = {
  run(ctx: BeforeBuildCtx): Promise<void>
}

type AfterBuildCtx = {}
type AfterBuildPlugin = {
  run(ctx: AfterBuildCtx): Promise<void>
}

type SystemCtx = {}
type SystemPlugin = {
  run(ctx: SystemCtx): Promise<void>
}

interface Task extends Idable {
  run(): Promise<void>
  status: 'pending' | 'running' | 'done' | 'failed'
}

type ResolverThing<ThingType> = {}
type ResolveResult<T extends ResolverThing<any>> = {}
type ResolveOpts<T extends ResolverThing<any>> = {}

/**
 * An action is a dep function with a zod input and zod output, such that
 * everything can be schema-fied.
 */
type Action = {
  fn: any
  inputSchema: any
  outputSchema: any
}

/**
 * Resolves a type of thing from a repository
 */
type Resolver<T extends ResolverThing<any>> = {
  resolve(opts: ResolveOpts<T>): Promise<ResolveResult<T>>
  provideActions(): Promise<Action[]>
}

// Built-in or MTYK resolvers will be
// - action resolvers. find all actions in a repo. based on config?
// - deps resolvers. all deps.ts files

// then we have a bunch of actions that are part of our compiler. meta actions to inspect
// the state of compilation, etc...
// getModules
// getModuleInfo

// then those that are added by resolvers such as
// getActions

export default null
