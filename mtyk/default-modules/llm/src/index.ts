import { getZodCompletion } from './getZodCompletion'

export * from './engines'

export {
  default as getChatCompletion,
  getChatCompletionStream,
  getJSONCompletion,
  getJSONCompletionStream,
} from './engines/getChatCompletion'
export { getZodCompletion }
export { getCodeCompletion } from './getCodeCompletion'

// --- BEGIN INJECTED CODE ---

// Inject some code to check if we've imported two different versions of any module. This is a common cause of bugs.
const globalObject: any = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}
const globalStore = globalObject?.__bbuild ?? {}
if (globalStore["llm"]) {
console.warn(`Duplicate module llm imported. This can lead to bugs.`);
}
globalStore["llm"] = true;
 
// --- END INJECTED CODE ---