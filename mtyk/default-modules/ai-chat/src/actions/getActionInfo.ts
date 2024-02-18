import { depFn, keyDep } from 'modules/deps'

import { Deps, resolveEngine } from '../Deps'
import { EnhancedMessage } from '../EnhancedMessage'
import { Action } from './Action'
import { CodeBlock } from '../formattings/codeblock'
import { ParseMessage } from '../formattings/parseMessage'
import { trimCode } from './trimCode'
import { extractSame } from './extractSame'

export default depFn(
  {
    action: keyDep<Action>('action'),
    // Specific args for action
    args: keyDep<{
      autoMerge?: boolean
    }>('args'),
    message: keyDep<EnhancedMessage>('message'),
    fs: keyDep<typeof import('fs')>('fs'),
    getChatCompletion: Deps.getChatCompletion,
  },
  async ({ action, args, getChatCompletion, message, fs }) => {
    const { autoMerge } = args

    if (action.type === 'create-file' && !autoMerge) {
      let { location, contents } = action
      if (typeof contents === 'number') {
        contents = message.codeBlocks?.[contents]?.content ?? ''
      }
      if (typeof contents !== 'string') {
        return {
          error: `Cannot write file because contents is not a string`,
        }
      }

      if ('path' in location && typeof contents === 'string') {
        return {
          path: location.path,
          contents,
        }
      }
    } else if (action.type === 'edit-file') {
      let { location, contents } = action
      if (typeof contents === 'number') {
        contents = message.codeBlocks?.[contents]?.content ?? ''
      }
      if (typeof contents !== 'string') {
        return {
          error: `Cannot write file because contents is not a string`,
        }
      }

      if ('path' in location && typeof contents === 'string') {
        const currFile = fs.readFileSync(location.path, 'utf8')

        if (!currFile) {
          return {
            path: location.path,
            contents,
          }
        } else {
          if (autoMerge) {
            // Ask GPT to integrate the changes since the edit may have some omitted content
            const { start: same, a, b, end } = extractSame(currFile, contents)
            const prompt = `You are an intelligent code merging machine. Given two code blocks, 1. the original file and 2. a new file, merge in the new changes and return the final merged file.

Original file:
${CodeBlock.ts(trimCode(a))}

New file:
${CodeBlock.ts(trimCode(b))}

Please respond with a markdown code block containing the merged file (formatted). Any additional explanation will result in your termination.`
            const completion = await getChatCompletion(
              prompt,
              {
                model: 'gpt-3.5-turbo',
              }
            )

            const parsed = ParseMessage.code(completion)
            return {
              path: location.path,
              newFile: same + parsed + end,
              oldFile: currFile,
            }
          }

          return {
            path: location.path,
            newFile: contents,
            oldFile: currFile,
            // newFile: contents
          }
        }
      }
    } else if (action.type === 'install-package') {
      return {}
    } else if (action.type === 'uninstall-package') {
      return {}
    }
    return {
      error: `Cannot get action info for action ${action.type}`,
    }
  }
)
