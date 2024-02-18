import { globalDepContext } from 'modules/deps/createDepContext';
import { Deps } from '../Deps';
import getFormatPrompt, { createFormattedResult } from './OutputFormat';

export async function getCompletionWithFormat(args: any[], format: string | undefined, model: string) {
  const { getCompletion } = globalDepContext.provideSync({
    getCompletion: Deps.getCompletion
  });
  try {
    const [prompt] = args;
    const result = await getCompletion(prompt + getFormatPrompt(format as any), { model: model });
    return { results: createFormattedResult(format as any, result) };
  } catch (e) {
    console.error(e);
    return { results: [] };
  }
}
