import { EnhancedMessage } from "../EnhancedMessage"
import parseCodeBlocks from "../formattings/parseCodeBlocks"

export default function createEnhancedMessage({ content, role, ...rest }: Partial<EnhancedMessage> & Pick<EnhancedMessage, 'content' | 'role'>): EnhancedMessage {
	return {
		...rest,
		id: Math.random().toString(36).slice(2),
		content,
		role,
		codeBlocks: parseCodeBlocks(content),
		threads: [],
		actions: [],
		createdAt: new Date(),
		entities: [],
	}
}
