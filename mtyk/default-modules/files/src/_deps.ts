import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'files'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

