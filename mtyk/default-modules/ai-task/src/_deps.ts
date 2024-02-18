import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'ai-task'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

