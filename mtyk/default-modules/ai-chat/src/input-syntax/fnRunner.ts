import { ChatEntity } from "../entities/ChatEntity"
import { functionArgKeys, functionMap, silentFns } from "./functionMap"

export default async function parseAndRunFunctions(chat: ChatEntity, message: string) {
	const results: {
		name: string
		args: any[]
		result: any
		silent: boolean
	}[] = []
	let position = 0

	function peek(len?: number) {
		if (typeof len === "number") {
			return message.slice(position, position + len)
		}
		return message[position]
	}

	function consume(chars?) {
		if (!chars || peek(chars?.length) === chars) {
			const consumed = peek(chars?.length)
			position += chars?.length ?? 1
			return consumed
		} else {
			throw new Error(`Expected "${chars}", but got "${peek(chars?.length)}"`)
		}
	}

	function backtrack(predicate: (char: string) => boolean): string {
		let result = ""
		let i = position - 1
		while (i >= 0 && predicate(message[i])) {
			result = message[i] + result
			i--
		}
		return result
	}

	function parseName() {
		return backtrack((char) => /[a-zA-Z0-9_]/.test(char))
	}

	async function parseFunctionCall() {
		const name = parseName()
		consume("(")
		const argValues = await parseArguments()
		consume(")")
		const fn = functionMap[name]
		if (!fn) {
			console.warn(`Function ${name} not found`)
			return
		}
		const argKeys = functionArgKeys[name]
		if (!argKeys) {
			console.warn(`Argument keys for function ${name} not found`)
			return
		}
		const args = {
			chat,
			message,
		}
		for (let i = 0; i < argKeys.length; i++) {
			args[argKeys[i]] = argValues[i]
		}

		const contextualisedArgs: any = {}
		await Promise.allSettled(
			argKeys.map(async (key, i) => {
				const cxtd = await functionMap.extractContext({
					chat,
					args: argValues,
					function: name,
					index: i,
					message,
				})
				contextualisedArgs[key] = cxtd
			}),
		)

		// const result = await fn({...args, ...contextualisedArgs})
		const result = contextualisedArgs

		return {
			name,
			args: argValues,
			result,
			silent: silentFns.has(name),
		}
	}

	async function parseArguments() {
		const args: any[] = []
		while (peek() !== ")") {
			if (peek() === "(") {
				args.push(await parseFunctionCall())
			} else {
				let arg = ""
				while (peek() !== "," && peek() !== ")") {
					arg += peek()
					position++
				}
				args.push(arg.trim())
			}
			if (peek() === ",") {
				consume(",")
			}
		}
		return args
	}

	const codeBlocks: {
		code: string
	}[] = []

	try {
		while (position < message.length) {
			if (peek() === "(") {
				const parsed = await parseFunctionCall()
				if (parsed) {
					results.push(parsed)
				}
			}
			if (peek() === "`" || peek(3) === "```") {
				const single = peek(3) !== "```"
				const peekWithN = single ? peek : peek.bind(null, 3)
				const marker = single ? "`" : "```"
				consume(marker)

				let code = ""
				let wasBackslash = false
				let inString = false
				position++
				while ((peekWithN() !== marker || wasBackslash || inString) && position < message.length) {
					code += consume()
					wasBackslash = code[code.length - 1] === "\\"
					if (inString && !wasBackslash && /["']/.test(code[code.length - 1])) {
						inString = false
					} else {
						inString = inString || /["']/.test(code[code.length - 1])
					}
				}
				consume(marker)
				codeBlocks.push({
					code,
				})
			} else {
				position++
			}
		}
	} catch (e) {
		console.error(e)
	}

	return { results, codeBlocks }
}
