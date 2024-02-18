import { depFn } from "modules/deps/index"
import { ChatEntity } from "../ChatEntity"
import { ChatCreationConnection } from "../ChatConnection"

export default depFn({}, async function getChatEnhancedFiles(this: ChatEntity, { }) {
	const fileMessages = this.messages.reduce((acc, msg) => {
		if (msg.role === "assistant" && msg.codeBlocks) {
			return [...acc, msg.codeBlocks.filter((c) => c.fileName).map((block) => ({ ...block, message: msg }))]
		} else if (msg.role === "user" && msg.json) {

		}
		return acc
	}, [])

	const fileVersions: { [filename: string]: any[] } = {}

	fileMessages.forEach((fileMessage) => {
		fileMessage.forEach((file) => {
			if (file.fileName) {
				if (!fileVersions[file.fileName]) {
					fileVersions[file.fileName] = []
				}
				fileVersions[file.fileName].push({
					content: file.content,
					message: file.message,
				})
			}
		})
	})

	// Add files from ChatCreationConnection
	this.connections
		.filter((connection): connection is ChatCreationConnection => connection.type === "creation")
		.forEach((connection) => {
			const { data } = connection
			if (data.type === "code" || data.type === "text") {
				if (!fileVersions[data.chat]) {
					fileVersions[data.chat] = []
				}

				data.history?.forEach((history) => {
					fileVersions[data.chat].push({
						content: history.contents,
						message: history.message,
					})
				})

				// Merge files with matching filenames
				if (fileVersions[data.chat].length > 0) {
					fileVersions[data.chat].sort(
						(a, b) => a.message.index - b.message.index || a.message.timestamp - b.message.timestamp,
					)
				}
			}
		})

	return fileVersions
})
