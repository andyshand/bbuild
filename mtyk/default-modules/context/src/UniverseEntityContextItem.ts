export type UniverseEntityContextItem = {
	type: "entity"
	entityType: string
	id: string
	paths?: string[]
}

export type UniverseFileContextItem = {
	type: "file"
	id: string
	path: string
	range?: {
		start: number
		end: number
	}
}

export type UniverseUnlinkedContextItem = {
	id: string
}

export type UniverseContextItemBase = {
	id: string
	url?: string
	label?: string
	fetchedAt: Date
}

export type UniverseContextItemSuggestion = {
	id: string
	label?: string
}

export type UniverseContextItem = UniverseContextItemBase &
	(UniverseEntityContextItem | UniverseFileContextItem | UniverseUnlinkedContextItem) & {
		metadata?: Record<string, any>
		contextItem: true
		aliases?: string[]
	} & Record<string, any>

export type UniverseContextItemType = UniverseContextItem | UniverseContextItemSuggestion

export function isContextItem(item: any): item is UniverseContextItem {
	return typeof item === "object" && item?.contextItem === true
}

export function isPartialContextItem(item: any): item is UniverseContextItemSuggestion {
	return typeof item === "object" && item?.id && item?.label
}

export function createContextItem(opts: {
	id: string
	url?: string
	label?: string
	type?: string
	entityType?: string
	paths?: string[]
	aliases?: string[]
	metadata?: Record<string, any>
}): UniverseContextItem {
	return {
		...opts,
		contextItem: true,
		fetchedAt: new Date(),
	}
}

export function createContextItemSuggestion(opts: {
	id: string
	label: string
}): UniverseContextItemSuggestion {
	return {
		...opts,
	}
}
