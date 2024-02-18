import { depFn, keyDep } from 'modules/deps'
import { Deps } from '../Deps'
import { ParseMessage } from '../formattings/parseMessage'

export default depFn({
  message: keyDep<string>('message'),
  getChatCompletion: Deps.getChatCompletion,
  getCompletion: Deps.getCompletion,
  tokenCounter: Deps.tokenCounter
}, async (
  {message, getChatCompletion}, ) => {    
    const prompt = `You are a JSON transformation machine. Please return all named entities from your previous message, in a JSON object conforming to \`type Entities = {name: string, url: string}[]\`. Only respond with a markdown JSON block, do not include any additional explanation.`
    const messages = [
      {role: 'assistant' as const, content: message},
      {role: 'user' as const, content: prompt},
    ]
    const response = await getChatCompletion(messages, {
      model: 'gpt-3.5-turbo' as any
    })

    const asJson = ParseMessage.json(response)
    return asJson
})