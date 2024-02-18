import fs from "fs"
import { depFn, keyDep } from "modules/deps/index"
import { addWSFunction } from "modules/rpc-ws/server"

const saveFile = depFn(
	{
		file: keyDep<string>(),
		content: keyDep<string>(),
	},
	async function saveFile({ file, content }) {
		fs.writeFileSync(file, content)

		return null
	},
)

export default addWSFunction(saveFile)
