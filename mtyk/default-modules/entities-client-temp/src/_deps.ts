import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'entities-client-temp'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

