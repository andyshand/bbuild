import { zodSchemaToTypeString } from "modules/schema"
import { globalDepContext, keyDep } from "modules/deps"
import { ParseMessage } from "./ParseMessage"

export async function getZodCompletion({ schema, name }: any, prompt: string, ...rest: any[]) {
	const type = zodSchemaToTypeString(schema, name)
	let tries = 0
	const maxtries = 3
	const { getCompletion } = globalDepContext.provideSync({
		getCompletion: keyDep("getCompletion"), // TODO fix type
	})
	const amendedPrompt = `${prompt}

Format your response as JSON conforming to the following type:
${type}

Do not include any explanation or other text in your response, only the JSON. No other response will be accepted.`

	while (tries < maxtries) {
		tries++
		const result = await getCompletion.call(this, amendedPrompt, ...rest)

		// try parse
		try {
			const parsed = ParseMessage.json(result)
			const validated = schema.parse(parsed)
			return validated
		} catch (e) {
			console.log(e)
			console.log("Invalid JSON, try again")
		}
	}

	throw new Error(`Invalid JSON after ${maxtries} tries`)
}
