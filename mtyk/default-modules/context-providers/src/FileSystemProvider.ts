import node from "modules/node"
import { ContextProvider, UniverseContextItem } from "modules/context"
import { ResolutionContext } from "modules/context/ContextProviderOptions"

const FS_SERVER_PORT = 41236

export class FileSystemProvider extends ContextProvider<string> {
	id = "fs"
	matcher = (item) => true

	get fs() {
		return node.fs.promises
	}
	get path() {
		return node.path
	}

	resolver = {
		"*": this.resolvePath,
	}

	async resolvePath(resolutionContext: ResolutionContext): Promise<UniverseContextItem[]> {
		const { fullPath, partialPath } = resolutionContext
		const { path, fs } = this
		const { readdir, stat } = fs
		const absPath = "/" + path.join(...fullPath)

		const isDir = await fs.stat(absPath).then((stats) => stats.isDirectory())
		if (!isDir) {
			return []
		}

		const files = await readdir(absPath)

		return Promise.all(
			files.map(async (file) => {
				const filePath = path.join(absPath, file)
				const stats = await stat(filePath)
				// const id = filePath.split("/").join(".")
				const id = filePath

				return resolutionContext.createContextItem({
					id,
					label: file,
					type: stats.isDirectory() ? "directory" : "file",
					data: stats.isDirectory()
						? {}
						: {
								contents: {
									_type: "url",
									url: `http://localhost:${FS_SERVER_PORT}${filePath}`,
								},
						  },
				})
			}),
		)
	}
}

ContextProvider.addProvider(new FileSystemProvider())

// Hack - wait for global dep context to be setup
setTimeout(() => {
	if (node.http) {
		const { http, fs, path } = node

		const server = http.createServer((req, res) => {
			try {
				const decodedPath = decodeURIComponent(req.url)
				const filePath = path.join("/", decodedPath)
				const stream = fs.createReadStream(filePath)
				stream.pipe(res)
			} catch (e) {
				res.statusCode = 500
				res.end()
			}
		})

		server.listen(FS_SERVER_PORT, () => {
			console.log(`File server listening on port ${FS_SERVER_PORT}`)
		})
	}
}, 1000)
