// import prompts from "prompts"
import { getCompletionNoStream } from "../getCompletionNoStream"
import { ts } from "../transform"
import { extractCode } from "./extract"
import { extractKeyValsAsObj } from "./extractKeyVals"
import getFnContext from "./getFnContext"

export const objToKeyVals = <T>(obj: T): any => {
	// export const objToKeyVals = <T>(obj: T): {key: keyof T, value: T[keyof T]}[] => {
	return Object.keys(obj as any).map((key) => ({ key, value: obj[key] })) as any
}

/**
 * Example inputs
 *
 *
 * "For all files in this folder, change the file name to the file name with the extension removed"
 */
export default async function aiForLoop(opts: { input: string }) {
	const { input } = opts
	const out = await extractKeyValsAsObj({
		examples: [
			objToKeyVals({
				Command: "for all files in this folder, remove all capital letters from each file name",
				Iterator: "all files in folder",
				Subcommand: "remove all capital letters from each file name",
				IteratorFunction: `async function iterator({ folder }, cb) {
  const fs = require('fs');
  for (const file of fs.readdirSync(folder)) {
    await cb({ file })
  }
}`.replaceAll(/\n/g, " "),
			}),
			objToKeyVals({
				Command: "delete all node_modules directories in the current project",
				Ierator: "all node_modules folders in the current project",
				Subcommand: "delete folder",
				IteratorFunction: `async function iterator({ project }, cb) {
  const glob = require('glob');
  for (const file of glob.sync(project + '/**/node_modules')) {
    await cb({ file })
  }
}`.replaceAll(/\n/g, " "),
			}) as any,
		],
		input,
	})

	const args = await getFnContext({ input: out.IteratorFunction })

	// const responseArgs = await prompts({
	// 	type: "confirm",
	// 	name: "confirm",
	// 	message: `Fn: ${out.IteratorFunction}, Args: ${JSON.stringify(args, null, 2)}`,
	// })

	// if (!responseArgs.confirm) {
	// 	throw new Error("User cancelled")
	// }

	const evalStr = `function getFn() { ${out.IteratorFunction}\n\n return iterator };\ngetFn()`
	const itCode = await runFixing(evalStr, (val) => eval(val))
	// await runFn(itCode, args)

	return out
}

export async function runFixing<R>(fn: string, cb: (val: string) => Promise<R>, tries = 0) {
	if (tries > 3) {
		throw new Error("Failed to run function")
	}

	try {
		return await cb(fn)
	} catch (e) {
		console.error(`Error running function: ${e.message}`, e)
		const fixed = await extractCode(
			await getCompletionNoStream(
				`The following function throws this error: ${e.message}\n\Code with error: ${ts(
					fn,
				)}\n\nFixed code: \`\`\`typescript\n`,
			),
		)
		console.log(`Fixed code: ${ts(fixed)}`)
		return runFixing(fixed, cb, tries + 1)
	}
}

export async function runFn(fn: string, theargs: any, tries = 0) {
	if (tries > 3) {
		throw new Error("Failed to run function")
	}

	return runFixing(
		fn,
		async (inn) => {
			const evalStr = `function getFn() { ${inn}\n\n return iterator };\ngetFn()`
			const iteratorFunction = eval(evalStr)
			return iteratorFunction(theargs, async (innerargs: any) => {
				console.log(`Hello from iterator function`, innerargs)
			})
		},
		tries,
	)
}
