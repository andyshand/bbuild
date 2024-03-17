import { ContextProvider, parseContext } from 'modules/context'
import { clone, isEqual, mapValues, startCase } from 'modules/dash/index'
import { depFn, globalDepContext, keyDep, zodDep } from 'modules/deps/index'
import EntityField from 'modules/entities/EntityField'
import { Entity, EntityFunction, EntityRelation } from 'modules/entities/index'
import { publicInvariant } from 'modules/errors/index'
import { ParseMessage } from 'modules/llm/ParseMessage'
import { z } from 'zod'
import { Deps } from '../../Deps'
import zodSchemaToTypeString from '../../zodSchemaToTypeString'
import { ChatEntity } from '../ChatEntity'
import { EdgeSchema, WorkflowNodeInputOutput } from './BlockSchema'
import { CodeNode, NodeSchemasForMagicGPT, UINode, WorkflowNode } from './NodeTypes'
import { WorkflowContextProvider, WorkflowNodeContextItem } from './WorkflowContextProvider'
import vmDep from 'modules/vm/_deps'
import runWorkflow from './actions/runWorkflow'
import { Model } from 'modules/open-ai'
import { prettifyZodError } from 'modules/schema'

const metaSessionTransient: {
  byNode: Record<
    string,
    {
      ui?: {
        handle: any
      }
    }
  >
} = {
  byNode: {},
}

export type ExecutionFn = (opts: { chat: ChatEntity }) => Promise<any>
let nextPort = 3004
function getNextPort() {
  return nextPort++
}

export class Workflow extends Entity {
  metadata: Record<string, any>

  @EntityField()
  name: string

  @EntityField({ defaultValue: {} })
  environment: Record<string, any>

  @EntityField({ defaultValue: 0 })
  remoteChangeCount: number

  @EntityRelation('CategoryEntity')
  @EntityField()
  category: string

  @EntityRelation('WorkflowSession')
  @EntityField({ defaultValue: [] })
  sessions: string[] = []

  @EntityField({ defaultValue: [] })
  nodes: WorkflowNode[]

  @EntityField({ defaultValue: [] })
  edges: EdgeSchema[]

  @EntityField()
  viewport: any

  @EntityField({
    defaultValue: {
      byNode: {},
    },
  })
  metasession: {
    byNode: Record<
      string,
      {
        ui?: {
          href: string
        }
      }
    >
  }

