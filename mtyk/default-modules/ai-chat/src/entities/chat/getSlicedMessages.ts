import { depFn } from "modules/deps/index";
import { keyDep } from "modules/deps/tokenDep";
import { resolveEngine } from "../../Deps";
import { ChatEntity } from "../ChatEntity";

const getSlicedMessages = depFn(
	{
		message: keyDep<string>("message"),
		engine: keyDep<string>("engine"),
	},
	async function (this: ChatEntity, { message, engine: model }) {
		const engineImpl = resolveEngine(model);
		const engineLimit = engineImpl.getMaxContentLength(this.engine);

		const newMessage = { role: "user" as const, content: message };
		const rawMessages =
			typeof this.settings.lookback !== "undefined"
				? this.getRawMessages().slice(this.settings.lookback === 0 ? 999999999999 : -this.settings.lookback)
				: this.getRawMessages().slice(0, -1);

		const messagesToSend = [...rawMessages, newMessage];

		const ideal = this.getIdealResponseLength();
		let totalCount = engineImpl.countChatTokens(messagesToSend, model);

		while (messagesToSend.length > 1 && totalCount + ideal >= engineLimit) {
			// remove the earliest message
			messagesToSend.shift();
			totalCount = engineImpl.countChatTokens(messagesToSend, model);
			// Count again
		}

		return messagesToSend;
	},
);

export default getSlicedMessages;
