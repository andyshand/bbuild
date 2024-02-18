import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'async'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

