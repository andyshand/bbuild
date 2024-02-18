import { ContextProvider } from 'modules/context/ContextProvider'
import {
  UniverseContextItem,
  createContextItem,
} from 'modules/context/UniverseEntityContextItem'
import parseContext from 'modules/context/parseContext'
import { cloneDeep } from 'modules/dash/index'
import { depFn, globalDepContext } from 'modules/deps/index'
import Entity from 'modules/entities/Entity'
import EntityField from 'modules/entities/EntityField'
import EntityFunction from 'modules/entities/EntityFunction'
import { publicInvariant } from 'modules/errors/index'
import { uniqueId } from 'modules/misc'
import vmDep from 'modules/vm/_deps'
import { Deps } from '../../Deps'
import { WorkflowHistoryItem } from './BlockSchema'
import { Workflow } from './ChatWorkflowEntity'
import { LLMNode, WorkflowNode, WorkflowNodeResult } from './NodeTypes'
import { WorkflowSessionContextProvider } from './WorkflowSessionContextProvider'
import { ParseMessage } from 'modules/llm/ParseMessage'
import findFileImports from './extractImportedPackages'

export class WorkflowSession extends Entity {
  @EntityField()
  workflow: string

  @EntityField({ defaultValue: [] })
  nodes: { id: string; input: Record<string, any> }[]

  @EntityField({ defaultValue: {} })
  resultChains: Record<string, WorkflowNodeResult[]>

  @EntityField()
  status: 'idle' | 'running' | 'complete' | 'error'

  @EntityField()
  history: WorkflowHistoryItem[]

  @EntityField({
    defaultValue: {
      processingNodes: [],
    },
  })
  state: {
    processingNodes: {
      id: string
    }[]
  }

  // Cached workflow object
  cachedWorkflow: Record<string, any>

  async fetchAndCacheWorkflowIfNull() {
    if (this.cachedWorkflow) {
      return
    }
    const workflow = await this.manager.read(Workflow, this.workflow)
    this.cachedWorkflow = JSON.parse(JSON.stringify(workflow.getEntityFieldValues()))
  }

  getWorkflow() {
    return this.cachedWorkflow
  }

  @EntityFunction()
  async preprocessWorkflow() {
    const { getCompletion } = globalDepContext.provideSync({
      getCompletion: Deps.getCompletion,
    })

    const wf = this.getWorkflow()

    for (const edge of wf.edges) {
      const sourceNode = wf.nodes.find((n) => n.id === edge.source)
      const targetNode = wf.nodes.find((n) => n.id === edge.target)

      // First, check if we've referenced specific outputs of nodes in the traget node
      // const translationFn = TranslationFunction.findOrCreate(this.entityManager, sourceNode.data, targetNode.inputSchema, 'Translation Function')
    }
  }

  async getLatestOutputValue({
    nodeId,
    chainId,
  }: {
    nodeId: string
    chainId: string
  }) {
    const chain = this.resultChains[chainId]
    if (!chain) {
      throw new Error(`Chain with id ${chainId} not found`)
    }
    const wf = this.getWorkflow()
    const node = wf.nodes.find((n) => n.id === nodeId)

    if (!node) {
      console.warn(`No node found with id ${nodeId}`)
      return null
    }

    if (node.type === 'text') {
      const activeTab = node.data.activeTab ?? 0
      return node.data.items?.[activeTab]?.content ?? ''
    }

    const nodeOutput = chain.filter((item) => item.nodeId === nodeId)
    if (!nodeOutput.length) {
      throw new Error(`No output found for node with id ${nodeId} in chain ${chainId}`)
    }

    const data = nodeOutput[nodeOutput.length - 1].data ?? null

    if (node.type === 'llm') {
      const { extract } = node.data
      const extractType = extract?.[0] ?? 'raw'

      if (extractType === 'codeblock') {
        return ParseMessage.code(data)
      } else if (extractType === 'json') {
        return ParseMessage.json(data)
      }
    }

    return data
  }

