import { useRef } from "react"
import { useQuery } from "react-query"
import { Action, GetActionParams, GetActionReturn } from "../config/types"
import { useActions } from "./useAction"

type MaybeAwaited<T> = T extends Promise<infer U> ? U : T

export default function useActionQuery<T extends Action, D = MaybeAwaited<GetActionReturn<T>>>(
	action: T,
	params: GetActionParams<T>,
	opts?: { skip?: boolean; defaultValue?: D; refetchOnMount?: boolean },
) {
	const [actions] = useActions()
	const deff = useRef(opts?.defaultValue)
	// const user = useUser()
	return useQuery(
		[action, JSON.stringify(params)],
		() => {
			return actions(action)(params) as MaybeAwaited<GetActionReturn<T>>
		},
		{
			enabled: !opts?.skip,
			refetchOnMount: opts?.refetchOnMount ?? false,
			initialData: deff.current as MaybeAwaited<GetActionReturn<T>>,
		},
	)
}

export function useActionArrayQuery<T extends Action>(
	action: T,
	params: GetActionParams<T>,
	opts: { skip?: boolean } = {},
) {
	const emptyArray = useRef([])

	const ret = useActionQuery(action, params, opts)
	return {
		...ret,
		data: ret.data ?? (emptyArray.current as GetActionReturn<T>),
	}
}

export function useActionQueryPaginated<T extends Action>(
	action: T,
	params: GetActionParams<T>,
	opts: {
		skip?: boolean
		page?: number
		pageSize?: number
		sort?: string
		sortOrder?: "asc" | "desc"
	} = {},
) {
	const [actions] = useActions()
	const { page = 0 } = opts
	const pageSize = opts.pageSize ?? 10

	const pagination = {
		page,
		pageSize,
		sort: opts.sort,
		sortOrder: opts.sortOrder,
	}
	return useQuery(
		[action, JSON.stringify({ params, pagination }), page],
		() => {
			return actions(action)({
				...(params as any),
				pagination,
			}) as MaybeAwaited<GetActionReturn<T>>
		},
		{
			enabled: !opts.skip,
			keepPreviousData: true, // Set to true for pagination support
		},
	)
}
