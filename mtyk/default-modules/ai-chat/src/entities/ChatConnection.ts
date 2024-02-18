import { Action } from "../actions/Action"

export type ChatFile = {
	path: string
	id?: string
	content?: string
}
export type ChatSettings = {
	engine?: "gpt-4" | "gpt-3.5-turbo"
	temperature?: number
	before?: string
	after?: string
	expanded?: boolean

	/**
	 * If `undefined`, maximium possible lookback (determined by engine) will be used. Otherwise,
	 * only sends x amount of previous messages
	 */
	lookback?: number
}
export type BaseConnection = {
	id: string
	name: string
}
export type GridChatConnection = BaseConnection & {
	type: "grid"
	data: {
		id: string
	}
}
export type ChatChatConnection = BaseConnection & {
	type: "chat"
	data: {}
}

export type ChatCreationConnection = BaseConnection & {
	type: "creation"
	data: {
		chat: string
		type: "code" | "text"
		history?: {
			contents: string
			message: string
			status: "in-progress" | "completed" | "error"
			id: string
		}[]
		contents: string

		/**
		 * If this represents an existing file, this is the path to the file
		 */
		realPath?: string
	}
}

export type ActionConnection = BaseConnection & {
	type: "action"
	name: string
	data: { action: Action }

	/**
	 * If not present, doesn't exist yet. Action is still being customised
	 */
	task?: string
}
export type ChatTabbableConnection = ChatChatConnection | ChatCreationConnection
export type ChatConnection = GridChatConnection | ChatCreationConnection | ActionConnection | ChatChatConnection
