import { depFn, keyDep } from "modules/deps/index"
import { addWSFunction } from "modules/rpc-ws/server"
import { uniq, uniqBy } from "remeda"
import { Deps } from "../Deps"
import { Attachment } from "../attachments/Attachment"
import { ChatEntity } from "../entities/ChatEntity"
import extractFiles from "../formattings/extractFiles"
import getCommandPreview from "../input-syntax/getCommandPreview"
import { parseInputSyntax } from "../input-syntax/parse"
import fileInfo from "../project/util/fileInfo"
import findFilesInProject from "../project/util/findFilesInProject"
import permutations from "../project/util/permutations"

const getMessageSuggestions = depFn(
  {
    message: keyDep<string>(),
    project: keyDep<string>(),
    chat: keyDep<ChatEntity>(),
    getChatCompletion: Deps.getChatCompletion,
    entityManager: Deps.entityManagerDep
  },
  async function getMessageSuggestions({ project, message, getChatCompletion, chat, entityManager }) {

    if (message.startsWith('\\')) {
      // It's a command, get preview
      try {
        const parsed = await parseInputSyntax(chat, message)
        if (typeof parsed === 'object' && !!parsed && 'command' in parsed && parsed.command) {
          return { commandPreview: { ...(await getCommandPreview(chat, parsed as any)), command: parsed } }
        }
      } catch (e) {
        console.error(e)
      }
    }

    const words = message.trim().split(" ")


    if (words.length < 5) {
      return []
    }
    const prompt = `You are a named entity extractor, geared specifically for software development. You will usually focus on named entities that might refer to files. Please extract all named entities from the following message:\n\n"${message}"\n\nMake sure you respond only with a single comma-separated list of named entities, with no additional explanation:\n\n`
    const result = await getChatCompletion(prompt, { model: 'gpt-3.5-turbo' })
    const entities = result.split(",").map(s => s.trim()).filter(Boolean)
    const perms = uniq(entities.flatMap(s => permutations(s))) as string[]

    let suggestions: Attachment[] = []

    for (const permutation of perms) {
      const files = await findFilesInProject({ file: permutation, project })
      for (const file of files) {
        const info = await fileInfo(file.path)
        suggestions.push({
          id: file.path,
          label: file.path.split("/").slice(-1)[0],
          type: 'file',
          data: {
            content: file.content,
            ...info
          }
        })
      }
    }

    const threads = await entityManager.find('ChatEntity', { _id: { $in: chat.threads ?? [] } })
    const filesInChat = extractFiles.call(chat, threads)

    for (const file in filesInChat) {
      if (perms.some(p => file.includes(p))) {
        const versions = filesInChat[file]
        const latest = versions[versions.length - 1]
        const [realFile] = await findFilesInProject({ file, project })
        const info = realFile.path ? await fileInfo(realFile.path) : {}
        suggestions.push({
          id: realFile?.path ?? file,
          type: 'chat-file',
          label: realFile?.path ? realFile.path.split("/").slice(-1)[0] : file,
          data: {
            content: latest.content,
            path: realFile?.path ?? file,
            chatId: chat.id,
            ...info
          }
        })
      }
    }

    return { suggestions: uniqBy(suggestions, s => s.id), entities }
  },
)

export default addWSFunction(getMessageSuggestions)