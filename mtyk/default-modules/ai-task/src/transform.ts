import { infoById } from './infoById'
import { PromptObj } from './PromptObj'
import { splitSequence } from './splitSequence'

const prompt = (obj: any) => {
  if (obj.id) {
    infoById[obj.id] = obj
  }
  return `${splitSequence}${JSON.stringify(obj)}${splitSequence}`
}

export const transformOut = {
  cleanCode: (str: string) => {
    // Remove trailing whitespace, markdown code blocks, and split sequence
    return str.replaceAll('```', '').trim()
  },
}

let nextId = 0
function id() {
  return ++nextId
}

export const promptGPT3 = (opts?: Partial<PromptObj>) => {
  return prompt({ type: 'gpt3', id: id(), ...opts })
}

export const qa = (question: string) => {
  return `Q: ${question}\nA:`
}
export const promptGPT3Curie = (opts?: Partial<PromptObj>) => {
  return prompt({
    type: 'gpt3',
    id: id(),
    gpt: {
      model: 'text-curie-001',
    },
    ...opts,
  })
}

export const getOutput = (key: string, opts?: Partial<PromptObj>) => {
  return prompt({
    type: 'get-output',
    id: id(),
    outputKey: key,
    ...opts,
  })
}

export const markdown = (str: string, language?: string) => {
  return `\`\`\`${language || ''}
${str}
\`\`\``
}
export const ts = (str: string) => markdown(str, 'typescript')
