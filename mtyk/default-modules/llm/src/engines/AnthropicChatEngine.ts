import tokenizer from 'gpt-tokenizer';
import { invariant } from "modules/errors";
import { Observable } from "rxjs";
import { ChatEngine } from "./ChatEngine";
import anthropicCompletion from "./anthropic-completion";

export class AnthropicChatEngine implements ChatEngine {
	countTokens(text: string): number {
		return tokenizer.encode(text).length
	}

	countChatTokens(chat: { role: "user" | "system" | "assistant"; content: string }[], model = 'gpt-4'): number {
		// Remove the version/16k suffix
		// let modelForTokenizer: any = model.includes('gpt-4') ? 'gpt-4' : model.includes('gpt-3.5-turbo') ? 'gpt-3.5-turbo' : model;

		return tokenizer.encodeChat(chat, 'gpt-4').length
	}

	getMaxContentLength(model: any): number {
		return 100000
		// return model.includes("100k") ? 100000 : 9000;
	}

	async getCompletionCost(messages, settings) {
		// Get total tokens for prompt
		const totalTokens = messages.reduce((acc, message) => {
			return acc + this.countTokens(JSON.stringify(message));
		}, 0);

		const { model, max_tokens } = settings;
		invariant(!!model && max_tokens, "No model or max_tokens provided");

		const completionCost = {
			"claude-instant-v1": 5.51,
			"claude-v1": 32.68,
			"claude-instant-v1-100k": 5.51,
			"claude-v1-100k": 32.68,
		}[model];
		const promptCost = {
			"claude-instant-v1": 1.63,
			"claude-v1": 11.02,
			"claude-instant-v1-100k": 1.63,
			"claude-v1-100k": 11.02,
		}[model];

		// Calculate costs based on model
		let likelyCost = 0;
		let maxPossibleCost = 0;

		likelyCost += (promptCost * totalTokens) / 1_000_000;
		const likelyCompletionTokens = 5000;
		likelyCost += (completionCost * likelyCompletionTokens) / 1_000_000;

		maxPossibleCost += (promptCost * totalTokens) / 1_000_000;
		maxPossibleCost += (completionCost * max_tokens) / 1_000_000;

		return {
			likelyCost,
			maxPossibleCost,
		};
	}

	async getChatCompletion(_messages, settings) {
		const messages = Array.isArray(_messages) ? _messages : [{ role: "user", content: _messages }];

		const abortController = new AbortController();

		const stream = await anthropicCompletion(messages, {
			...settings,
			stream: true,
			streamCallback: () => { }, // Placeholder for streamCallback
			signal: abortController.signal,
		});

		const cancel = () => {
			try {
				if (!abortController.signal.aborted) {
					abortController.abort();
				}
			} catch (e) {
				console.error(e);
			}
		};
		const messagesObservable = new Observable<{ role: "user" | "system" | "assistant"; content: string }[]>(
			(subscriber) => {
				stream.on("data", (chunk) => {
					const content = chunk.toString().trim();
					subscriber.next([{ role: "assistant", content }]);
				});

				stream.on("end", () => {
					subscriber.complete();
				});

				stream.on("error", (error) => {
					subscriber.error(error);
				});

				return () => {
					cancel();
				};
			},
		);

		return {
			messages: messagesObservable,
			cancel,
		};
	}
}

const anthropicChatEngine = new AnthropicChatEngine();
export default anthropicChatEngine;
