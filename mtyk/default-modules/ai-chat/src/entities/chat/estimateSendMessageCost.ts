import { depFn } from "modules/deps/index";
import { keyDep } from "modules/deps/tokenDep";
import { ChatEntity } from "../ChatEntity";

export default depFn(
	{
		message: keyDep<string>("message"),
	},
	async function (this: ChatEntity, { message }) {
		const engineImpl = this.engineImpl;
		const engineLimit = engineImpl.getMaxContentLength(this.engine);
		const messages = await this.getSlicedMessages({ message, engine: this.engine });
		const costEstimates = messages.map((m) => engineImpl.countTokens(JSON.stringify(m)));
		const totalCost = costEstimates.reduce((a, b) => a + b, 0);

		return {
			cost: totalCost,
			overLimit: totalCost > engineLimit,
		};
	},
);
