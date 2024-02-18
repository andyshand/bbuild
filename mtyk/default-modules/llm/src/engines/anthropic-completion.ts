import { AI_PROMPT, Client, HUMAN_PROMPT } from "@anthropic-ai/sdk";
import tokenizer from 'gpt-tokenizer';
import { PassThrough } from "stream";

function createAPI() {
	if (!process.env.ANTHROPIC_KEY) throw new Error("ANTHROPIC_KEY is not set.")
	return new Client(process.env.ANTHROPIC_KEY)
}

let anthropic: any = null
async function completion(
	messages: { role: "user" | "system" | "assistant"; content: string }[],
	options: {
		model?: string
		stream?: boolean
		max_tokens?: number
		signal?: AbortSignal
	} = {},
) {
	if (!anthropic) anthropic = createAPI()
	if (!options) options = {}
	if (!options.model) options.model = completion.defaultModel
	if (!Array.isArray(messages)) throw new Error("claude.completion() expected array of messages")

	const prompt = messages
		.map((message) => {
			return `${toAnthropicRole(message.role)} ${message.content}`
		})
		.join("")

	const modelMaxTokens = 100000

	const anthropicOptions = {
		prompt: prompt + AI_PROMPT,
		stop_sequences: [HUMAN_PROMPT],
		max_tokens_to_sample: options.max_tokens ? options.max_tokens : modelMaxTokens - tokenizer.encode(prompt).length,
		model: options.model,
	}

	if (options.stream) {
		const stream = new PassThrough()

		anthropic
			.completeStream(anthropicOptions, {
				onOpen: () => { },
				onUpdate: (completion: any) => {
					stream.write(completion.completion)
				},

				signal: options.signal,
			})
			.then(() => {
				stream.end()
			})
			.catch((error: any) => {
				stream.end()
				if (error.name === "AbortError") {
					console.log("Cancelled completeStream()")
				}
			})

		return stream
	} else {
		const response = await anthropic.complete(anthropicOptions, { signal: options.signal }).catch((error: any) => {
			if (error.name === "AbortError") {
				console.log("Cancelled complete()")
			}
		})

		if (!response || response.exception) throw new Error("invalid completion from anthropic")

		const content = response.completion.trim()
		return content
	}
}

function toAnthropicRole(role: "user" | "system" | "assistant"): string {
	switch (role) {
		case "user":
			return HUMAN_PROMPT
		case "assistant":
		case "system":
			return AI_PROMPT
		default:
			throw new Error(`unknown anthropic role ${role}`)
	}
}

completion.defaultModel = "claude-v1"

export default completion