  @EntityFunction()
  startMetaSession = depFn({}, async function ({}) {
    const { vm } = globalDepContext.provideSync({
      vm: vmDep,
    })
    const newMetaSession: Workflow['metasession'] = {
      byNode: {},
    }

    // TODO remove this when multiple concurrent sessions
    await vm._removeAllMTYK()

    for (const node of this.nodes) {
      if (node.type === 'ui') {
        const data = node.data as UINode['data']
        const port = getNextPort()
        const out = await vm.run({
          type: 'vite',
          ports: [port],
          files: {
            type: 'directory',
            files: [
              {
                type: 'directory',
                name: 'src',
                files: [
                  {
                    type: 'file',
                    content: data.code,
                    name: 'App.tsx',
                  },
                  {
                    type: 'file',
                    content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
<React.StrictMode>
  <App />
</React.StrictMode>,
)`,
                    name: 'main.tsx',
                  },
                ],
              },
            ],
            name: '/',
          },
          packages: [],
        })

        const containerHandle = await out.handle.runLive()

        newMetaSession.byNode[node.id] = {
          ui: {
            href: `http://localhost:${port}`,
          },
        }
        metaSessionTransient.byNode[node.id] = {
          ui: {
            handle: out,
          },
        }
      }
    }

    this.metasession = newMetaSession
  })

  /**
   * Returns string representation of the schema for a given node.
   *
   * Could be a string like `type Output = { ... fields ... }` or just `string`
   *
   * Will be interpreted by AI
   */
  getNodeSchema(id: string, inputOrOutput: 'input' | 'output'): string {
    const node = this.nodes.find((n) => n.id === id)
    publicInvariant(!!node, `Node not found: ${id}`)

    const inputOutput = node.data[inputOrOutput]
    publicInvariant(!!inputOutput, `Input/Output not found: ${id} ${inputOrOutput}`)

    return inputOutput || 'string'
  }

  getNode(id: string): WorkflowNode {
    const node = this.nodes.find((n) => n.id === id)
    publicInvariant(!!node, `Node not found: ${id}`)
    return node
  }

  @EntityFunction()
  magicCreateNode = depFn(
    {
      input: zodDep(z.string()),
      getJSONCompletion: Deps.getJSONCompletion,
    },
    async ({ input, getJSONCompletion }) => {
      const nodeTypes = mapValues(NodeSchemasForMagicGPT, (v, key) =>
        zodSchemaToTypeString(v, key)
      )

      const obj = await getJSONCompletion(
        `I need you to create the JSON data for a new node in an infinite canvas app.

Here are the types of nodes you can create:
${Object.keys(nodeTypes)
  .map((k) => `${k} - ${nodeTypes[k]}`)
  .join('\n\n')}

I will now present you with a user query that should be used to create the node. 

You node must conform to one of the above schemas. Choose whichever one you think is most appropriate.

All input from this point forward is the user query:

${input}`,
        {
          response_format: { type: 'json_object' },
          model: Model.GPT4TurboPreview,
        }
      )

      // Ensure it matches one of the schemas
      let matched = false
      for (const [key, schema] of Object.entries(NodeSchemasForMagicGPT)) {
        try {
          schema.parse(obj)
          matched = true
          break
        } catch (e) {
          console.error(`Couldn't match schema for ${key}:`)
          console.error(prettifyZodError(e))
        }
      }
      if (matched) {
        return this.createNode(obj)
      } else {
        console.error('Could not match schema', obj)
        throw new Error('Could not match schema')
      }
    }
  )

  createNode = ({ data, type }: { data: any; type: string }) => {
    // Initialize nextUnusedId with 0
    const nextUnusedId =
      // Reduce the nodes array to find the maximum id
      (this.nodes ?? []).reduce((acc, cur) => {
        // Parse the id of the current node to an integer
        const id = parseInt(cur.id)
        // If the id of the current node is greater than the accumulated maximum, return it
        if (id > acc) {
          return id
        }
        // Otherwise, return the accumulated maximum
        return acc
      }, 0) + 1 // Increment the maximum id found to get the next unused id

    const node = {
      style: {
        height: 350,
        width: 350,
      },
      position: {
        x: 0,
        y: 0,
      },
      id: nextUnusedId.toString(),
      type: type,
      data: {
        content: '',
        ...(data ?? {}),
      },
      sourcePosition: 'right',
      targetPosition: 'left',
    }
    // this.nodes = this.nodes.concat([node])
    return node
  }

  updateNode(
    id: string,
    data: Partial<WorkflowNode> | ((node: WorkflowNode) => WorkflowNode)
  ) {
    const node = clone(this.nodes.find((n) => n.id === id))
    publicInvariant(!!node, `Node not found: ${id}`)
    if (typeof data === 'function') {
      const updatedData = data(node)
      Object.assign(node, updatedData)
    } else {
      Object.assign(node, data)
    }
    const newNodes = this.nodes.map((n) => (n.id === id ? node : n))
    this.updateNodes({ nodes: newNodes })
    this.remoteChangeCount = (this.remoteChangeCount ?? 0) + 1
  }

  @EntityFunction()
  updateNodes(opts: { nodes: WorkflowNode[] }) {
    const { nodes } = opts
    const newNodes: WorkflowNode[] = []
    const changedNodes: WorkflowNode[] = []

    nodes.forEach((node) => {
      const existingNode = this.nodes.find((n) => n.id === node.id)
      if (!existingNode) {
        newNodes.push(node)
      } else if (!isEqual(existingNode, node)) {
        changedNodes.push(node)
      }
    })

    this.nodes = nodes
    this.postUpdateNodes({ nodes: this.nodes, newNodes, changedNodes })
  }

  async postUpdateNodes({
    nodes,
    newNodes,
    changedNodes,
  }: {
    nodes: WorkflowNode[]
    newNodes: WorkflowNode[]
    changedNodes: WorkflowNode[]
  }) {
    const newOrchangedNodes = newNodes.concat(changedNodes)
    for (const newOrChangedNode of newOrchangedNodes) {
      if (newOrChangedNode.type === 'ui') {
        const data = newOrChangedNode.data as UINode['data']

        if (metaSessionTransient.byNode[newOrChangedNode.id]?.ui?.handle) {
          const { handle } = metaSessionTransient.byNode[newOrChangedNode.id]?.ui!
          if (typeof handle.writeFiles === 'function') {
            handle.writeFiles({
              type: 'directory',
              files: [
                {
                  type: 'directory',
                  name: 'src',
                  files: [
                    {
                      type: 'file',
                      content: data.code,
                      name: 'App.tsx',
                    },
                  ],
                },
              ],
            })
          }
        }
      }
    }
  }

  @EntityFunction()
  async run(opts: { nodes: any[] }): Promise<any> {
    await this.validateNodes()
    const session = await runWorkflow({
      opts: {
        ...opts,
        workflowId: this.id,
      },
    })
    this.sessions = this.sessions.concat([session.id])
    return session
  }

  /**
   * @note server side only
   */
  async validateNodes() {
    // Go through all nodes, if inputs/outputs have changed, let node update itself
    // If node has changed, update all edges that reference it
    // for (const node of this.nodes) {
    //   const dataStr = JSON.stringify(node.data)
    //   if (node.lastValidatedData !== dataStr) {
    //     // Node data has changed
    //     // If inputs/outputs have changed, we may need to regen code for code nodes,
    //     // other data for other types of nodes
    //     let newNodeData = cloneDeep(node.data)
    //     // Ensure we have representations of the node types
    //     if (node.data.input) {
    //       const interpretd = this.aiInterpretTypeStr(
    //         node.data.input,
    //         node.data.interpretedInput
    //       )
    //       newNodeData.interpretedInput = interpretd
    //     }
    //     if (node.data.output) {
    //       const outputType = this.aiInterpretTypeStr(
    //         node.data.output,
    //         node.data.interpretedOutput
    //       )
    //       newNodeData.interpretedOutput = outputType
    //     }
    //     this.updateNode(node.id, (node) => {
    //       return {
    //         ...node,
    //         data: newNodeData,
    //         lastValidatedData: JSON.stringify(newNodeData),
    //       }
    //     })
    //   }
    // }
  }

  aiInterpretTypeStr(typeStr: string, existingInterpretation?: string): string {
    if (!typeStr.trim()) {
      return 'string' // always default to passing around strings
    }

    // Check if simple javascript type like "string"
    if (['string', 'number', 'boolean'].includes(typeStr.toLowerCase())) {
      return typeStr.toLowerCase()
    }

    // Otherwise, should we convert into a zodObject? TODO
    // const { getCompletion } = globalDepContext.provideSync({
    //   getCompletion: Deps.getCompletion,
    // })

    // ¯\\_(ツ)_/¯ TODO
    return typeStr.trim()
  }

  getCategory() {
    return this.manager.read('CategoryEntity', this.category)
  }

  @EntityFunction()
  postUpdate = depFn({}, async () => {
    this.validateNodes()

    for (const node of this.nodes) {
      const validateCode = async (node: CodeNode) => {
        const { data } = node

        const parsed = parseContext(data.prompt)
        const { attachments, content } = parsed

        // If we reference other nodes, we need to add an edge from that node
        // and ensure our input matches its output. this needs to be kept in sync
        // as the workflow changes. So we'll continually check here.
        if (attachments.length) {
          for (const a of attachments) {
            const resolved = await ContextProvider.provide(this, {
              id: a.item.id,
            })
            const sourceNodeCtx = resolved.find(
              (r) => (r as any).type === 'workflow-node' && (r as any).id === a.item.id
            ) as WorkflowNodeContextItem | undefined
            if (sourceNodeCtx) {
              // Now that we have an edge, make sure we have an input that matches
              // the output of that node
              const sourceNodeNode = this.nodes.find(
                (n) => n.id === sourceNodeCtx.id
              ) as CodeNode
              publicInvariant(!!sourceNodeNode, `Node not found: ${sourceNodeCtx.id}`)

              const existingEdge = this.edges.find(
                (e) => e.source === sourceNodeCtx.id && e.target === node.id
              )
              if (!existingEdge) {
                this.edges = this.edges.concat([
                  {
                    id: `reactflow__edge-${sourceNodeCtx.id}${sourceNodeCtx.id}-${node.id}${node.id}`,
                    style: {
                      strokeWidth: 3,
                      stroke: 'black',
                    },
                    type: 'default',
                    animated: true,
                    markerEnd: {
                      type: 'arrowclosed' as any,
                      color: 'black',
                    },
                    source: sourceNodeCtx.id,
                    sourceHandle: sourceNodeCtx.id,
                    target: node.id,
                    targetHandle: node.id,
                    // type: 'floating',
                  },
                ])
              }

              let newInputs: WorkflowNodeInputOutput[] = []
              // if (Array.isArray(sourceNodeNode.data.outputs)) {
              //   for (const output of sourceNodeNode.data.outputs) {
              //     if (
              //       !sourceNodeNode.data.inputs.find(
              //         (i) => i.type === output.type
              //       )
              //     ) {
              //       newInputs.push(output)
              //     }
              //   }
              // }
              // if (newInputs.length) {
              //   this.updateNode(sourceNodeCtx.id, (node) => {
              //     return {
              //       ...node,
              //       inputs: (node as any).inputs.concat(newInputs),
              //     }
              //   })
              // }
            }
          }
        }
      }
      if (node.type === 'code') {
        await validateCode(node as CodeNode)
      }
    }

    return {
      nodes: this.nodes,
      edges: this.edges,
    }
  })

  @EntityFunction()
  getNodeFolderOnDisk = depFn(
    { node: zodDep(z.object({ id: z.string() })) },
    async ({ node }) => {
      const {
        os,
        fs,
        path: nodePath,
      } = globalDepContext.provideSync({
        os: keyDep('node:os'),
        fs: keyDep('node:fs'),
        path: keyDep('node:path'),
      })
      const path = nodePath.join(os.tmpdir(), `/workflow-edit/${this.id}/nodes/${node.id}`)

      // Make dir if not exists
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true })
      }

      return path
    }
  )

  @EntityFunction()
  runNodeAction = depFn(
    {
      opts: zodDep(
        z.object({
          nodeId: z.string(),
          actionId: z.string(),
          params: z.any(),
        })
      ),
      getCompletion: Deps.getCompletion,
    },
    async function runNodeAction(this: Workflow, { opts, getCompletion }) {
      //
      const wf = this
      const node = this.nodes.find((n) => n.id === opts.nodeId)
      publicInvariant(!!node, `Node not found: ${opts.nodeId}`)

      const actionsForNodes = {
        code: {
          openInEditor: depFn(
            {
              params: zodDep(z.object({})),
            },
            async function openInEditor({ params }) {
              const data = (node as CodeNode).data
              const nodeFolderPath = await wf.getNodeFolderOnDisk({ node })

              const {
                fs,
                child_process: { exec },
                path,
              } = globalDepContext.provideSync({
                fs: keyDep('node:fs'),
                child_process: keyDep('node:child_process'),
                path: keyDep('node:path'),
              })

              const filePath = path.join(nodeFolderPath, 'index.ts')

              // Write file
              await fs.promises.writeFile(filePath, data.code)

              // Open in editor
              exec(`code ${filePath}`)
            }
          ),
          generate: depFn(
            {
              params: zodDep(z.object({})),
            },
            async function generateCode({ params }) {
              wf.updateNode(opts.nodeId, (node) => {
                return {
                  ...node,
                  data: { ...node.data, generating: true },
                } as any
              })
              const data = (node as CodeNode).data
              const prompt = data.prompt
              // const inputs = []
              // const outputs = []
              const language = data.language ?? 'node'

              let fnTemplate, ourPrompt
              if (language === 'bash') {
                ourPrompt = `You are a code generation tool. You have been asked to generate a bash script to achieve the following end: ${prompt}. 

Please return the full script body, including the shebang line, inside a markdown code block. Do not respond with any other text, or explanation. Only the code.`
              } else {
                fnTemplate = `export default function generatedFn({
                }): {
                } {
                  // Code goes here
                }`
                ourPrompt = `You are a code generation tool. You have been asked to generate typescript code to achieve the following end: ${prompt}. 
                
You must write a function that adheres to the following signature:
${fnTemplate}

You may not use any external libraries. Use only built-in NodeJS functionality.

Use ESM import statements. Do NOT use \`require\` or CJS conventions.

Please return the full function body, including the function signature as shown above. Do not respond with any other text, or explanation. Only the code.`
              }

              const output = await getCompletion(ourPrompt, {
                model: 'gpt-4',
              })

              const code = ParseMessage.code(output)

              wf.updateNode(opts.nodeId, (node) => {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    code,
                    generating: false,
                    generatedFromCode: code,
                  },
                } as any
              })
            }
          ),
        },
        ui: {
          generate: depFn(
            {
              params: zodDep(z.object({})),
            },
            async function generateCode({ params }) {
              wf.updateNode(opts.nodeId, (node) => {
                return {
                  ...node,
                  data: { ...node.data, generating: true },
                } as any
              })
              const prompt = (node as unknown as UINode).data.prompt

              const fnTemplate = `
\`\`\`tsx
import React from 'react'
              
export default function NewComponent(props: {}) {
  // Code goes here
}
\`\`\``.trim()
              const ourPrompt = `I want you to generate a React component based on the following description: "${prompt}". 
              
Your overall module needs to conform to the following basic structure:
${fnTemplate}

You may not use any external libraries.

Use ESM import statements. Do NOT use \`require\` or CJS conventions.

Use tailwind classnames for styling.

Respond only with the code with no additional explanation.`

              const output = await getCompletion(ourPrompt, {
                model: 'gpt-4',
              })

              const code = ParseMessage.code(output)

              wf.updateNode(opts.nodeId, (node) => {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    code,
                    generating: false,
                    generatedFromCode: code,
                  },
                } as any
              })
            }
          ),
        },
      }

      const action = actionsForNodes[node.type][opts.actionId]
      publicInvariant(!!action, `Action not found: ${opts.actionId}`)

      return action({ params: opts.params })
    }
  )
  static getNodeName(node: WorkflowNode, wf: Workflow) {
    switch (node.type) {
      // Add cases for all other types
      case 'input':
        const index = wf.nodes
          .filter((n) => n.type === 'input')
          .findIndex((n) => n.id === node.id)
        return node.data?.name ?? `Input ${index + 1}`
      default:
        return startCase(node.type)
    }
  }
}

