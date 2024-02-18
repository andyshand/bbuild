import { ContextProviderOptions, ResolutionContext } from "./ContextProviderOptions"
import {
	UniverseContextItem,
	UniverseContextItemType as UniverseContextItemKind,
	createContextItemSuggestion,
	isContextItem,
} from "./UniverseEntityContextItem"

/**
 * A class that, for some other class, can provide context items
 *
 * Examples
 * - File system provider
 * - Project-level FS provider
 * - Typescript provider
 * - Git provider
 * - Notion provider
 * - Tweet provider
 * - Webpage provider
 */
export abstract class ContextProvider<T = any> {
	/**
	 * Matches the type of element we can provide context for
	 */
	matcher: (item: T) => boolean
	id?: string

	/**
	 * Registry of all registered context providers
	 */
	private static registry: ContextProvider[] = []

	/**
	 * Function to add a context provider to the registry
	 */
	static addProvider(provider: ContextProvider) {
		this.registry.push(provider)
	}

	/**
	 * Function to remove a context provider from the registry
	 */
	static removeProvider(provider: ContextProvider) {
		const index = this.registry.indexOf(provider)
		if (index > -1) {
			this.registry.splice(index, 1)
		}
	}

	/**
	 * Function to get all registered context providers
	 */
	static getProviders(): ContextProvider[] {
		return this.registry
	}

	createContextItem = (opts: {
		id: string
		url?: string
		label?: string
		type?: string
		entityType?: string
		paths?: string[]
		aliases?: string[]
		metadata?: Record<string, any>
		parent?: UniverseContextItem
	}): UniverseContextItem => {
		const { parent, ...rest } = opts
		const parentIdArr = parent?.id ? [parent.id] : []
		return {
			type: "entity",
			...rest,
			entityType: `${this.id ?? "context-provider"}:${rest.entityType ?? "entity"}`,
			provider: this.id,
			path: this.id ? [this.id, ...parentIdArr, rest.id] : [...parentIdArr, rest.id],
			contextItem: true,
			fetchedAt: new Date(),
		}
	}

	createContextItemSuggestion = (opts: { id: string; label: string }) => {
		return createContextItemSuggestion(opts)
	}

	static async provide(path: any, filter?: ContextProviderOptions) {
		// Assert item is array of strings, keep any type for legacy atm
		if (!path || !path.length || !Array.isArray(path) || typeof path[0] !== "string") {
			throw new Error("Invalid item, should be path")
		}

		const providers = this.getProviders()
		const promises = providers.map((provider) => provider.provideImpl(path, filter ?? {}))
		const results = await Promise.all(promises)
		return results.flat()
	}

	abstract resolver: ContextResolverMap

