import { depFn, keyDep } from "modules/deps"
import { Deps } from "../../Deps"
import { CodeBlock } from "../../formattings/codeblock"
import { ParseMessage } from "../../formattings/parseMessage"
import { Action, FileTree } from "../Action"
import { extractSame } from "../extractSame"
import { trimCode } from "../trimCode"

export default depFn(
	{
		action: keyDep<Action>("action"),
		fs: keyDep<typeof import("fs")>("fs"),
		path: keyDep<typeof import("path")>("path"),
		fse: keyDep<typeof import("fs-extra")>("fs-extra"),
		getChatCompletion: Deps.getChatCompletion,
	},
	async ({ action, path, getChatCompletion, fs, fse }) => {
		try {
			if (action.type === "create-file") {
				let { location, contents } = action
				if (typeof contents !== "string") {
					throw new Error(`Cannot write file because contents is not a string`)
				}
				fse.ensureDirSync(path.dirname(location.path))

				if ("path" in location && typeof contents === "string") {
					fs.writeFileSync(location.path, contents as string)
				}
			} else if (action.type === "create-files") {
				/**
				 * Recursively creates files and directories based on the given FileTree object.
				 * @param fileTree - The FileTree object representing the file system structure.
				 * @param rootPath - The root path to descend from.
				 */
				const createFilesFromTree = async (fileTree: FileTree, rootPath: string): Promise<void> => {
					await fse.ensureDir(rootPath)

					for (const [key, value] of Object.entries(fileTree)) {
						const fullPath = `${rootPath}/${key}`

						if (value === null) {
							await fse.createFile(fullPath)
						} else {
							await createFilesFromTree(value, fullPath)
						}
					}
				}
				const a = action.location?.path
				if (!a) {
					throw new Error(`Cannot create files because path is not a string`)
				}

				await createFilesFromTree(action.tree, a)
			} else if (action.type === "edit-file") {
				let { location, contents } = action
				if (typeof contents !== "string") {
					throw new Error(`Cannot write file because contents is not a string`)
				}

				if ("path" in location && typeof contents === "string") {
					const currFile = fs.readFileSync(location.path, "utf8")

					if (!currFile) {
						fs.writeFileSync(location.path, contents as string)
					} else {
						const { start: same, a, b, end } = extractSame(currFile, contents)

						// Ask GPT to integrate the changes since the edit may have some omitted content
						const prompt = `You are an intelligent code merging machine. Given two code blocks, 1. the original file and 2. a new file, merge in the new changes and return the final merged file. 
          
          Current file:
          ${CodeBlock.ts(trimCode(a))}

          New file:
          ${CodeBlock.ts(trimCode(b))}
          
Please respond with a markdown code block containing the merged file. 
Any additional explanation will result in your termination.`
						const completion = await getChatCompletion(prompt, {
							model: "gpt-3.5-turbo" as any,
						})

						const parsed = ParseMessage.code(completion)
						fs.writeFileSync(location.path, same + parsed + end)
					}
				}
			} else if (action.type === "install-package") {
			} else if (action.type === "uninstall-package") {
			}
		} catch (e) {
			console.error(`Error running action:`, e)
			throw e
		}
	},
)
