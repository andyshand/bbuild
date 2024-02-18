import * as ts from "typescript"

interface TypeInfo {
	name: string
	text: string
}

function extractTypes(filePath: string): TypeInfo[] {
	const types: TypeInfo[] = []
	try {
		const file = ts.sys.readFile(filePath)
		if (!file) {
			return types
		}
		const sourceFile = ts.createSourceFile(filePath, file, ts.ScriptTarget.Latest)

		const printer = ts.createPrinter({})
		ts.forEachChild(sourceFile, function visit(node) {
			// Check relevant node types...
			if (
				ts.isTypeAliasDeclaration(node) ||
				ts.isInterfaceDeclaration(node) ||
				ts.isTypeParameterDeclaration(node) ||
				ts.isFunctionTypeNode(node) ||
				ts.isEnumDeclaration(node)
			) {
				const typeText = printer.printNode(ts.EmitHint.Unspecified, node, sourceFile)

				let nodeName
				if (ts.isTypeAliasDeclaration(node)) {
					nodeName = node.name.text
				} else if (ts.isInterfaceDeclaration(node)) {
					nodeName = node.name.text
				} else if (ts.isTypeParameterDeclaration(node)) {
					nodeName = node.name.text
				} else if (ts.isFunctionTypeNode(node)) {
					nodeName = node.name?.getText(sourceFile) ?? ""
				} else if (ts.isEnumDeclaration(node)) {
					nodeName = node.name.text
				}

				types.push({
					name: nodeName,
					text: typeText,
				})
			}
		})

		console.log({ types })
	} catch (e) {
		console.error(e)
	}
	return types
}

export default extractTypes
