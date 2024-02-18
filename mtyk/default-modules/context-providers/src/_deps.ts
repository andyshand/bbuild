import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'context-providers'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

