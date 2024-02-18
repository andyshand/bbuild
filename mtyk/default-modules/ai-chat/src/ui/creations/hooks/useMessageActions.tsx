import { useCallback, useState } from "react";
import { FaCheck, FaComments, FaEdit, FaExclamationTriangle, FaPencilAlt, FaRecycle, FaStar, FaTrashAlt } from "react-icons/fa";
import { ChatEntity } from "../../../entities/ChatEntity";

export function useMessageActions({
  chat,
  index,
  content,
  role,
}: { chat: ChatEntity; index: number; content: string; role: string }) {
  const msgObject = chat.messages[index]
  const isStarred = msgObject?.favourited
  const [isEditing, setIsEditing] = useState(false)

  const toggleStarred = () => {
    chat.editMessageId(msgObject.id!, (msg) => {
      return { ...msg, favourited: !msg.favourited }
    })
  }


  const onEdit = useCallback(() => {
    // chat.editMessage(index, newContent)
  }, [chat, index])

  const onDelete = useCallback(() => {
    chat.deleteMessage(index)
  }, [chat, index])

  const onNewChat = useCallback(() => {
    if (msgObject.id) {
      chat.spawnThread(msgObject.id)
    }
  }, [chat, index])

  const insertAsNewMessage = useCallback(() => {
    // Copy to clipboard
    navigator.clipboard.writeText(content)
  }, [chat, content])

  const onRegenerateActions = useCallback(() => {
    // chat.genActions({ index })
    // chat.genCodeBlockSummaries({index});
  }, [chat, index])

  const actions = [
    // { show: role !== 'user', icon: FaRedoAlt, title: 'Regenerate message', onClick: onRegenerate },
    { show: role === "user" && false, icon: FaEdit, title: "Edit message", onClick: onEdit },
    { show: true, icon: FaComments, title: "Create a new chat based on messages before this one", onClick: onNewChat },
    {
      show: true,
      icon: FaStar,
      title: "Favourite message",
      onClick: toggleStarred,
      iconColor: isStarred ? "yellow" : undefined,
    },
    { show: true, icon: FaRecycle, title: "Insert as new message", onClick: insertAsNewMessage },
    { show: true, icon: FaTrashAlt, title: "Delete message", onClick: onDelete },
    { show: true, icon: isEditing ? FaCheck : FaPencilAlt, title: "Edit", onClick: () => setIsEditing(!isEditing) },
    {
      show: true,
      icon: FaExclamationTriangle,
      title: "Clear threads",
      onClick: () => {
        if (msgObject.id) {
          chat.editMessageId(msgObject.id, (msg) => {
            return { ...msg, threads: [] }
          })
        }
      },
    },
    // { show: role !== "user", icon: FaRedo, title: "Regenerate intelligent actions", onClick: onRegenerateActions },
  ]

  return { actions, isStarred, isEditing }
}
