import { ChatEntity } from "../ChatEntity"

const spawnThread = async function spawnThread(
	this: ChatEntity,
	initialMessageId: string | null,
	opts: {
		name?: string
		sendMessage?: string
	} = {},
) {
	// Find the initial message
	const initialMessage = initialMessageId
		? this.messages.findIndex((message) => message.id === initialMessageId) + 1
		: this.messages.length
	const newChatMessages = initialMessageId === null ? [] : this.messages.slice(0, initialMessage)

	// Create a new ChatEntity for the thread
	const threadChat = (await this.manager.create(ChatEntity, {
		messages: newChatMessages,
		category: this.category,
		name: opts?.name ?? this.name + `(Thread ${(this.threads?.length ?? 0) + 1})`,
		parentChatId: this.id,
		engine: this.engine,
		status: "idle",
		read: true,
	})) as ChatEntity

	this.threads = [...(this.threads ?? []), threadChat.id]
	if (this.messages.length && initialMessageId !== null) {
		this.editMessageId(initialMessageId ?? this.messages[this.messages.length - 1].id!, (message) => {
			message.threads = [...(message.threads ?? []), threadChat.id]
			return message
		})
	}

	if (opts.sendMessage) {
		threadChat.sendMessage({ message: opts.sendMessage })
	}

	return threadChat.id
}

export default spawnThread
