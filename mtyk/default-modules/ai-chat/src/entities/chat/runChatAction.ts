import { depFn } from "modules/deps/index"
import { keyDep } from "modules/deps/tokenDep"
import { Action } from "../../actions/Action"
import { ChatEntity } from "../ChatEntity"
import { ActionRunTask } from "../TaskEntity"

export default depFn(
	{
		action: keyDep<Action>("action"),
	},
	async function (this: ChatEntity, { action }) {
		const { manager } = this

		const task = await manager.create(ActionRunTask, {
			name: action.type,
		})

		this.update((d) => {
			d.connections = [
				...(d.connections ?? []),
				{
					type: "action",
					task: task.id,
					data: { action },
				},
			]
		})

		return task.runAction({ data: { action } })
	},
)
