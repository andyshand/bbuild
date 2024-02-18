import { objToKeyVals } from './aiforloop'
import extractKeyVals from './extractKeyVals'

export default async function specificity(opts: { input: string }) {
  const { input } = opts
  const out = await extractKeyVals({
    examples: [
      objToKeyVals({
        Descriptor: 'all files',
        Specificity: '0%',
        Reasoning: 'all files where? all could mean anything',
        'Possible interpretations (not exhaustive)': [
          'all files in the current project',
          'all files on this computer',
          'all files on the internet',
          'all files ever created',
        ],
      }),
      objToKeyVals({
        Command: 'all files in my desktop',
        Specificity: '75%',
        Reasoning:
          'while it is possible the user could have multiple computers, limiting the scope to their desktop is quite specific',
        'Possible interpretations (not exhaustive)': [
          "all files on this user account's desktop",
          "all files on computer 2's desktop",
        ],
      }) as any,
    ],
    input,
  })
  console.log(out)
}
