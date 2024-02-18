import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'yml'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

