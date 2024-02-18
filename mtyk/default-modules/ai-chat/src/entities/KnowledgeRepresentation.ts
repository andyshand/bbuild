import { Location } from "../actions/Action"

export interface KnowledgeRepresentation {
	type: "text" | "image" | "video" | "audio" | "link" | "file" | "type"
	version: string
	content: string
	id: string
	location: Location
}
