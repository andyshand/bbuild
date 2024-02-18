import { Actionresult } from './Actionresult'
import JSON5 from 'json5'
import { findAction } from './availableActions'
import { getCompletionNoStream } from './getCompletionNoStream'
const _ = require('lodash')
const { omit } = _
interface WorkingMemoryTask {
  task: string
  subtasks: WorkingMemoryTask[]
}

class WorkingMemory {
  tasks: WorkingMemoryTask[] = []
}

const markdown = (language: string, code: string) => {
  return `\`\`\`${language}
${code}
\`\`\``
}

class SuggestionError extends Error {
  suggested: any[]
  constructor(message: string, suggested: any[]) {
    super(message)
    this.name = 'SuggestionError'
    this.suggested = suggested
  }
}

export default class AITask {
  mainTask: string = 'default'

  failures = 0
  actionLog: (Actionresult & { action: string })[] = []
  thoughts: string[] = []
  constructor(opts: { mainTask: string }) {
    Object.assign(this, opts)
  }

  extra = `To help me complete tasks, I can query for information or perform actions.

  After I perform a query, I need to use my best judgement to decide whether the result is what I was looking for.
  
  Likewise, after performing an action, I must check the result to decide whether my goal has been completed successfully.`
  workingMemory = new WorkingMemory()
  async generatePrompt(params: {
    existingThoughts?: string
    promptThoughts?: boolean
  }) {
    let prompt = `I am an intelligent assistant that has been assigned to complete tasks.

When provided with a goal, my responses will consist of the following format:
1. Query for information
${markdown('json', JSON5.stringify({ action: 'github.repos.list' }))}
2. Perform an action
${markdown(
  'json',
  JSON5.stringify({
    action: 'github.repos.create',
    params: { name: 'my-repo' },
  })
)}
3. Message my owner with a successful result, or if I am unsure as to how to proceed.
${markdown(
  'json',
  JSON5.stringify({
    action: 'message.send',
    params: { message: 'the weather is 16°', success: true },
  })
)}

I must only pass strings, booleans, numbers and plain objects or arrays as parameters to actions. I cannot send functions or code to be evaluated.

If I do not get the result I expect, I should reflect on why this has happened and what possible steps I might take to validate my thoughts. 

I should not repeat actions that I know have not worked in the past.

If I am completely stuck, my owner will usually be able to help me. 

My owner does not have access to my action log, so I must be sure that I include all relevant information inside any messages I send. 

My current goal is to:
${JSON5.stringify(this.mainTask)}

A summary of my action log so far is:
${await this.summarizeActionLog()}
`
    // const mythoughtsPrompt = `Given the action log so far, here are my thoughts and step-by-step plan:`
    const mythoughtsPrompt = `Based on the action log so far, I can conclude that:`
    const mynextactionPrompt =
      'Based on my conclusions, my next action should be:\n```json\n'
    if (params.existingThoughts) {
      prompt += `${mythoughtsPrompt} ${params.existingThoughts}\n\n`
      prompt += mynextactionPrompt
    } else if (params.promptThoughts) {
      prompt += mythoughtsPrompt
    } else {
      prompt += mynextactionPrompt
    }

    return prompt
  }

  cleanupCode(code: string) {
    // Remove trailing markdown code block
    if (code.indexOf('```')) {
      // Remove everything after the first markdown code block
      code = code.split('```')[0]
    }
    code = code.replace(/```/, '')
    // Replace trailing semicolon or comma
    code = code.replace(/[;,]*$/, '')
    return code.trim()
  }

  summaries: string[] = []
  async summarizeActionLog() {
    if (this.summaries.length === this.actionLog.length) {
      return this.summaries[this.summaries.length - 1] ?? 'Empty'
    }
    const prompt = `I am an intelligent assistant that has been assigned to complete tasks.

I have been tasked with the following goal:
${JSON5.stringify(this.mainTask)}

My action log is currently${this.actionLog.length === 0 ? ' empty' : ''}}:
${JSON5.stringify(
  this.actionLog.map(i => {
    return omit(i, ['success'])
  })
)}

A brief but specific bullet-point summary of my actions and their results so far is:
- `
    const summary = await getCompletionNoStream(prompt)
    this.summaries.push(summary)
    console.log({ summary, actionLog: this.actionLog })
    return summary
  }

  parseAction(code: string) {
    // const [object, methodParams] = code.split('.')
    const parsed = JSON5.parse(code)

    return {
      ...parsed,
      object: parsed.action.split('.')[0],
      action: parsed.action.split('.').slice(1).join('.'),
    }
    // const [p, ...parameters] = code.split('(')
    // const object = p.split('.')[0]
    // const method = p.split('.').slice(1).join('.')

    // const params = JSON5.parse(parameters.join('(').slice(0, -1))
    // return { object, action: method, params }
  }

  async next() {
    let prompt: string

    const shouldgetThoughts = this.actionLog.length > 0
    if (shouldgetThoughts) {
      const thoughtsPrompt = await this.generatePrompt({ promptThoughts: true })
      const thoughts = await getCompletionNoStream(thoughtsPrompt)
      console.log({ thoughts })
      prompt = await this.generatePrompt({ existingThoughts: thoughts })
    } else {
      prompt = await this.generatePrompt({})
    }

    // console.log({ prompt })
    const completion = await getCompletionNoStream(prompt)
    const cleanupcode = this.cleanupCode(completion)

    try {
      const action = this.parseAction(cleanupcode)
      console.log({ action })
      const actions = await findAction({})
      const matching = actions.result.find(
        a => a.action === action.action && a.object === action.object
      )

      if (!matching) {
        throw new SuggestionError(
          'Action not found',
          actions.result
            .filter(a => a.object === 'actions')
            .map(a => ({ command: a.command, params: a.params }))
        )
      } else {
        const result = await matching.run(action.params)
        this.actionLog.push({ ...result, action: cleanupcode })
      }
    } catch (e) {
      this.failures++
      if (this.failures > 3) {
        process.exit(1)
      } else {
        this.actionLog.push({
          action: cleanupcode,
          success: false,
          result: e.message,
          suggested: e instanceof SuggestionError ? e.suggested : [],
        })
      }
      console.error(e)
    }

    await this.next()
    // Extract object, method and parameters
    // const { object, method, parameters } = parseCode(cleanupcode)
  }
}

// Example usage

const aiTask = new AITask({
  mainTask: 'Write a react component that displays some lorem ipsum text',
})

aiTask.next()
