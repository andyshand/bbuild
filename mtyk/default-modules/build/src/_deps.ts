import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'build'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

