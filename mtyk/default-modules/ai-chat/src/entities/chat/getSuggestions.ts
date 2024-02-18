import { depFn } from "modules/deps/index";
import { Deps } from "../../Deps";

export default depFn(
	{
		getChatCompletion: Deps.getChatCompletion,
	},
	async function ({ getChatCompletion }) {
		const newMessage = this.newMessage;
		const lastParagraph = newMessage.split(".").slice(-1)[0].trim();
		const prompt = `I need you to act as an intelligent autocomplete engine that can suggest the remaining portion of a user's message.

This is in regards to a conversation represented by this json object: \`\`\`json
${JSON.stringify(this.getRawMessages().slice(-2))}
\`\`\`   
  
The user has typed the following incomplete message: ${JSON.stringify(newMessage)}.

1. Do not include any of the original message in your completions.
2. Your suggestions are from the user's POV, they should not be answers, rather - continuations of the user's message.
3. If you only require a few words to complete the sentence, you may start a new sentence. 

Please respond with 3 possible ideas of how to complete the sentence, separated by new lines.`;

		const result = await getChatCompletion([{ role: "user", content: prompt }], {
			model: "gpt-3.5-turbo" as any,
		});

		this.suggestions = result
			.split("\n")
			.map((_str) => {
				let str = _str
					.trim()
					.replace(/^[0-9]\./, "")
					.replace(/^[ -]+/, "")
					.replace(/^\.\.\./, "")
					.trim()
					.replace(/^"/, "")
					.replace(/"$/, "");
				// Remove surrounding doubel quotes if present, and remove any of the original message, if present
				if (str.toLowerCase().includes(lastParagraph.toLowerCase())) {
					return str.slice(str.toLowerCase().indexOf(lastParagraph.toLowerCase()) + lastParagraph.length);
				}
				return str;
			})
			.filter((s) => s.trim().length > 0);
	},
);
