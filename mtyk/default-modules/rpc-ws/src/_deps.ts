import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'rpc-ws'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

