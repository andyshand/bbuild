import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'files-client'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

