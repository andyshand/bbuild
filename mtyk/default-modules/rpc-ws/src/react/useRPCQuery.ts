import { useEffect, useMemo, useState } from "react"
import { useQuery } from "react-query"
import { Observable, lastValueFrom } from "rxjs"
import RPCClient from "../client"

export default function useRPCQuery(opts: { method: string; params: any; initialValue?: any }, deps: string[] = []) {
	const client = RPCClient.getSingleton()
	return useQuery(
		["rpc", JSON.stringify(opts), ...deps],
		async () => {
			const res = await client.callFunction(opts.method, opts.params)
			return lastValueFrom(res)
		},
		{
			initialData: opts.initialValue,
		},
	)
}

export function useObservable<T>(observable$: Observable<T>, initialValue: T): T {
	const [value, setValue] = useState<T>(initialValue)
	const [_otherTrigger, setOtherTrigger] = useState({})

	useEffect(() => {
		const subscription = observable$.subscribe((val) => {
			setValue(val)
			// Because occasionally the obesrvable will retirgger with the same identity value
			// (e.g the same instance of an entity) we need to trigger a re-render by changing
			// the state of a different variable.
			setOtherTrigger({})
		})
		return () => {
			subscription.unsubscribe()
		}
	}, [observable$])

	return value
}

export function useObservableRPCQuery(
	opts: { method: string; params: any; initialValue: any },
	deps: string[] = [],
): Observable<any> {
	const client = RPCClient.getSingleton()

	const observable$ = useMemo(
		() =>
			new Observable((subscriber) => {
				const subscription = client.callFunction(opts.method, opts.params).subscribe(subscriber)
				return () => subscription.unsubscribe()
			}),
		[opts.method, opts.params, ...deps],
	)

	return useObservable(observable$, opts.initialValue)
}
