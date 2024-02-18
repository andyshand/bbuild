import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'native-dependency-example'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