ContextProvider.addProvider(new WorkflowContextProvider())

if (typeof window === 'undefined') {
  // If on server, watch tmp folder for workflows for changes and then update relevant code nodes
  // const watchTmpFolder = async () => {
  //   const { chokidar } = globalDepContext.provideSync({
  //     chokidar: keyDep('npm:chokidar'),
  //   })
  //   const { fs, path, os, entityManager } = globalDepContext.provideSync({
  //     fs: keyDep('node:fs'),
  //     path: keyDep('node:path'),
  //     os: keyDep('node:os'),
  //     entityManager: Deps.entityManagerDep,
  //   })
  //   const workflowEditDir = path.join(os.tmpdir(), 'workflow-edit')
  //   const watcher = chokidar.watch(workflowEditDir, { persistent: true })
  //   watcher.on('change', async (filePath) => {
  //     const relativePath = path.relative(workflowEditDir, filePath)
  //     const [workflowId, , nodeId] = relativePath.split(path.sep)
  //     // Update the relevant node in the workflow
  //     const workflow = (await entityManager.read('Workflow', workflowId)) as
  //       | Workflow
  //       | undefined
  //     if (workflow) {
  //       const node = workflow.nodes.find((n) => n.id === nodeId)
  //       if (node && node.type === 'code') {
  //         const newCode = fs.readFileSync(filePath, 'utf-8')
  //         workflow.updateNode(nodeId, {
  //           ...node,
  //           data: { ...node.data, code: newCode },
  //         })
  //       }
  //     }
  //   })
  // }
  // setTimeout(watchTmpFolder, 1000)
}
