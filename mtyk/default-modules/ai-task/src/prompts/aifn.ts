import { objToKeyVals, runFixing } from './aiforloop'
import { extractKeyValsAsObj } from './extractKeyVals'
import getFnContext from './getFnContext'

/**
 * Example inputs
 *
 *
 * "For all files in this folder, change the file name to the file name with the extension removed"
 */
export default async function aiFn(opts: { input: string }) {
  const { input } = opts
  const out = await extractKeyValsAsObj({
    examples: [
      objToKeyVals({
        Command: 'remove all capital letters from file name',
        Function: `async function run({ fileName }) {
  return fileName.toLowerCase()
}`.replaceAll(/\n/g, ' '),
      }),
      objToKeyVals({
        Command: 'delete the file',
        Function: `async function run({ filePath }, cb) {
  const fs = require('fs')
  fs.unlinkSync(filePath)
}`.replaceAll(/\n/g, ' '),
      }) as any,
    ],
    input,
  })

  const args = await getFnContext({ input: out.Function })

  // const responseArgs = await prompts({
  //   type: 'confirm',
  //   name: 'confirm',
  //   message: `Fn: ${out.Function}, Args: ${JSON.stringify(args, null, 2)}`,
  // })

  // if (!responseArgs.confirm) {
  //   throw new Error('User cancelled')
  // }

  const rett = await runFn(out.Function, args)
  return rett
}

export async function runFn(fn: string, theargs: any, tries = 0) {
  if (tries > 3) {
    throw new Error('Failed to run function')
  }

  return runFixing(
    fn,
    async inn => {
      const evalStr = `function getFn() { ${inn}\n\n return run };\ngetFn()`
      const fnCode = await runFixing(evalStr, val => eval(val))
      // const output = await fnCode(theargs)
      // console.log({ output })
      // return output
    },
    tries
  )
}
