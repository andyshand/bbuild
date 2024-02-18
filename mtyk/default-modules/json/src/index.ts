import {
  parse as commentJsonParse,
  stringify as commentJsonStringify,
} from 'comment-json'
import { makeFilterParsers } from 'modules/file-parse'

export const {
  read: readJson,
  write: writeJson,
  edit: editJson,
} = makeFilterParsers({
  read: (fileContents: string) => {
    return commentJsonParse(fileContents)
  },
  write: (obj: any) => commentJsonStringify(obj, null, 2),
})

export { parse, stringify } from './parse'
