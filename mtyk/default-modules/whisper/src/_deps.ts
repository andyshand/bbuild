import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'whisper'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

