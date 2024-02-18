import { createContext, useContext } from "react"
import { ChatEntity } from "../../../entities/ChatEntity"

export const ChatContext = createContext<{ chat: ChatEntity }>(null!)

export default ChatContext

export const ChatProvider = ChatContext.Provider
export const useChatContext = () => {
	return useContext(ChatContext)
}
