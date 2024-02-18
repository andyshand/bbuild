import { z } from 'zod'

const BaseWorkflowNodeSchema = z.object({
  id: z.string(),
  lastValidatedData: z.string().nullable().optional(),
})

const LLMNodeSchema = BaseWorkflowNodeSchema.extend({
  type: z.literal('llm'),
  data: z.object({
    prompt: z.string(),
    model: z.array(z.string()).optional(),
    extract: z
      .array(z.union([z.literal('raw'), z.literal('json'), z.literal('codeblock')]))
      .optional(),
    messages: z
      .array(
        z.object({
          prompt: z.string(),
        }),
      )
      .optional(),
  }),
})

const CodeNodeSchema = BaseWorkflowNodeSchema.extend({
  type: z.literal('code'),
  data: z.object({
    prompt: z.string(),
    language: z.string().default('node'),
    code: z.string(),
    generating: z.boolean().default(false),
    generatedFromCode: z.string().optional(),
  }),
})
const UINodeSchema = BaseWorkflowNodeSchema.extend({
  type: z.literal('ui'),
  data: z.object({
    prompt: z.string(),
    code: z.string(),
    generating: z.boolean().default(false),
    generatedFromCode: z.string().optional(),
  }),
})

const TextNodeSchema = BaseWorkflowNodeSchema.extend({
  type: z.literal('text'),
  data: z.object({
    activeTab: z.number().nullable().default(0),
    items: z.array(
      z.object({
        title: z.string().default('').nullable().optional(),
        content: z.string(),
      }),
    ),
  }),
})

const InputNodeSchema = BaseWorkflowNodeSchema.extend({
  type: z.literal('input'),
  data: z.object({
    name: z.string().optional(),
  }),
})

const OutputNodeSchema = BaseWorkflowNodeSchema.extend({
  type: z.literal('output'),
  data: z.object({
    name: z.string().optional(),
  }),
})

const FileNodeSchema = BaseWorkflowNodeSchema.extend({
  type: z.literal('file'),
  data: z.object({
    id: z.string().optional(),
    lastPlayedTime: z.number().optional(),
  }),
})

const WorkflowNodeSchema = z.union([
  LLMNodeSchema,
  CodeNodeSchema,
  UINodeSchema,
  TextNodeSchema,
  InputNodeSchema,
  OutputNodeSchema,
  FileNodeSchema, // Added FileNodeSchema to the union
])

const WorkflowNodeResultSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  data: z.any(),
  error: z.any().optional(),
  nodeId: z.string(),
})

const ResultChainSchema = z.array(WorkflowNodeResultSchema)
const ResultChainsSchema = z.record(ResultChainSchema)

export const NodeSchemasForMagicGPT = {
  LLMNodeSchema,
  CodeNodeSchema,
  TextNodeSchema,
}

export type BaseWorkflowNode = z.infer<typeof BaseWorkflowNodeSchema>
export type LLMNode = z.infer<typeof LLMNodeSchema>
export type CodeNode = z.infer<typeof CodeNodeSchema>
export type UINode = z.infer<typeof UINodeSchema>
export type TextNode = z.infer<typeof TextNodeSchema>
export type InputNode = z.infer<typeof InputNodeSchema>
export type FileNode = z.infer<typeof FileNodeSchema> // Added FileNode type
export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>
export type WorkflowNodeResult = z.infer<typeof WorkflowNodeResultSchema>
export type ResultChain = z.infer<typeof ResultChainSchema>
export type ResultChains = z.infer<typeof ResultChainsSchema>
