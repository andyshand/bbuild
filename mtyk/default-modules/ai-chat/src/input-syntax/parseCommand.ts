import findAttachment from "../attachments/findChatAttachment"
import { createAttachmentExecutionContext } from "../attachments/recomputeDirtyAttachments"

export default async function parseCommand(cmdString: string, ctx = createAttachmentExecutionContext()) {
  let [command, ...argsIn] = cmdString.slice(1).split(' ')
  let format: string | undefined

  if (command.includes(':')) {
    // it includes a format specifier, so we need to parse it out
    const [_command, _format] = command.split(':')
    command = _command
    format = _format
  }

  // For each arg, replace $1 variables with values from the chat attachments
  let argsOut: string[] = []

  for (const arg of argsIn) {
    if (arg.startsWith('$')) {
      const id = arg.slice(1)
      const attachment = findAttachment(ctx.attachments, id)
      if (attachment) {
        const val = attachment.value ?? arg
        argsOut.push(typeof val === 'string' ? val : JSON.stringify(val))
      } else {
        argsOut.push(arg)
      }
    } else {
      argsOut.push(arg)
    }
  }

  // Some commands treat all args as a single string
  if (command === 'gpt' || command === 'instant' || command === 'claude') {
    return {
      command,
      args: [argsOut.join(' ')],
      format
    }
  }

  return {
    args: argsOut,
    command,
    format,
  }
}