import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'react-ui'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

