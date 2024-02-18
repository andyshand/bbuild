import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'log'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

