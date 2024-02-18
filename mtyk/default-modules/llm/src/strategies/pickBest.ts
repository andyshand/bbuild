import { CompletionSettings } from "../engines/ChatEngine";
import getChatCompletion from "../engines/getChatCompletion";

export default async function pickBest(
  prompt: string,
  opts: { n?: number; model: string[] | string; judgementModel: string } & Omit<CompletionSettings, "model">,
): Promise<string> {
  const { n: _n, model, judgementModel, ...rest } = opts
  const n = _n ?? model.length
  if (!n) {
    throw new Error(`n must be greater than 0`)
  }

  const completions = await Promise.all(
    Array.from({ length: n }, async (v, i) => {
      const completion = await getChatCompletion(prompt, { ...rest, model: Array.isArray(model) ? model[i] : model })
      return completion.trim()
    }),
  )

  const pickPrompt = `The following are ${n} different completions for a prompt:

  ${completions.map((c, i) => `${i + 1}. ${c}`).join("\n\n")}

  The prompt was:

  ${prompt}

  Thinking carefully, pick the most correct and accurate completion from the selection, responding with its associated number. Only respond with the number, nothing else. No other response will be accepted.
  `

  const best = await getChatCompletion(pickPrompt, {
    ...rest,
    model: judgementModel,
    temperature: 0.0,
  })


  const matched = /(\d+)/.exec(best)
  if (!matched) {
    throw new Error(`Could not find a number in the response: ${best}`)
  }
  const bestCompletion = completions[parseInt(matched[1]) - 1]
  return bestCompletion
}