  async processLLM(args: {
    node: LLMNode
    getCompletion: any
    chainId: string
    wf: any
    process: any
    messageIndex?: number
    previousResults: { role: 'assistant'; content: 'string' }[]
  }) {
    const {
      node,
      getCompletion,
      chainId,
      wf,
      process,
      previousResults = [],
      messageIndex = 0,
    } = args
    const messages = node.data.messages ?? []
    const model = node.data.model?.[0] ?? 'gpt-4'
    const message = messages[messageIndex ?? 0]

    const userPrompt = message.prompt

    // Content is a prompt, but we need to replace the context items with their values
    const contextItems = parseContext(userPrompt)

    // Get edges in to this node
    const edgesToNode = (wf.edges ?? []).filter((edge) => edge.target === node.id)

    const resolvedOrNull = (
      await Promise.all(
        [
          ...contextItems.attachments,
          ...edgesToNode.map((e) => {
            return {
              item: createContextItem({
                id: e.source,
              }),
            }
          }),
        ].map(async (attachment) => {
          const item = attachment.item

          return {
            item: {
              ...item,
              type: 'node-result',
              metadata: await this.getLatestOutputValue({
                nodeId: item.id,
                chainId: chainId,
              }),
            } satisfies UniverseContextItem,
          }
        }),
      )
    ).filter((t) => t.item.metadata !== null)

    // Now we can say "Do something with output from @1"
    // and list all referenced values in the same prompt
    const prompt = !resolvedOrNull.length
      ? userPrompt
      : `You have the following context items available to you:

${resolvedOrNull
  .map((r) => `@${(r.item as any).id}\n\`\`\`${r.item.metadata}\n\`\`\``)
  .join('\n')}

  ${userPrompt}`
    const output = await getCompletion(
      [...(previousResults ?? []), { role: 'user', content: prompt }],
      {
        model,
      },
    )

    // if more messages
    if (messageIndex < messages.length - 1) {
      const newResults = (previousResults ?? []).concat({
        role: 'assistant',
        content: output,
      })

      return this.processLLM({
        node,
        getCompletion,
        chainId,
        wf,
        process,
        previousResults: newResults,
        messageIndex: messageIndex + 1,
      })
    } else {
      return output
    }
  }

  async processCodeNode({ node }: { node: WorkflowNode }) {
    const { code, language } = node.data as any
    const { vm } = globalDepContext.provideSync({
      vm: vmDep,
    })

    if (language === 'bash') {
      const out = await vm.run({
        type: 'bash',
        packages: [],
        files: {
          type: 'directory',
          name: '/',
          files: [
            {
              type: 'file',
              name: 'run.sh',
              content: code,
            },
          ],
        },
      })
      const outt = await out.handle.runAndWait()
      return outt
    } else {
      const packages = findFileImports(code)
      let category
      try {
        category = await this.manager.read('CategoryEntity', this.cachedWorkflow.category)
      } catch (e) {
        console.error(e)
      }

      const out = await vm.run({
        type: 'node',
        packages: packages.map((p) => ({ name: p })),
        binds: category?.projectLocation?.path
          ? [`${category.projectLocation.path}:/project`]
          : [],
        files: {
          type: 'directory',
          name: '/',
          files: [
            {
              type: 'file',
              name: 'globals.js',
              content: `
  // Setup workflow related data, required for node (not node js) api
  export default ${JSON.stringify({
    workflowId: this.workflow,
    nodeId: node.id,
    category: category?.getEntityFieldValues(),
  })};`,
            },
            {
              type: 'file',
              name: 'index.js',
              content: `import './node.js'`,
            },
            {
              type: 'file',
              name: 'node.js',
              content: code,
            },
          ],
        },
      })
      const outt = await out.handle.runAndWait()
      return outt
    }
  }

  @EntityFunction()
  async processNode(
    node: WorkflowNode,
    chainId: string,
    opts?: { input?: Record<string, any> },
  ) {
    const chain = this.resultChains[chainId]
    publicInvariant(!!chain, `No chain found with id ${chainId}`)

    this.state = {
      ...(this.state ?? {}),
      processingNodes: (this.state.processingNodes ?? []).concat({
        id: node.id,
      }),
    }

    const { getCompletion } = globalDepContext.provideSync({
      getCompletion: Deps.getCompletion,
    })

    const wf = this.getWorkflow()
    const process = this

    // Get the workflow
    const workflow = this.getWorkflow()
    const getNodeResult = async (node: WorkflowNode) => {
      if (node.type === 'llm') {
        return this.processLLM({
          node,
          getCompletion,
          chainId: chainId,
          previousResults: [],
          messageIndex: 0,
          wf,
          process,
        })
      } else if (node.type === 'code') {
        return this.processCodeNode({ node })
      } else if (node.type === 'text') {
        return this.getLatestOutputValue({
          nodeId: node.id,
          chainId: chainId,
        })
      }

      throw new Error(`Unknown node type`)
    }

    let resultObj: WorkflowNodeResult
    try {
      const result = await getNodeResult(node)
      resultObj = {
        id: uniqueId(),
        createdAt: new Date(),
        data: result,
        nodeId: node.id,
      }
    } catch (e) {
      resultObj = {
        id: uniqueId(),
        createdAt: new Date(),
        data: null,
        error: e.message,
        nodeId: node.id,
      }
      return resultObj
    }
    this.resultChains = {
      ...this.resultChains,
      [chainId]: [...chain, resultObj],
    }

    // Update state
    this.state = {
      ...(this.state ?? {}),
      processingNodes: this.state.processingNodes.filter((n) => n.id !== node.id),
    }

    return this.processNextNodes(node, chainId, workflow, resultObj)
  }

  async processNextNodes(
    node: WorkflowNode,
    chainId: string,
    workflow: any,
    resultObj: WorkflowNodeResult,
  ) {
    // Find edges from the current node
    const edgesFromNode = (workflow.edges ?? []).filter((edge) => edge.source === node.id)

    // Process each successor node
    const successorPromises = edgesFromNode.map((edge, index) => {
      const successorNode = workflow.nodes.find((node) => node.id === edge.target)
      if (!successorNode) {
        console.warn(`No node found with id ${edge.target}`)
        return Promise.resolve()
      }

      // Create a new chain for each successor node if there are multiple outgoing edges
      let newChainId = chainId
      if (edgesFromNode.length > 1) {
        newChainId = `${chainId}-${successorNode.id}-${uniqueId()}`
        this.resultChains = {
          ...this.resultChains,
          [newChainId]: [...(this.resultChains[chainId] || [])],
        }
      }

      return this.processNode(successorNode, newChainId)
    })

    // Wait for all successor nodes to finish processing
    await Promise.all(successorPromises)

    return resultObj
  }

  @EntityFunction()
  start = depFn({}, async function start(this: WorkflowSession, {}) {
    // Fetch and cache the workflow at the start of the session
    await this.fetchAndCacheWorkflowIfNull()

    const workflow = this.getWorkflow()

    // Identify start nodes
    const startNodes = workflow.nodes.filter(
      (node) =>
        (node.data.start === true && this.nodes.length === 0) ||
        this.nodes.find((n) => n.id === node.id),
    )

    if (startNodes.length === 0) {
      return
      // throw new Error('No start nodes found')
    }

    // Create async chains for each start node and store the promises
    const chainPromises = startNodes.map((startNode) => {
      const chainId = startNode.id
      this.resultChains[chainId] = []

      // Start the async chain and return the promise
      return this.processNode(startNode, chainId)
    })

    try {
      this.status = 'running'
      const totalResult = await Promise.all(chainPromises)
      this.status = 'complete'
      return totalResult
    } catch (e) {
      console.error(e)
      this.status = 'error'
      throw e
    }
  })

  @EntityFunction()
  async retriggerWorkflowFromResult({
    chainId,
    resultId,
  }: {
    chainId: string
    resultId: string
  }) {
    // Create a new WorkflowSession
    const newWorkflowSession = await this.manager.create(WorkflowSession, {
      nodes: [],
      workflow: this.workflow,
    })

    await newWorkflowSession.fetchAndCacheWorkflowIfNull()
    const workflow = newWorkflowSession.getWorkflow()

    // Add this new session id to the real workflow obj
    const realWorkflow = await this.manager.read(Workflow, this.workflow)
    realWorkflow.sessions = [...(realWorkflow.sessions ?? []), newWorkflowSession.id]

    // Clone the result chains from the old session to the new one
    const resultChains = cloneDeep(this.resultChains)

    // Remove the output of nodes that ran after this result
    for (const chain in resultChains) {
      const results = resultChains[chain] as WorkflowNodeResult[]
      const resultIndex = results.findIndex((result) => result.id === resultId)

      if (resultIndex !== -1) {
        // if the result is in the chain, remove all results after it
        resultChains[chain] = results.slice(0, resultIndex + 1)
      }

      // TODO do we need to do anything else here? Remove any results from edges out from this node/result?
    }
    newWorkflowSession.resultChains = resultChains

    // If there are no result chains, fail, since retriggering the workflow won't
    // work as expected. We are not partway through the workflow
    if (Object.keys(resultChains).length === 0) {
      throw new Error(`No result chains left`)
    }

    // Reset the state
    newWorkflowSession.state = {
      processingNodes: [],
    }

    // Reset the status to running
    newWorkflowSession.status = 'running'

    await this.processNextNodes(
      workflow.nodes.find(
        (n) => n.id === resultChains[chainId][resultChains[chainId].length - 1].nodeId,
      ),
      chainId,
      workflow,
      resultChains[chainId][resultChains[chainId].length - 1],
    )

    newWorkflowSession.status = 'complete'
  }
}

ContextProvider.addProvider(new WorkflowSessionContextProvider())
