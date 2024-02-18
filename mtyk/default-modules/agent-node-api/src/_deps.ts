import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'agent-node-api'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

