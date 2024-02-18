import { depFn, typeDep } from "modules/deps/index"
import { addWSFunction } from "modules/rpc-ws/server"
import { Deps } from "../../Deps"

type TreeNode = any
const getFileTree = depFn(
	{
		fs: Deps.fs,
		path: Deps.path,
		filePath: typeDep(String),
	},
	async function getFileTree({ fs, filePath, path }): Promise<TreeNode> {
		function getTree(thePath: string): TreeNode {
			return {
				name: thePath.split("/").pop(),
				children: fs.readdirSync(thePath).reduce((files: TreeNode[], file: string) => {
					const name = path.join(thePath, file)
					const isDirectory = fs.statSync(name).isDirectory()
					return isDirectory ? [...files, getTree(name)] : [...files, { name }]
				}, []),
			}
		}

		return getTree(filePath)
	},
)

export default addWSFunction(getFileTree)
