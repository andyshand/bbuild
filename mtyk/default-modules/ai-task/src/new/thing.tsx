import { globalDepContext } from 'modules/deps/createDepContext'
import toposort from 'toposort'
import { keyDep } from 'modules/deps/tokenDep'

export interface TaskInput {
  buffer: string

  fixedUpTo: number
}

export interface TaskAction {}

export type TaskOutputTarget = {
  type: 'file'
  path: string
  region?: {
    start: number
    end: number
  }
}

class Workflow {}

abstract class WorkflowStep {
  id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed' = 'pending'
  error?: Error
  ticks: number = 0

  getCompletion(...args) {
    const { getCompletion } = globalDepContext.provideSync({
      getCompletion: keyDep('getCompletion'),
    })
    return getCompletion(...args)
  }

  constructor() {
    this.id = Math.random().toString()
  }

  abstract run(input: TaskInput): Promise<any>

  async tick(input: TaskInput) {
    try {
      this.status = 'running'
      this.run(input)
      this.status = 'completed'
    } catch (error) {
      this.status = 'failed'
      this.error = error
    }
  }
}

class WorkflowStepTask extends WorkflowStep {
  run(input: TaskInput): Promise<any> {
    throw new Error('Method not implemented.')
  }
  type = 'prompt'
  prompt: string
  input: string
  constructor(opts: { prompt: string; input: string }) {
    super()
    this.prompt = opts.prompt
    this.input = opts.input
  }
}

class WorkflowClassifyStep extends WorkflowStep {
  run(input: TaskInput): Promise<any> {
    throw new Error('Method not implemented.')
  }
  type = 'classify'
  prompt: string
  constructor(opts: { prompt: string; input: string }) {
    super()
  }
}

class WorkflowManualInteractionStep extends WorkflowStep {
  run(input: TaskInput): Promise<any> {
    throw new Error('Method not implemented.')
  }
  type = 'manual'
  prompt: string
  constructor(opts: { prompt: string; input: string }) {
    super()
  }
}

class WorkflowOutputStep extends WorkflowStep {
  type = 'output'
  run(input: TaskInput): Promise<any> {
    throw new Error('Method not implemented.')
  }
}

class WorkflowInputStep extends WorkflowStep {
  run(input: TaskInput): Promise<any> {
    throw new Error('Method not implemented.')
  }
  type = 'input'
  prompt: string
  constructor(opts: { prompt: string; input: string }) {
    super()
  }
}

class WorkflowOutputFileStep extends WorkflowOutputStep {
  run(input: TaskInput): Promise<any> {
    throw new Error('Method not implemented.')
  }
  type = 'output'
  prompt: string
  constructor(opts: { prompt: string; input: string }) {
    super()
  }
}

class WorkflowOutputTextStep extends WorkflowOutputStep {
  run(input: TaskInput): Promise<any> {
    throw new Error('Method not implemented.')
  }
  type = 'output'
  prompt: string
  constructor(opts: { prompt: string; input: string }) {
    super()
  }
}
class WorkflowParallelStep extends WorkflowStep {
  type = 'parallel'
  steps: WorkflowStep[]

  constructor(opts: { steps: WorkflowStep[] }) {
    super()
    this.steps = opts.steps
  }

  async run(input: TaskInput): Promise<any> {
    // Run all steps in parallel
    const results = await Promise.all(this.steps.map((step) => step.run(input)))

    // Decide which result to use
    // This could be based on some criteria, or you could just use the first successful result
    const successfulResults = results.filter((result) => result.success)
    return successfulResults[0]
  }
}

// Edges are represented as pairs of WorkflowSteps [from, to]
class WorkflowGraph {
  edges: [WorkflowStep, WorkflowStep][] = []

  addEdge(a: WorkflowStep, b: WorkflowStep) {
    this.edges.push([a, b])
  }
}

async function runWorkflowGraph(graph: WorkflowGraph) {
  // Generate array for toposort
  const arrayForToposort = graph.edges.map((edge) =>
    edge.map((node) => node.id)
  )

  // Get ordered list of node IDs
  const sortedIDs = toposort(arrayForToposort)

  // Create a map of id -> WorkflowStep for easy access
  const stepMap = new Map()
  graph.edges.forEach((edge) => {
    edge.forEach((node) => stepMap.set(node.id, node))
  })

  // Run each step in order
  for (const id of sortedIDs) {
    const step = stepMap.get(id)
    if (step) {
      const input = {} // Get input for this step
      await step.run(input)
    }
  }
}
