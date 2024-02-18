import { cloneDeep } from "lodash"
import { assert, publicInvariant } from "modules/errors/index"
import findAttachment from "../attachments/findChatAttachment"
import { createAttachmentExecutionContext } from "../attachments/recomputeDirtyAttachments"
import { ChatEntity } from "../entities/ChatEntity"
import { Knowledge } from "../entities/Knowledge"
import findFilesInProject from "../project/util/findFilesInProject"
import fnRunner from "./fnRunner"
import parseCommand from "./parseCommand"
import runCommand from "./runCommand"

export async function parseInputSyntax(chat: ChatEntity, msg: string) {
	if (msg.startsWith('\\')) {
		// Command, split by spaces
		const ctx = { ...createAttachmentExecutionContext(), attachments: cloneDeep(chat.attachments.slice()) }
		const parsed = await parseCommand(msg, ctx)
		return { type: 'command', ...parsed }
	}

	const newItFormatRegex = /\[\[([\$a-zA-Z0-9]+)\]\]/g
	const newItFormatMatch = newItFormatRegex.exec(msg)

	if (newItFormatMatch) {
		const [_, itName] = newItFormatMatch

		const variable = itName.startsWith("$") ? itName.slice(1) : itName
		const attach = findAttachment(chat.attachments, variable)
		if (!attach) {
			throw new Error(`Could not find attachment ${variable}`)
		}

		const value = attach.value

		if (!value) {
			throw new Error(`Attachment ${variable} has no value`)
		}

		const { results } = value
		for (const result of results) {
			let injected = ``
			let name = ``

			if (result.type === 'file-path-group' || result.type === 'file-group') {
				publicInvariant(!!chat.category, "Chat must have a category to use glob command")

				// Get content for associated files
				const paths = result.files.map((f) => f.path)
				for (const p of paths) {
					const [file] = await findFilesInProject({ file: p, project: chat.category })
					if (file) {
						injected += `\n${file.path}\n\`\`\`\n${file.content}\n\`\`\``
						name += `${file.path.split("/").pop()}, `
					}
				}
			}

			const messageForThread = msg.replaceAll(newItFormatRegex, injected)
			chat.spawnThread(null, { sendMessage: messageForThread, name })
		}
		return { type: 'asdkjasdhkas' }
	}

	// Special message, iterating over files
	// iterator format - {{ for [file] in [filename:path_to_array] }} or {{ for [file] in [comma, separated, values] }}
	const iteratorRegex = /\{\{ for ([a-zA-Z0-9]+) in ([^}]+)\}\}/g
	const iteratorMatch = iteratorRegex.exec(msg)

	if (iteratorMatch) {
		const [_, iteratorName, _filename] = iteratorMatch
		const isCommaSeparated = _filename.includes(",")
		const isGlob = _filename.startsWith("glob:")

		if (isGlob) {
			const glob = _filename.slice(5)
			return { type: "spawnThreadsFromGlob", iteratorRegex, glob, message: msg, iteratorName }
		}

		if (isCommaSeparated) {
			const lines = _filename
				.trim()
				.split(",")
				.map((s) => s.trim())
			return { type: "spawnThreads", iteratorRegex, lines, message: msg, iteratorName }
		}

		const [filename, path] = _filename.trim().split(":")
		return { type: "spawnThreadsFromFile", iteratorRegex, filename, path, message: msg, iteratorName }
	}

	// Send message to all existing threads
	// syntax - {{ sendToAllThreads [message] }}
	const sendToAllThreadsRegex = /\{\{ sendToAllThreads (.+)\}\}/g
	const sendToAllThreadsMatch = sendToAllThreadsRegex.exec(msg)

	if (sendToAllThreadsMatch) {
		const [_, message] = sendToAllThreadsMatch
		return { type: "sendToAllThreads", message }
	}

	return null
}

export async function executeAction(chat: ChatEntity, action: any) {
	switch (action.type) {
		case "spawnThreads":
			let arr: string[] = []
			for (const line of action.lines) {
				if (line.startsWith("@")) {
					const category = chat.category
					assert(!!category, "Category is not defined")

					// fetch file contents
					const query = line.slice(1)
					const k = await chat.manager.find("Knowledge", {
						about: {
							$regex: query ? `.* ${query}.tsx ? ` : "haksjdhakdshajskdhaksjdhkasjdh",
							$options: "i",
						},
						category: {
							$in:
								category === "chatbot"
									? [category, "modules/entities", "modules/entities-client", "modules/ai-chat"]
									: category === "build"
										? [
											category,
											"modules/build",
											"modules/entities",
											"modules/entities-client",
											"modules/rpc-ws",
											"modules/react-ui",
											"modules/react-ui-dev",
										]
										: [category, `modules / ${category === "dc" ? "design-cloud" : category} `],
						},
					})
					if (k.length) {
						const file = k[0] as Knowledge
						const { content, location } = file.representations.find((r) => r.type === "file")!
						const fileName = location.path.split("/").pop()
						arr.push(`\n${fileName} \n\`\`\`\n${content}\`\`\``)
					}
				} else {
					arr.push(line)
				}
			}

			return arr.map((item: any, index) => {
				const newMessage = action.message.replaceAll(action.iteratorRegex, item)
				return chat.spawnThread(undefined as any, {
					sendMessage: newMessage,
					name: action.lines[index],
				})
			})

		case "spawnThreadsFromGlob":
			const glob = action.glob
			const globRegex = new RegExp(glob)
			const files = await chat.manager.find("Knowledge", {
				about: {
					$regex: globRegex,
					$options: "i",
				},
			})
			return files.map((file: any) => {
				const { content, location } = file.representations.find((r: any) => r.type === "file")!
				const fileName = location.path.split("/").pop()
				const newMessage = action.message.replaceAll(action.iteratorRegex, fileName)
				return chat.spawnThread(undefined as any, {
					sendMessage: newMessage,
					name: fileName,
				})
			})

		case "sendToAllThreads":
			chat.threads.forEach(async (thread) => {
				const threadObj = await chat.manager.read(ChatEntity, thread)
				if (threadObj) {
					threadObj.sendMessage({ message: action.message })
				}
			})
			break

		case "command":
			runCommand(chat, action)
			break

		default:
			console.error(`Unknown action type: ${action.type}`)
	}
}

export default async function inputSyntax(chat: ChatEntity, msg: string, parsed = false) {
	const action = await parseInputSyntax(chat, msg)
	if (action) {
		executeAction(chat, action)
		return true
	} else if (!parsed && false) {
		// run through fn Runner
		const fnResult = await fnRunner(chat, msg)
		if (fnResult.results.length) {
			// now we include the results in the message
			const resultsStringified = fnResult.results
				.filter((r) => !r.silent)
				.map((r) => `${r.name}: ${JSON.stringify(r.result)}`)
				.join("\n")
			const additionalStr = `Function results:\n ${resultsStringified.slice(0, 1000)}`
			chat.sendMessage({ message: `${msg}\n\n${additionalStr}`, parsed: fnResult })
			return true
		}
	}

	return undefined
}
