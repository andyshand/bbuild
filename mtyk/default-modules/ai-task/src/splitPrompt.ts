import { PromptObj } from './PromptObj'
import { splitSequence } from './splitSequence'

export function splitPrompt(prompt: string): (PromptObj | string)[] {
  const sections = prompt.split(splitSequence)
  const parsed = sections.map(section => {
    try {
      return JSON.parse(section)
    } catch (e) {
      return section
    }
  })
  return parsed
}
