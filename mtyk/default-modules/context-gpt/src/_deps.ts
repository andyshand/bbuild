import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'context-gpt'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

