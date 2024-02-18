import { ActionT } from "./ActionT"

// import { message } from "./message"
import { fsOpts } from "./fsOpts"

const memoryJSON: { [key: string]: string } = {}

const tagsOverlap = (a: string[], b: string[]) => {
	if (!a || !b) return false
	return a.some((aa) => b.some((bb) => aa === bb))
}

export const findAction = async (params: { query?: string }) => {
	const { query: _query } = params
	const query = _query?.toLowerCase()
	const objs = availableActions.filter(
		(a) =>
			!query || a.object.toLowerCase().includes(query) || a.actions.find((ac) => ac.name.toLowerCase().includes(query)),
		// a.actions.find(ac => tagsOverlap(ac.tags, query.split(' ')))
	)
	const matching = objs.flatMap((o) => {
		return o.actions.map((ac) => {
			return {
				command: `${o.object}.${ac.name}`,
				object: o.object,
				action: ac.name,
				params: ac.params,
				run: ac.run,
			}
		})
	})
	return {
		success: true,
		result: matching,
	}
}

const makeAction = (name: string, params: any[], run: any) => ({
	name,
	params,
	run,
})
const makeParam = (name: string, type: string) => ({ name, type })

export const availableActions: ActionT[] = [
	// message,
	fsOpts as ActionT,
	{
		object: "memory",
		actions: [
			makeAction(
				"save",
				[makeParam("key", "string"), makeParam("value", "string")],
				async (params: { key: string; value: string }) => {
					const { key, value } = params
					memoryJSON[key] = value
					return {
						success: true,
						result: "Saved",
					}
				},
			),
			makeAction("load", [makeParam("key", "string")], async (params: { key: string }) => {
				const { key } = params
				return {
					success: true,
					result: memoryJSON[key] ?? "",
				}
			}),
		],
	},
	{
		object: "git",
		actions: [
			{
				name: "log",
				params: [
					{
						name: "since",
						type: "string",
					},
				],
				run: async (params: { path: string }) => {
					return {
						success: true,
						result: "No files changed",
					}
				},
			},
		],
	},
	{
		object: "actions",
		actions: [
			{
				name: "search",
				params: [
					{
						name: "query",
						type: "string",
					},
				],
				run: findAction,
			},
		],
	},
]
