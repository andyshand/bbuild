import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'transport'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

