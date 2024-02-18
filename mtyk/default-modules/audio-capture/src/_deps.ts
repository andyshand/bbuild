import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'audio-capture'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

