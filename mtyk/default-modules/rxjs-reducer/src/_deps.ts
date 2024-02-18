import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'rxjs-reducer'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

