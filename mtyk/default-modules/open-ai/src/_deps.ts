import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'open-ai'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

