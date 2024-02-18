import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'code'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

