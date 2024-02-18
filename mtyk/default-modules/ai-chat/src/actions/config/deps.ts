import { keyDep } from "modules/deps"
import { Action } from "../Action"

export const actionRunnerDep = keyDep<{
	runAction({ action }: { action: Action }): Promise<any>
}>("actionRunner")
