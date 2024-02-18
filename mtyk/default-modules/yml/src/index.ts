import { makeFilterParsers } from 'modules/file-parse'
import yaml from 'yaml'

export const {
  read: readYaml,
  write: writeYaml,
  edit: editYaml,
  readSync: readYamlSync,
} = makeFilterParsers({
  read: (fileContents: string) => yaml.parse(fileContents),
  write: (obj: any) => yaml.stringify(obj),
})
