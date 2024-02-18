import { useCallback } from "react"
export default function useFetch() {
	// const { getToken } = useAuth()
	const authenticatedFetch = useCallback(async (url: string, opts: RequestInit = {}) => {
		return fetch(url, {
			...opts,
			headers: {
				...opts.headers,
			},
		})
	}, [])
	return authenticatedFetch
}
