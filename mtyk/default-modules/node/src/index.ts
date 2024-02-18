export type * from "./server"

import { globalDepContext, keyDep } from "modules/deps"
import { GetProvidedDeps } from "modules/deps/TokenDepSpec"

const proxy = new Proxy(
	{},
	{
		get: (target, prop) => {
			try {
				const module = prop as any as string
				const realModule = Object.values(
					globalDepContext.provideSync({
						[`node:${module}`]: keyDep(`node:${module}`),
					}),
				)[0]
				return realModule ?? null
			} catch (e) {
				console.error(e)
			}
			return null
		},
		set: () => {
			throw new Error("Cannot set anything on the default export of the package")
		},
		apply: (target, thisArg, argumentsList) => {
			throw new Error("Cannot call anything on the default export of the package")
		},
	},
) as GetProvidedDeps<typeof import("./server")>

export default proxy
