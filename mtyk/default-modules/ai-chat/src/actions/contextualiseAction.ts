import { depFn, keyDep } from "modules/deps"
import { Deps } from "../Deps"
import { Action } from "./Action"

export default depFn(
	{
		action: keyDep<Action>("action"),
		context: keyDep<{
			projectPath: string
		}>("context"),
		getChatCompletion: Deps.getChatCompletion,
		getCompletion: Deps.getCompletion,
		tokenCounter: Deps.tokenCounter,
		fs: Deps.fs,
		glob: Deps.glob,
	},
	async ({ action, fs, glob, context, getChatCompletion }) => {
		// 		const enhancedContext = { ...context } as typeof context & {
		// 			potentialMatches?: string[]
		// 		}

		// 		if (action.type === "create-file" || action.type === "edit-file") {
		// 			let thePath = "path" in action.location ? action.location.path : null
		// 			// First, see if the file already exists in the project
		// 			if (thePath) {
		// 				const fileNameIsh = thePath.split("/").pop().replace(/\.[a-z]+$/, "")

		// 				if (fileNameIsh) {
		// 					const similar = glob.sync(`${context.projectPath}/**/*${fileNameIsh}*.{js,ts,jsx,tsx}`, {
		// 						// Case insensitive
		// 						nocase: true,

		// 						// Exclude node_modules
		// 						ignore: ["**/node_modules/**"],
		// 					})
		// 					if (similar) {
		// 						enhancedContext.potentialMatches = similar
		// 					}
		// 				}
		// 			} else if ("variable" in action.location) {
		// 				// Assume the file is named something similar for now??? hopefully
		// 				const similar = glob.sync(`${context.projectPath}/**/*${action.location.variable}*.{js,ts,jsx,tsx}`, {
		// 					// Case insensitive
		// 					nocase: true,

		// 					// Exclude node_modules
		// 					ignore: ["**/node_modules/**"],
		// 				})
		// 				if (similar) {
		// 					enhancedContext.potentialMatches = similar
		// 				}
		// 			}
		// 		}

		// 		const prompt = `You are an intelligent JSON contextualising machine.

		// The user has requested the following action: 
		// ${CodeBlock.json(action)}

		// Please replace any appropriate values in the action using any relevant information from the following context object:
		// ${CodeBlock.json(enhancedContext)}

		// - Less specific values should be replaced with more specific values if available.
		// - File paths may be inaccurate. If one of the similar matches looks correct, please replace the path with it.

		// The overall structure and type of the action's properties must remain the same.

		// Please respond with a markdown json block, nothing else will be accepted.`

		// 		const response = await getChatCompletion(prompt, {
		// 			model: "gpt-3.5-turbo" as any,
		// 		})

		// 		const enhanced = ParseMessage.json(response)
		// 		if (!enhanced) {
		// 			throw new Error("Could not parse response")
		// 		}

		// 		return enhanced
		return null as any
	},
)
