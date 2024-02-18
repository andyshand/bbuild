import { depFn, keyDep } from "modules/deps"
import { Entity, EntityField } from "modules/entities"
import { Action } from "../actions/Action"
import { actionRunnerDep } from "../actions/config/deps"

// Can be extended for different types of tasks
export abstract class TaskEntity<Parameters = any> extends Entity {
	@EntityField({ defaultValue: "New Task" })
	name: string

	@EntityField({ defaultValue: [] })
	log: {
		step: string
		status: string
		started?: Date
		result?: any
		error?: {
			message: string
			stack?: string
		}
		id: string
		completed?: Date
		runner?: {
			id: string
		}
	}[]

	isQueued() {
		return this.log.length === 0
	}

	isRunning() {
		return this.log.some((l) => l.status === "started" && !l.completed)
	}

	@EntityField()
	data: Parameters

	reset() {
		this.update((d) => {
			d.log = []
		})
	}

	abstract start(): Promise<void>
}

export class ActionRunTask extends TaskEntity<{
	action: Action
}> {
	// Runs an action

	runAction = depFn(
		{
			data: keyDep<ActionRunTask["data"]>(),
			actionRunner: actionRunnerDep,
		},
		async ({ data, actionRunner }) => {
			const { action } = data

			const logEntry = {
				step: "runAction",
				id: Math.random().toString(36).slice(2),
				status: "started",
				started: new Date(),
			}
			this.update((d) => {
				d.log = [...(d.log ?? []), logEntry]
			})

			try {
				// It makes sense to still use chats in some sense because they represent timelines of things happening over time
				const result = await actionRunner.runAction({ action })
				this.update((d) => {
					const entry = d.log.find((l) => l.id === logEntry.id)
					if (entry) {
						Object.assign(entry, {
							status: "completed",
							completed: new Date(),
							result,
						})
					}
				})
				return result
			} catch (e) {
				console.error(e)
				this.update((d) => {
					const entry = d.log.find((l) => l.id === logEntry.id)
					if (entry) {
						Object.assign(entry, {
							status: "error",
							error: {
								message: e.message,
								stack: e.stack,
							},
						})
					}
				})
			}
		},
	)

	async start() {
		await this.runAction({
			data: this.data,
		})
	}
}
