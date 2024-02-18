import { Entity, EntityField } from "modules/entities"
import { EnhancedMessage } from "../EnhancedMessage"

type QueuedMessage = {
	type: "message"
	message: Pick<EnhancedMessage, "content" | "json">
}

export class ChatMessageQueueEntity extends Entity {
	@EntityField({ defaultValue: [] })
	queuedMessages: QueuedMessage[] = []

	queueMessage(msg: Pick<EnhancedMessage, "content" | "json">) {
		this.update((c) => {
			c.queuedMessages = [...(c.queuedMessages ?? []), { type: "message", message: msg }]
		})
	}

	takeMessage() {
		const message = this.queuedMessages[0]
		this.update((c) => {
			c.queuedMessages = (c.queuedMessages ?? []).slice(1)
		})
		return message
	}

	clear() {
		this.update((c) => {
			c.queuedMessages = []
		})
	}
}
