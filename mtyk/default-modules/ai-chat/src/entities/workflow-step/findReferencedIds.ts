import { depFn, keyDep, typeDep } from 'modules/deps/index'
import { Deps } from '../../Deps'
import { Workflow } from './ChatWorkflowEntity'

export default depFn(
  {
    entityMan: Deps.entityManagerDep,
    prompt: typeDep(String),
    workflow: keyDep<Workflow>(),
  },
  async function findReferencedIds(opts) {
    const { prompt, entityMan, workflow } = opts
    const ids = new Set<string>()

    // Search for references starting with @ symbol, following by any non-whitespace char
    const regex = /@(\S+)/g
    // Get all
    const matches = prompt.matchAll(regex)

    // For each, find the id
    for (const match of matches) {
      const id = match[1]
      ids.add(id)
    }
  }
)