	createResolver = <T extends UniverseContextItem>(
		itemOrItems: T | T[],
		fieldResolvers: Record<string, ContextResolver>,
	) => {
		const resolverFn = async (_unused, resolutionContext: ResolutionContext) => {
			const [pathPart] = resolutionContext.partialPath
			const isArr = Array.isArray(itemOrItems)

			let item: T
			// If array, assert that key is plural
			if (isArr) {
				if (pathPart === "") {
					// Return all items if path === '', since user query is likely "path0.",
					// expecting suggestions for all items
					return itemOrItems
				}
				const integer = parseInt(pathPart)

				if (!isNaN(integer)) {
					item = itemOrItems[integer]
				}
				// if (isNaN(integer) || !item) {
				//   item = itemOrItems.find(
				//     (e) =>
				//       this.idMatch(e.id, pathPart, true) ||
				//       e.aliases?.find((a) => this.idMatch(a, pathPart, true))
				//   )
				// }

				// if (!item) {
				//   return []
				// }

				return this.createResolver(null as any, fieldResolvers)
			} else {
				item = itemOrItems as T
			}

			if (pathPart === "") {
				return Object.keys(fieldResolvers).map((e) => {
					return this.createContextItemSuggestion({
						id: resolutionContext.partialPath.join(".") + `.${e}`,
						label: e,
					})
				})
			}

			const thisFieldResolver = fieldResolvers[pathPart]
			if (!thisFieldResolver) {
				throw new Error(`No field resolver for ${pathPart}`)
			}

			const newSubPath = resolutionContext.partialPath.slice(1)
			const newResolutionContext: ResolutionContext = {
				...resolutionContext,
				partialPath: newSubPath,
			}
			return thisFieldResolver(newResolutionContext)
		}

		resolverFn._items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems]
		return resolverFn
	}

	getPossibleSubpathsImpl = (workspace, filter) =>
		// Return all keys in the resolver
		Promise.resolve(Object.keys(this.resolver))

	idMatch = (a: string, b: string, loose = false) => {
		if (loose) {
			return a.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(a.toLowerCase())
		}
		return a.toLowerCase() === b.toLowerCase()
	}
	provideImpl = (path: string[], opts: ContextProviderOptions) => {
		let fullPath = this.id ? path.slice(1) : path
		if (this.id) {
			const [maybeProviderId] = path
			if (!this.idMatch(maybeProviderId, this.id)) {
				return []
			}
		}

		const firstPath = fullPath
		if (!firstPath.length) {
			return []
		}
		const rootContext: ResolutionContext = {
			...opts,
			fullPath,
			createContextItem: (opts) => {
				return this.createContextItem({
					...opts,
					id: this.id + "." + opts.id,
				} as any) // TODO: fix this
			},
			partialPath: firstPath,
		}
		return this.traverseResolverTree(firstPath, this.resolver, rootContext, rootContext)
	}

	traverseResolverTree = async (
		remainingPath: string[],
		resolverOrMap: ContextResolver | Record<string, ContextResolver>,
		parentContext: ResolutionContext,
		rootContext: ResolutionContext,
	) => {
		if (!remainingPath.length) {
			if ("_items" in resolverOrMap) {
				return resolverOrMap?._items ?? []
			}
			return []
		}
		const shouldShowAll = remainingPath[0] === "" && remainingPath.length === 1

		const [resolverKey, ...nextRemainingPath] = remainingPath
		let resolver = typeof resolverOrMap === "function" ? resolverOrMap : resolverOrMap[resolverKey]

		// If no resolver found, try the "*" resolver
		if (!resolver && typeof resolverOrMap !== "function") {
			resolver = resolverOrMap["*"]
		}

		if (!resolver) {
			return Promise.resolve([])
		}
		const resolutionContext: ResolutionContext = {
			...rootContext,
			parent: parentContext,
			partialPath: remainingPath,
			createContextItem: (opts) => {
				return this.createContextItem({
					...opts,
				} as any) // TODO: fix this
			},
		}

		const resultsOrResolver = await resolver.call(this, resolutionContext)

		if (Array.isArray(resultsOrResolver)) {
			// If more path, traverse the result
			if (nextRemainingPath.length > 0) {
				// For each result, continue traversing the resolver tree
				const promises = resultsOrResolver.map((result) => {
					// Check if the result is a leaf node or a non-leaf node
					if (isContextItem(result)) {
						// If it's a leaf node, just return the result
						return Promise.resolve(result)
					} else {
						// Don't think this should happen
						throw new Error("Unexpected result")
					}
				})
				const nestedResults = await Promise.all(promises)
				// Flatten the nested results array
				return nestedResults.flat()
			} else {
				// If no more path, return the results
				return resultsOrResolver
			}
		} else {
			// It should be a resolver, check
			if (typeof resultsOrResolver !== "function") {
				throw new Error("Unexpected result")
			}

			// It's a resolver, so continue traversing the resolver tree
			return this.traverseResolverTree(nextRemainingPath, resultsOrResolver, resolutionContext, rootContext)
		}
	}
}

class TestProvider extends ContextProvider {
	resolver: {} = {}
	matcher = () => true
	provideImpl = () =>
		Promise.resolve([
			{
				id: "test",
				label: "test context value",
			},
		])
}

ContextProvider.addProvider(new TestProvider())

export type ContextResolverMap = {
	[key: string]: ContextResolver
}

export type ContextResolver = (
	resolutionContext: ResolutionContext,
) => Promise<ContextResolver | UniverseContextItemKind[]>
