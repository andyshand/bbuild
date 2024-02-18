import { globalDepContext } from 'modules/deps/createDepContext'
import dep from './_deps'
import * as mod from './index'

globalDepContext.add({
  token: dep.token,
  value: mod,
})
