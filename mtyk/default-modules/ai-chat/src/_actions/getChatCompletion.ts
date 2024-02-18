import { depFn, keyDep } from "modules/deps/index"
import { addWSFunction } from "modules/rpc-ws/server"
import { Deps } from "../Deps"

const getChatCompletion = depFn(
  {
    prompt: keyDep<string>(),
    project: keyDep<string>(),
    options: keyDep<Partial<{ model: string }>>(),
    getChatCompletion: Deps.getCompletion,
    entityManager: Deps.entityManagerDep
  },
  async function getChatCompletion({ project, prompt: message, getChatCompletion, entityManager, options: options }) {
    const result = await getChatCompletion(message, { model: 'gpt-3.5-turbo', ...options })
    return result
  },
)

export default addWSFunction(getChatCompletion)