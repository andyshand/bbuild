import { depFn } from "modules/deps/index"
import { keyDep } from "modules/deps/tokenDep"
import { typeDep } from "modules/deps/typeDep"
import { Deps } from "../Deps"
import { EnhancedMessage } from "../EnhancedMessage"
import { ChatEntity } from "../entities/ChatEntity"

export const functionMap = {
	extractContext: depFn(
		{
			chat: keyDep<ChatEntity>("chat"),
			message: keyDep<string>("message"),
			getChatCompletion: Deps.getChatCompletion,
			function: keyDep<string>("function"),
			args: keyDep<string[]>("args"),
			index: keyDep<number>("index"),
		},
		async ({ chat, message, getChatCompletion, args, index, function: functionName }) => {
			const slicedMesg = await chat.getSlicedMessages({ message, engine: chat.engine })

			const prompt = `You are an argument interpreter for a natural language function calling machine. You have the following information available for context:

Latest ${slicedMesg.length} messages:
${slicedMesg.map((m) => `${m.role}: ${m.content}`).join("\n")}

The function being called has the following natural language structure:
${functionName}(${args.join(",")})

Now, using the context above, please provide your very best, JSON parsable context-imbued interpretation of the argument at index ${index}. This must be in a JSON parsable format, such as a string, number, boolean value, or array/object. Do not include any additional information. Only JSON values will be accepted.`

			const result = await getChatCompletion(prompt)
			return result
		},
	),

	forEach: depFn(
		{
			iterableThing: keyDep<string>("iterableThing"),
			doSomething: keyDep<string>("doSomething"),
			getChatCompletion: Deps.getChatCompletion,
			history: keyDep<EnhancedMessage[]>("history", { optional: true }),
			transient: typeDep(Boolean, { optional: true }),
			engine: typeDep(String, { optional: true }),
			getChatCompletionStream: Deps.getChatCompletionStream,
		},
		async ({ iterableThing, doSomething, getChatCompletion, history, transient, engine, getChatCompletionStream }) => {
			// const items = await LLM_API.getJson(`What are the items in ${iterableThing}?`)
			// for (const item of items) {
			// 	await parseAndRunFunctions(doSomething.replace(/you mentioned/g, item))
			// }
		},
	),

	map: depFn(
		{
			iterableThing: keyDep<string>("iterableThing"),
			transform: keyDep<string>("transform"),
			format: keyDep<string>("format", { optional: true }),
		},
		async ({ iterableThing, transform, format = "Format" }) => {
			// const items = await LLM_API.getJson(`What are the items in ${iterableThing}?`)
			// return Promise.all(items.map((item) => parseAndRunFunctions(transform.replace(/you mentioned/g, item))))
		},
	),

	search: depFn(
		{
			contents: keyDep<string>("contents"),
			forWhat: keyDep<string>("forWhat"),
			format: keyDep<string>("format", { optional: true }),
			nResults: keyDep<number>("nResults", { optional: true }),
		},
		async ({ contents, forWhat, format = "Format", nResults = 1 }) => {
			// const occurrences = await LLM_API.getJson(`How many times does ${forWhat} occur in ${contents}?`)
			// return occurrences > 0 ? [{ usage: forWhat, line: occurrences }] : []
		},
	),

	log: depFn(
		{
			thing: keyDep<string>("thing"),
			fmt: keyDep<string>("fmt", { optional: true }),
			getChatCompletion: Deps.getChatCompletion,
		},
		({ thing, fmt }) => {
			console.log(fmt ? fmt : thing)
			return thing
		},
	),

	ask: depFn(
		{
			thing: keyDep<string>("thing"),
			ifWhatDo: keyDep<string>("ifWhatDo"),
			context: keyDep<string>("context", { optional: true }),
		},
		async ({ thing, ifWhatDo, context }) => {
			// const answer = await LLM_API.getJson(`Should I ${thing}?`)
			// if (answer === "yes") {
			// await parseAndRunFunctions(ifWhatDo.replace(/results so far/g, context))
			// }
		},
	),

	if: depFn(
		{
			condition: keyDep<string>("condition"),
			ifWhatDo: keyDep<string>("ifWhatDo"),
			context: keyDep<string>("context", { optional: true }),
		},
		async ({ condition, ifWhatDo, context }) => {
			// const shouldDo = await LLM_API.getJson(`Should I do ${condition}?`)
			// if (shouldDo) {
			// 	await parseAndRunFunctions(ifWhatDo.replace(/the error/g, context))
			// }
		},
	),

	notify: depFn(
		{
			about: keyDep<string>("about"),
			fmt: keyDep<string>("fmt", { optional: true }),
		},
		({ about, fmt }) => {
			alert(fmt ? fmt : about) // This would open an alert dialog in a browser environment
		},
	),
}
export const functionArgKeys: { [key: string]: string[] } = {
	forEach: ["iterableThing", "doSomething"],
	map: ["iterableThing", "transform", "format"],
	search: ["contents", "forWhat", "format", "nResults"],
	log: ["thing", "fmt"],
	ask: ["thing", "ifWhatDo", "context"],
	if: ["condition", "ifWhatDo", "context"],
	notify: ["about", "fmt"],
}
export const silentFns = new Set(["log", "notify"])
