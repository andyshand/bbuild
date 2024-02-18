import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'llm'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

