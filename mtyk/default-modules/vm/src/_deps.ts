import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'vm'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

