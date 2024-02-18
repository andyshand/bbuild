import { globalDepContext } from 'modules/deps'
import { Action } from '../Action'
import runAction from '../runner/runAction'
import { actionRunnerDep } from './deps'

export default function () {
  globalDepContext.add2(actionRunnerDep, {
    runAction: async (action: Action) => {
      return runAction({ action })
    },
  })
}
