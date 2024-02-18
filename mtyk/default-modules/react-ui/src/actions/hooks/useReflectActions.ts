import { globalDepContext } from "modules/deps"
import { useQuery } from "react-query"
import { apiUrlDep } from "../config/deps"

export default function useReflectActions() {
	return useQuery(["reflect-actions"], async () => {
		const { apiUrl } = globalDepContext.provideDepsSync({ apiUrl: apiUrlDep })
		const res = await fetch(`${apiUrl}/reflect`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		})
		return res.json()
	})
}
