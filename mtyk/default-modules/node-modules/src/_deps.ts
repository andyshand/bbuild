import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'node-modules'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

