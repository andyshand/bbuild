import { depFn, keyDep } from "modules/deps";
import { Deps } from "../Deps";
import { EnhancedMessage } from "../EnhancedMessage";
import { CodeBlock } from "../formattings/codeblock";
import { ParseMessage } from "../formattings/parseMessage";

export default depFn({
  index: keyDep<number>('index'),
  getChatCompletion: Deps.getChatCompletion,  
  code: keyDep<EnhancedMessage>('code'),
}, async ({ code, getChatCompletion }) => {

  const prompt = `The user has requested to turn the following code snippet into a reusable tool.
${CodeBlock.ts(code)}

All tools are self-contained and cannot import or require other files. They may use \`import type\` inline to get the type of npm packages, but they must still be specified in the 1st argument to the \`tool\` function, which is available in global scope. 

All tools must follow a consistent structure, as follows:
\`\`\`typescript
export default tool({
  // dependencies and arguments, intermixed
  toolArg: keyDep<string>('toolArg'),
  npmPackage: keyDep<typeof import('package-name')>('npmPackage')
}, async ({ toolArg, npmPackage }) => {
  // Perform your tool logic here and return a value, if applicable
})
\`\`\`

The 1st argument creates an object that represents the values that will be injected into your tool function (2nd argument).

Each property in the 1st object may represent:
- A dependency automatically provided by the intelligent tool library
- An argument the user needs to pass, such as an input string, number, etc…

The type argument to \`keyDep\` simply represents the type of the argument or dependency. You can modify this depending on your requirements.

Note that:
- You cannot import or require packages or other files, unless importing types only. All dependencies will be provided by the running environment, based on the values in the first argument
- Because of the above, all code must be self contained within this file or added as a dependency in the first argument

Please respond with a markdown typescript codeblock matching the above schema.`

  const completion = await getChatCompletion(prompt, {
    model: 'gpt-4' as any
  })

  return ParseMessage.code(completion)
})