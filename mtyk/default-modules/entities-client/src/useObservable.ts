import { useEffect, useState } from "react"
import { Observable } from "rxjs"

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
