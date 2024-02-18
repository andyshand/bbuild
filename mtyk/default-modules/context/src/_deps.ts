import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'context'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

