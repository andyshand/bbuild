import { globalDepContext, keyDep } from 'modules/deps'
  
const tokenName = 'modules' + '/' + 'machine2-react'
const moduleDep = keyDep<typeof import('./index')>(tokenName)

export default moduleDep

