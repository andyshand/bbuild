export type BaseActivity = {
	shortDescription: string
	status: "completed" | "in-progress" | "idle" | "error"
	completedAt?: Date
	result?: {
		raw: string
		codeBlocks?: { content: string }[]
		commentary?: string
	}
	createdAt?: Date
	id: string
}

export type ChatCreationEditActivity = BaseActivity & {
	type: "creation-edit"
	creation: string
	edit: string
}

export type ChatActivity = ChatCreationEditActivity
