import { depFn, keyDep } from "modules/deps/index"
import { publicInvariant } from "modules/errors/index"
import { addWSFunction } from "modules/rpc-ws/server"
import { Deps } from "../../Deps"
import { ChatEntity } from "../../entities/ChatEntity"

const addChatTab = depFn(
	{
		chat: keyDep<string>("chat"),
		entityManager: Deps.entityManagerDep,
	},
	async function addChatTab({ chat, entityManager }) {
		const chatObj = await entityManager.read(ChatEntity, chat)
		publicInvariant(!!chatObj, "Chat not found")

		const subChat = await entityManager.create(ChatEntity, {})
		chatObj.update((c) => {
			c.connections = [
				...(c.connections ?? []),
				{
					type: "chat",
					id: subChat.id,
					data: {
						id: "text",
					},
				},
			]
		})
	},
)

export default addWSFunction(addChatTab)
