import { depFn, keyDep } from 'modules/deps'
import { getContext } from "./ContextManager"

export type SourceResult = {
  value: string
}

export const getAllContextSources = depFn({
}, async function getAllContextSources() {

  // TODO changed this temporarily, has it broken anything?
  const modles = [].map(m => {
    return {
      name: m.constructor.name,
      type: "model",
    }
  })

  return [...modles]
})

type TypeDesc = "string" | "number" | "boolean" | "object" | "array" | "null" | "undefined" | "function" | "symbol" | "bigint" | "unknown" | Record<string, any>


const objToTypes = (obj: any) => {
  const out: TypeDesc = {}
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      out[key] = objToTypes(obj[key])
    } else {
      out[key] = typeof obj[key]
    }
  }
  return out
}

const EntitySourcer = {
  source: depFn({
    namedEntity: keyDep<string>('namedEntity'),
    context: keyDep<Record<string, any>>('context'),
    message: keyDep<string>('message')
  }, async function source({ namedEntity, context, message }) {
    const results = [] as SourceResult[]

    const actualContext = await getContext({})
    const toTypes = objToTypes(actualContext)

    console.log('toTypes', toTypes)
    // First, see if it makes sense to take it from our current conversation context
    // const canDescribe = await getSingleChatCompletion(`I have some information that matches the following schema: \`\`\`${JSON.stringify(toTypes)}\`\`\`\nIf I asked you to describe "${namedEntity}", which paths in the object do you feel may be relveant? Please answer with a comma-separated list.`, {
    //   max_tokens: 10,
    //   temperature: 0,
    //   model: Model.ChatGPT
    // })
    // const paths = await getSingleChatCompletion(`I have some information that matches the following schema: \`\`\`${JSON.stringify(toTypes)}\`\`\`\nIf I asked you to describe "${namedEntity}", do you think there would be sufficient information in an object of this type? Answer "yes" or "no" only.`, {
    //   max_tokens: 10,
    //   temperature: 0,
    //   model: Model.ChatGPT
    // })


    // const canDescribeBool = /yes/i.test(canDescribe)
    // console.log({canDescribe, canDescribeBool})

    // if (canDescribeBool) {
    //   const describe = await getSingleChatCompletion(`Here is some context information, as JSON: \`\`\`${JSON.stringify(actualContext)}\`\`\`\nIf I asked you to describe "${namedEntity}", what would you say?`, {
    //     // max_tokens: 1024,
    //     model: Model.ChatGPT
    //   })
    //   console.log({describe})
    //   results.push({
    //     value: describe
    //   })
    // }


    // Look at other available information sources we might make use of
    // const otherSources = ['vscode', 'otherapps', 'spotify', 'google']

    // Look in our knowledge graph, by autogenerating a knowledge graph query based on the named entity
    // e.g. my friend bob -> MATCH (me:Person {name: "me"})-[:FRIENDS]->(bob:Person {name: "bob"}) RETURN me, bob
    // e.g. our conversation yesterday -> MATCH (me:Person {name: "me"})-[:CONVERSATION]->(date:Date {date: "yesterday"})

    return ['hi'] as any
  }),

  // getNamedEntities: depFn({
  //   message: keyDep<string>('message')
  // }, async function getNamedEntities({ message }) {
  //   const namedEntities = await getSingleChatCompletion(`What named entities are mentioned in the following message? Answer with a comma-separated list.\n\`\`\`${message}\`\`\``, {
  //     model: Model.ChatGPT
  //   })
  //   return namedEntities.split(',').map(e => e.trim())
  // }),

  // addOutputEntities: depFn({
  //   namedEntity: keyDep<string>('namedEntity'),
  //   message: keyDep<string>('message')
  // }, async function addOutputEntities({ namedEntity, message }) {


  //   // For example `namedEntity` may be "the react-compound-slider package". We should use the surrounding text around this message and ask gpt
  //   // to create/hallucinate a url where we can view this entity and find more information about it.

  //   const gptAnswer = await getSingleChatCompletion(`You are a master of the world wide web and know where to find everything. What url should I visit to find more information about "${namedEntity}" mentioned in the following message? Answer with just the url, nothing else.\n\`\`\`${message}\`\`\``, {
  //     model: Model.ChatGPT
  //   })
  //   // Once we have the URL, we can use standard code to figure out what type of context best represents this.

  //   // For example, if the URL is a github repo, we can use the github API to get the repo name, description, etc. and create a context object
  //   const urlMatch = /https?:\/\/[^\s]+/i.exec(gptAnswer)
  //   if (urlMatch) {
  //     const url = urlMatch[0]
  //     const ctx = contextFromUrl(url)
  //     return ctx
  //     // return context
  //   }

  //   return null



  // })
}

export default EntitySourcer