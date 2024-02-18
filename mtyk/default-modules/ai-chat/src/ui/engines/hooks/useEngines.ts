import { useMemo } from "react"
export default function useEngines() {
	return useMemo(
		() => [
			"gpt-3.5-turbo",
			"gpt-3.5-turbo-16k",
			"gpt-4",
			"gpt-4-0314",
			// "claude-v1",
			// "claude-v1-100k",
			// "claude-instant-v1",
			// "claude-instant-v1-100k",
			"claude-instant-1.1",
			"claude-2",
		],
		[],
	)
}
