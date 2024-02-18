import { ITokenizedMessage } from './ITokenizedMessage'
import { createContextItem } from './UniverseEntityContextItem'

export default function parseContext(_str?: string): ITokenizedMessage {
  const str = _str || ''
  // Find all strings starting with @symbol
  const matches = str.matchAll(/@([a-zA-Z0-9_-]+)/g)

  // Create an array of all the matches
  const matchesArray = Array.from(matches)

  // Create the ITokenizedMessage object
  const tokenizedMessage: ITokenizedMessage = {
    content: str,
    attachments: matchesArray.map((match) => ({
      item: createContextItem({
        type: 'unlinked',
        id: match[1],
      }),
      range: {
        /*
         * If the `index` property of the match object is undefined, ensure that you are using the `g` (global) flag in your regular expression pattern.
         * Without the `g` flag, `matchAll()` only returns the first match as a single result, lacking the index property.
         */
        start: match.index!,
        end: match.index! + match[0].length,
      },
    })),
  }

  // return the ITokenizedMessage object
  return tokenizedMessage
}
