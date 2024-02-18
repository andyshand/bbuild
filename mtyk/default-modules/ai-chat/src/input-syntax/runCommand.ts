

import { ChatEntity } from "../entities/ChatEntity";
import getCommandPreview from './getCommandPreview';
import { getCompletionWithFormat } from './getCompletionWithFormat';

export default async function runCommand(chat: ChatEntity, action: {
  command: string,
  args: any[]
  format?: string
}) {
  const { command, args, format } = action;

  if (command === 'glob') {
    const [pattern] = args;
    const { results } = await getCommandPreview(chat, action)

    // chat.update(c => {
    //   c.messages.push(createEnhancedMessage({
    //     role: "assistant" as const,
    //     content: `Glob ${pattern} result: ${results.join(',')}`,
    //     commands: [
    //       { ...action, result: results },
    //     ]
    //   }))
    // })

    return { results }

  } else if (command === 'subthreads') {

    const [subCommand, ...subArgs] = args;
    let newMessages = chat.messages.slice()
    if (subCommand === 'slice') {
      const [start, end] = subArgs;
      for (const subthread of chat.threads) {
        // Get sliced messages from subthread
        const subthreadChat = await chat.manager.read('ChatEntity', subthread);
        const slice = subthreadChat.messages.slice(start, end);

        newMessages.push(...slice)
      }
      chat.update({ messages: newMessages })
    }
  } else if (command === 'tail') {

    // Slice n off of the end of the messages
    chat.update({ messages: chat.messages.slice(0, -args[0]) })
  } else if (command === 'createTask') {

    const [json] = args;

    console.log({ json })

  } else if (command === 'gpt') {
    return getCompletionWithFormat(args, format, 'gpt-3.5-turbo-16k');
  } else if (command === 'instant') {
    return getCompletionWithFormat(args, format, 'claude-instant-1.1');
  } else if (command === 'claude') {
    return getCompletionWithFormat(args, format, 'claude-2');
  }
}
