import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'file-parse'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

