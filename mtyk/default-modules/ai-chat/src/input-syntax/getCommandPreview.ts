import { globalDepContext } from 'modules/deps/createDepContext';
import { keyDep } from 'modules/deps/tokenDep';
import { Deps } from '../Deps';
import { AIDataObject, createAIChatMessage, createAIFile } from '../attachments/AIDataType';
import { ChatEntity } from "../entities/ChatEntity";
import { getProjectDirs } from '../project/util/projectDirs';
import { invariant } from 'modules/errors/index';

export default async function getCommandPreview(chat: ChatEntity, action: {
  command: string,
  args: any[]
}): Promise<{ results?: AIDataObject[] }> {
  const { glob, getCompletion, path } = globalDepContext.provideSync({
    glob: keyDep('glob'),
    path: keyDep('path'),
    getCompletion: Deps.getCompletion
  })
  const { command, args } = action;

  if (command === 'glob') {
    const [pattern, ...rest] = args;
    invariant(!!chat.category, 'Chat must have a category to use glob command');
    const projectDirs = getProjectDirs(chat.category);

    const exclude = rest.includes('--exclude') ? rest[rest.indexOf('--exclude') + 1] : undefined;
    let results: string[] = [];
    for (const p of projectDirs) {
      const projectPath = path.join(p, pattern);
      const syncResult = glob.sync(projectPath, {
        // exclude node_modules, .map files, .d.ts
        ignore: ['**/node_modules/**', '**/*.map', '**/*.d.ts', exclude].filter(Boolean),

      });
      results.push(...syncResult);
    }

    return { results: results.map(path => createAIFile({ path })) }
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
      return { results: newMessages.map(m => createAIChatMessage(m as any)) }
    }
  } else if (command === 'tail') {

    // Slice n off of the end of the messages
    return { results: chat.messages.slice(0, -args[0]).map(m => createAIChatMessage(m as any)) }
  } else if (command === 'gpt') {
    try {
      const [prompt] = args

      const result = await getCompletion(prompt, { model: 'gpt-3.5-turbo', max_tokens: 50 }) // limit to 50 for preview
      return { results: [createAIChatMessage({ content: result, role: 'assistant' })] }
    } catch (e) {
      console.error(e)
      return { results: [] }
    }
  }
  return { results: [] }
}