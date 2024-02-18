import { globalDepContext } from "modules/deps"
import { useCallback } from "react"
import { useQueryClient } from "react-query"
import useFetch from "./useFetch"
import { apiUrlDep } from "../config/deps"
import { Action, GetActionParams, GetActionReturn } from "../config/types"

export default function useAction<T extends Action>(action: T) {
	const fetch = useFetch()
	return [
		async (params: GetActionParams<T>): Promise<GetActionReturn<T>> => {
			return runAction(fetch, action, params)
		},
	] as const
}

export function useActions() {
	const fetch = useFetch()
	const queryClient = useQueryClient()
	// const history = useLocalQuery('actionHistory')

	const cb = useCallback(
		<T extends Action>(action: T) => {
			return async (params: GetActionParams<T>): Promise<GetActionReturn<T>> => {
				return runAction(fetch, action, params)
			}
		},
		[fetch],
	)

	const invalidate = useCallback(
		(actions: Action[]) => {
			actions.forEach((action) => {
				queryClient.invalidateQueries([action])
			})
		},
		[queryClient],
	)

	return [cb, { invalidate }] as const
}

async function runAction(fetch, action: Action, params: any) {
	// if (action in clientActions) {
	// Local action, just run it
	// return clientActions[action](params)
	// }

	const { apiUrl } = globalDepContext.provideDepsSync({ apiUrl: apiUrlDep })
	const res = await fetch(`${apiUrl}/mutation`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			action,
			opts: params,
		}),
	})

	if (res.status !== 200) {
		const text = await res.text()
		// mainKVStore.update('actionHistory', [], (history) =>
		//   history.concat({ action, params, error: text, createdAt: Date.now() })
		// )
		throw new Error(text)
	} else {
		const json = await res.json()
		// mainKVStore.update('actionHistory', [], (history) =>
		//   history.concat({ action, params, data: json, createdAt: Date.now() })
		// )
		return json
	}
}
