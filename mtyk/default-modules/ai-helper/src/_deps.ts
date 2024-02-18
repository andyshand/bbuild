import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'ai-helper'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

