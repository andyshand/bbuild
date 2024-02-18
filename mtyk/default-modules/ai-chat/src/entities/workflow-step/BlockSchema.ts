import { ExecutionFn } from './ChatWorkflowEntity'
import { type Edge } from 'reactflow'

interface WorkflowStep {
  id: string
}
interface WorkflowCriteria extends WorkflowStep {
  criteria: string
}
interface WorkflowUserPrompt extends WorkflowStep {
  choices: string[]
  freeform?: boolean
  question: string
}
interface WorkflowFunction extends WorkflowStep {
  function: ExecutionFn
  checker: (output: any) => boolean
  maxAttempts: number
}

export type WorkflowStepType =
  | WorkflowCriteria
  | WorkflowUserPrompt
  | WorkflowFunction

export type WorkflowHistoryItem = {
  stepId: string
  id: string
  createdAt: Date
  data:
    | {
        type: 'code'
      }
    | {
        type: 'llm'
        result: string
      }
    | {
        type: 'function'
      }
}

export type WorkflowNodeInputOutput = {
  type: string
  name: string
}
export type WorkflowNodeInputOutputData = {
  inputs: WorkflowNodeInputOutput[]
  outputs: WorkflowNodeInputOutput[]
}

export type BlockTypes =
  | {
      type: 'code'
      data: {
        contents: string
        prompt: string
      }
      sessionData: {
        // Data that's stored while this block type is running
      }
    }
  | {
      type: 'string'
      data: {
        content?: string
      }
    }
  | {
      data: {}
      type: 'alert'
    }

export type WorkflowNodeBlockType = BlockTypes['type']
export type WorkflowNodeBlockData = BlockTypes['data']
/**
 * @deprecated
 */
export type WorkflowNodeSchema = {
  id: string
  position: {
    x: number
    y: number
  }
} & BlockTypes

export type EdgeSchema = Edge & {}
