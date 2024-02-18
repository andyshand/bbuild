const babel = require("@babel/core")

export default function splitCode(code: string, pieces: number) {
	const ast = babel.parseSync(code, {
		plugins: [["@babel/plugin-syntax-typescript", { isTSX: true }]],
	})
	const nodes = ast.program.body
	const nodeCount = nodes.length

	if (nodeCount < pieces) {
		// Return the entire code if the number of pieces is greater than the number of nodes in the AST.
		return [code]
	}

	const nodesPerPiece = Math.ceil(nodeCount / pieces)
	let piecesArray: string[] = []

	for (let i = 0; i < pieces; i++) {
		const start = i * nodesPerPiece
		const end = start + nodesPerPiece

		// Check if the end index is greater than the number of nodes in the AST.
		const endIndex = end > nodeCount ? nodeCount : end

		// Use Babel to generate the code for the selected nodes.
		const selectedNodes = nodes.slice(start, endIndex)
		const selectedCode = babel.transformFromAstSync({ type: "Program", body: selectedNodes }, null, {
			plugins: [["@babel/plugin-syntax-typescript", { isTSX: true }]],
		}).code

		piecesArray.push(selectedCode)
	}

	return piecesArray
}
