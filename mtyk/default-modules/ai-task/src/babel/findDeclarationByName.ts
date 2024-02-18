import * as Babel from '@babel/core'

export default function findDeclarationByName(
  sourceCode: string,
  name: string
) {
  let found: any = null
  // Look for all top-level declarations
  const visitor = {
    VariableDeclaration(path: any) {
      const { node } = path
      const { declarations } = node
      for (const declaration of declarations) {
        const { id } = declaration
        if (id.name === name) {
          found = declaration
          // return declaration
        }
      }
    },
    FunctionDeclaration(path: any) {
      const { node } = path
      const { id } = node
      if (id.name === name) {
        // return node
        found = node
      }
    },
  }

  Babel.transformSync(sourceCode, {
    // presets: ['@babel/preset-react'],
    // plugins: ['@babel/plugin-syntax-jsx', { visitor }],
    plugins: [
      ['@babel/plugin-syntax-typescript', { isTSX: true }],
      { visitor },
    ],
  })

  return found ? sourceCode.slice(found.start, found.end) : null
}
